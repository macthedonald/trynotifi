## Priority Actions for Cursor

### Phase 1: Content Swap & UI Updates
1. Update header text with dynamic greeting logic
2. Change sidebar navigation labels and routes
3. Replace task cards with unified timeline (reminders + events)
4. Add calendar sync badges and notification indicators
5. Update icon set (Bell, Pill, FileText, Dumbbell, Calendar icons)

### Phase 2: Two-Way Calendar Sync
1. **Export Reminders to Calendar:**
   - Add "Sync to calendar" toggle in reminder create/edit modal
   - Implement calendar selection dropdown (Google/Outlook)
   - Create Supabase Edge Function to create calendar events via API
   - Store calendar_event_id and calendar_provider in reminders table
   - Show calendar badge on synced reminders
   - Handle updates: reminder edit → update calendar event
   - Handle deletion: ask user if they want to delete from calendar too

2. **Import Calendar Events:**
   - Fetch events from Google/Outlook during sync
   - Store in calendar_events table
   - Display in unified timeline with reminders
   - Show provider badges and calendar names

3. **Add Notifications to Calendar Events:**
   - "Set Notifications" button on each event card
   - Modal to configure notification lead times and channels
   - Store in event_reminders table
   - Show bell badge on events with notifications

### Phase 3: Notification Scheduling System
1. **Scheduled Notifications Table:**
   ```sql
   CREATE TABLE scheduled_notifications (
     id UUID PRIMARY KEY,
     user_id UUID NOT NULL,
     reminder_id UUID REFERENCES reminders(id),
     event_id UUID REFERENCES calendar_events(id),
     send_at TIMESTAMP WITH TIME ZONE NOT NULL,
     channels TEXT[] NOT NULL,
     status TEXT DEFAULT 'pending',
     sent_at TIMESTAMP WITH TIME ZONE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   CREATE INDEX idx_scheduled_notifications_send_at 
   ON scheduled_notifications(send_at) WHERE status = 'pending';
   ```

2. **Create Scheduled Jobs:**
   - When reminder created: Schedule notifications based on lead times
   - When event notification added: Schedule notifications based on lead times
   - Store each notification job with exact send_at timestamp

3. **Notification Processor (Cron Job):**
   - Supabase Edge Function runs every minute
   - Fetch pending notifications where send_at <= now
   - Send via Resend (email), Expo Push (push), Twilio (SMS)
   - Mark as sent and log results
   - Handle failures with retry logic

4. **Notification Content:**
   - Use templates for email/push/SMS
   - Include item title, description, time
   - Include deep links back to dashboard
   - Show lead time context ("in 15 minutes", "tomorrow", etc.)
   - Different icons/emojis for reminders vs events

### Phase 4: Data Connection & Realtime
1. Connect unified timeline to Supabase
2. Fetch and combine reminders + events
3. Sort chronologically by time
4. Add realtime subscriptions for both tables
5. Implement filtering (All/Reminders/Events/With Notifications)
6. Add loading skeletons and error states

### Phase 5: Polish & Features
1. Add calendar connection status indicators
2. Implement manual sync button with progress
3. Add notification configuration modals
4. Show notification badges and counts
5. Add calendar sync badges on reminders
6. Add bell badges on events with notifications
7. Implement edit/delete with cascade options
8. Add empty states for each scenario
9. Add smooth animations for updates
10. Implement streak counter

---

## Database Schema Additions

### scheduled_notifications Table
```sql
CREATE TABLE scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reminder_id UUID REFERENCES reminders(id) ON DELETE CASCADE,
  event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  
  -- When to send
  send_at TIMESTAMP WITH TIME ZONE NOT NULL,
  lead_time_minutes INTEGER NOT NULL, -- For display purposes
  
  -- How to send
  channels TEXT[] NOT NULL, -- ['email', 'push', 'sms']
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: Either reminder_id OR event_id must be set
  CONSTRAINT check_item_reference CHECK (
    (reminder_id IS NOT NULL AND event_id IS NULL) OR
    (reminder_id IS NULL AND event_id IS NOT NULL)
  )
);

-- Critical index for cron job performance
CREATE INDEX idx_scheduled_notifications_pending 
ON scheduled_notifications(send_at, status) 
WHERE status = 'pending';

-- Index for user queries
CREATE INDEX idx_scheduled_notifications_user 
ON scheduled_notifications(user_id, status);
```

### Update reminders table
```sql
-- Add calendar sync fields to existing reminders table
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS synced_to_calendar BOOLEAN DEFAULT false;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS calendar_event_id TEXT;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS calendar_provider TEXT CHECK (calendar_provider IN ('google', 'microsoft'));
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS notification_lead_times INTEGER[] DEFAULT '{0}';

-- Index for synced reminders
CREATE INDEX idx_reminders_synced ON reminders(synced_to_calendar, calendar_event_id) 
WHERE synced_to_calendar = true;
```

### Update calendar_events table
```sql
-- Add notification tracking to calendar_events
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS has_notifications BOOLEAN DEFAULT false;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS notification_count INTEGER DEFAULT 0;

-- Trigger to update has_notifications when event_reminders added/removed
CREATE OR REPLACE FUNCTION update_event_notification_status()
RETURNS TRIGGER AS $
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE calendar_events 
    SET has_notifications = true,
        notification_count = (
          SELECT COUNT(*) FROM event_reminders WHERE event_id = NEW.event_id
        )
    WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE calendar_events 
    SET notification_count = (
      SELECT COUNT(*) FROM event_reminders WHERE event_id = OLD.event_id
    )
    WHERE id = OLD.event_id;
    
    UPDATE calendar_events
    SET has_notifications = (notification_count > 0)
    WHERE id = OLD.event_id;
  END IF;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_event_notifications
AFTER INSERT OR DELETE ON event_reminders
FOR EACH ROW EXECUTE FUNCTION update_event_notification_status();
```

---

## Supabase Edge Functions

### 1. sync-calendars Function
```typescript
// supabase/functions/sync-calendars/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { userId } = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  );
  
  // Get user's calendar tokens
  const { data: user } = await supabase
    .from('users')
    .select('google_tokens, microsoft_tokens, timezone')
    .eq('id', userId)
    .single();
  
  let totalSynced = 0;
  const errors = [];
  
  // Sync Google Calendar
  if (user.google_tokens) {
    try {
      const googleEvents = await fetchGoogleCalendarEvents(user.google_tokens, user.timezone);
      await upsertCalendarEvents(supabase, userId, googleEvents, 'google');
      totalSynced += googleEvents.length;
      
      // Schedule notifications for events with user's default settings
      await scheduleDefaultEventNotifications(supabase, userId, googleEvents);
    } catch (error) {
      errors.push({ provider: 'google', error: error.message });
    }
  }
  
  // Sync Microsoft Calendar
  if (user.microsoft_tokens) {
    try {
      const msEvents = await fetchMicrosoftCalendarEvents(user.microsoft_tokens, user.timezone);
      await upsertCalendarEvents(supabase, userId, msEvents, 'microsoft');
      totalSynced += msEvents.length;
      
      await scheduleDefaultEventNotifications(supabase, userId, msEvents);
    } catch (error) {
      errors.push({ provider: 'microsoft', error: error.message });
    }
  }
  
  // Log sync
  await supabase.from('sync_logs').insert({
    user_id: userId,
    provider: errors.length ? 'multiple' : 'all',
    status: errors.length ? 'partial' : 'success',
    events_synced: totalSynced,
    error_message: errors.length ? JSON.stringify(errors) : null,
    completed_at: new Date().toISOString()
  });
  
  return new Response(JSON.stringify({ 
    success: true, 
    eventsCount: totalSynced,
    errors 
  }));
});
```

### 2. create-calendar-event Function
```typescript
// supabase/functions/create-calendar-event/index.ts
// Exports reminder to Google/Outlook Calendar

serve(async (req) => {
  const { reminder, provider, userId } = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  );
  
  // Get user's tokens
  const { data: user } = await supabase
    .from('users')
    .select(`${provider}_tokens, timezone`)
    .eq('id', userId)
    .single();
  
  const tokens = user[`${provider}_tokens`];
  
  // Create event in calendar
  const event = {
    summary: reminder.title,
    description: reminder.description || '',
    start: {
      dateTime: reminder.scheduled_at,
      timeZone: user.timezone
    },
    end: {
      dateTime: new Date(new Date(reminder.scheduled_at).getTime() + 30 * 60000).toISOString(),
      timeZone: user.timezone
    },
    reminders: {
      useDefault: false,
      overrides: [] // We handle notifications ourselves
    }
  };
  
  let eventId;
  
  if (provider === 'google') {
    eventId = await createGoogleCalendarEvent(tokens, event);
  } else if (provider === 'microsoft') {
    eventId = await createMicrosoftCalendarEvent(tokens, event);
  }
  
  return new Response(JSON.stringify({ 
    success: true, 
    eventId,
    provider 
  }));
});
```

### 3. process-notifications Function (Cron Job)
```typescript
// supabase/functions/process-notifications/index.ts
// Runs every minute to send pending notifications

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  );
  
  const now = new Date();
  
  // Fetch pending notifications
  const { data: notifications } = await supabase
    .from('scheduled_notifications')
    .select(`
      *,
      reminders (*),
      calendar_events (*),
      users!scheduled_notifications_user_id_fkey (email, full_name, phone_number, timezone)
    `)
    .eq('status', 'pending')
    .lte('send_at', now.toISOString())
    .limit(100); // Process in batches
  
  for (const notification of notifications) {
    const item = notification.reminders || notification.calendar_events;
    const user = notification.users;
    
    try {
      // Send via each requested channel
      const results = await Promise.allSettled([
        notification.channels.includes('email') && sendEmailNotification(user, item, notification.lead_time_minutes),
        notification.channels.includes('push') && sendPushNotification(user, item, notification.lead_time_minutes),
        notification.channels.includes('sms') && sendSMSNotification(user, item, notification.lead_time_minutes)
      ]);
      
      // Check if all succeeded
      const allSucceeded = results.every(r => r.status === 'fulfilled');
      
      // Update notification status
      await supabase
        .from('scheduled_notifications')
        .update({
          status: allSucceeded ? 'sent' : 'failed',
          sent_at: now.toISOString(),
          error_message: allSucceeded ? null : JSON.stringify(results.filter(r => r.status === 'rejected'))
        })
        .eq('id', notification.id);
      
      // Log each channel
      for (let i = 0; i < notification.channels.length; i++) {
        const channel = notification.channels[i];
        const result = results[i];
        
        await supabase.from('notification_logs').insert({
          user_id: notification.user_id,
          reminder_id: notification.reminder_id,
          event_id: notification.event_id,
          channel,
          status: result.status === 'fulfilled' ? 'sent' : 'failed',
          error_message: result.status === 'rejected' ? result.reason : null,
          sent_at: now.toISOString()
        });
      }
      
    } catch (error) {
      // Handle error
      await supabase
        .from('scheduled_notifications')
        .update({
          status: 'failed',
          error_message: error.message,
          retry_count: notification.retry_count + 1
        })
        .eq('id', notification.id);
      
      // Retry logic: reschedule if retry_count < 3
      if (notification.retry_count < 3) {
        await supabase.from('scheduled_notifications').insert({
          ...notification,
          id: undefined, // New record
          send_at: new Date(now.getTime() + 5 * 60000).toISOString(), // Retry in 5 minutes
          retry_count: notification.retry_count + 1,
          status: 'pending'
        });
      }
    }
  }
  
  return new Response(JSON.stringify({ 
    processed: notifications.length,
    timestamp: now.toISOString()
  }));
});

// Helper functions
async function sendEmailNotification(user, item, leadTime) {
  const isReminder = 'priority' in item;
  const timePhrase = getTimePhrase(leadTime);
  
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Notifi <notifications@notifi.app>',
      to: user.email,
      subject: isReminder ? `⏰ Reminder: ${item.title}` : `📅 Upcoming: ${item.title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${item.title}</h2>
          <p><strong>This is ${timePhrase}!</strong></p>
          ${item.description ? `<p>${item.description}</p>` : ''}
          <p><strong>Time:</strong> ${formatTimeForUser(item.scheduled_at || item.start_time, user.timezone)}</p>
          ${!isReminder && item.location ? `<p><strong>Location:</strong> ${item.location}</p>` : ''}
          ${!isReminder && item.attendees ? `<p><strong>Attendees:</strong> ${item.attendees.length} people</p>` : ''}
          <a href="https://notifi.app/dashboard" style="display: inline-block; padding: 12px 24px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
            View in Notifi
          </a>
        </div>
      `
    })
  });
  
  if (!response.ok) throw new Error('Failed to send email');
  return response.json();
}

async function sendPushNotification(user, item, leadTime) {
  const isReminder = 'priority' in item;
  const timePhrase = getTimePhrase(leadTime, true); // Short version
  
  // Get user's Expo push tokens from profile
  const { data: profile } = await supabase
    .from('users')
    .select('expo_push_token')
    .eq('id', user.id)
    .single();
  
  if (!profile?.expo_push_token) return;
  
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      to: profile.expo_push_token,
      title: isReminder ? `⏰ ${item.title}` : `📅 ${item.title}`,
      body: `${timePhrase} • ${item.description || 'Tap to view details'}`,
      data: {
        type: isReminder ? 'reminder' : 'event',
        id: item.id,
        screen: 'Dashboard'
      },
      sound: 'default',
      priority: isReminder && item.priority === 'urgent' ? 'high' : 'normal'
    })
  });
  
  if (!response.ok) throw new Error('Failed to send push notification');
  return response.json();
}

async function sendSMSNotification(user, item, leadTime) {
  if (!user.phone_number) return;
  
  const isReminder = 'priority' in item;
  const timePhrase = getTimePhrase(leadTime, true);
  const time = formatTimeForUser(item.scheduled_at || item.start_time, user.timezone);
  
  const message = `🔔 Notifi: ${item.title} ${timePhrase} (${time}). ${item.description || ''} View: notifi.app`;
  
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${Deno.env.get('TWILIO_ACCOUNT_SID')}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${Deno.env.get('TWILIO_ACCOUNT_SID')}:${Deno.env.get('TWILIO_AUTH_TOKEN')}`),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: user.phone_number,
        From: Deno.env.get('TWILIO_PHONE_NUMBER'),
        Body: message
      })
    }
  );
  
  if (!response.ok) throw new Error('Failed to send SMS');
  return response.json();
}

function getTimePhrase(leadTimeMinutes, short = false) {
  if (leadTimeMinutes === 0) return short ? 'NOW' : 'now';
  if (leadTimeMinutes < 60) return short ? `in ${leadTimeMinutes}m` : `in ${leadTimeMinutes} minutes`;
  if (leadTimeMinutes < 1440) {
    const hours = Math.floor(leadTimeMinutes / 60);
    return short ? `in ${hours}h` : `in ${hours} hour${hours > 1 ? 's' : ''}`;
  }
  const days = Math.floor(leadTimeMinutes / 1440);
  return short ? `in ${days}d` : `in ${days} day${days > 1 ? 's' : ''}`;
}

function formatTimeForUser(dateTime, timezone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    month: 'short',
    day: 'numeric'
  }).format(new Date(dateTime));
}
```

### 4. Schedule Cron Job
```sql
-- Run in Supabase SQL Editor to schedule the notification processor

SELECT cron.schedule(
  'process-notifications',
  '* * * * *', -- Every minute
  $
    SELECT net.http_post(
      url:='https://your-project.supabase.co/functions/v1/process-notifications',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ) AS request_id;
  $
);
```

---

## Example Commands for Cursor (Updated)

**For two-way calendar sync:**
```
"Implement two-way calendar sync. When user creates reminder with 'Sync to calendar' enabled,
call create-calendar-event Edge Function to create event in Google/Outlook. Store calendar_event_id
and calendar_provider in reminder. Show calendar badge on synced reminders. When user edits
synced reminder, update the calendar event too. When deleting, ask if they want to delete from calendar."
```

**For notification scheduling:**
```
"Implement notification scheduling system. When reminder is created, for each notification lead time,
create entry in scheduled_notifications table with send_at timestamp. Show selected notification
times as chips in reminder card. Allow editing notification settings via modal. Display 'Notifications: 
At time, 15 min before' below reminder description."
```

**For event notifications:**
```
"Add notification configuration for calendar events. Show 'Set Notifications' button on events without
notifications, '🔔 Edit Notifications' on events with notifications. Modal should allow selecting multiple
lead times (5m, 15m, 30m, 1h, 1d, 1w, custom) and channels (email, push, SMS). Save to event_reminders
table and create scheduled_notifications entries. Show bell badge with notification count on event cards."
```

**For notification processor:**
```
"Create process-notifications Edge Function that runs every minute via cron. Fetch pending notifications
where send_at <= now. For each notification, send via Resend (email), Expo (push), and Twilio (SMS)
based on selected channels. Use the provided email/push/SMS templates. Mark as sent and log results.
Handle failures with retry logic (max 3 retries, 5 min delay)."
```

---

## Testing Checklist (Updated)

**Two-Way Sync:**
- [ ] Creating reminder with calendar sync creates calendar event
- [ ] Calendar event ID stored correctly in reminder
- [ ] Calendar badge shows on synced reminders
- [ ] Editing synced reminder updates calendar event
- [ ] Deleting synced reminder asks about calendar deletion
- [ ] Calendar event deletion marks reminder as unsynced
- [ ] Sync works for both Google and Outlook
- [ ] Timezone conversion correct in both directions

**Notifications:**
- [ ] Multiple lead times can be selected
- [ ] Notifications scheduled at correct times (in UTC)
- [ ] Email notifications send successfully via Resend
- [ ] Push notifications send successfully via Expo
- [ ] SMS notifications send successfully via Twilio (Pro only)
- [ ] Notification content includes correct time phrases
- [ ] Notifications respect user's timezone for display
- [ ] Failed notifications retry up to 3 times
- [ ] Notification logs created for tracking

**Calendar Event Notifications:**
- [ ] Can add notifications to any calendar event
- [ ] Multiple lead times supported per event
- [ ] Bell badge shows on events with notifications
- [ ] Notification count displayed correctly
- [ ] Can edit existing event notifications
- [ ] Can remove all notifications from event
- [ ] Notifications trigger at correct times
- [ ] Works for both Google and Outlook events

**UI/UX:**
- [ ] Unified timeline shows both reminders and events chronologically
- [ ] Visual differentiation clear between types
- [ ] Calendar sync status visible on reminders
- [ ] Notification settings easy to understand
- [ ] Filter controls work properly
- [ ] Empty states show appropriate messages
- [ ] Loading states smooth during sync
- [ ] Error messages clear and actionable

---

This completes the comprehensive implementation guide for Notifi with full two-way calendar sync and smart notification scheduling!# Cursor Prompt: Adapt Dashboard to Notifi Features

## Context
I have an existing dashboard UI. I need to adapt it to work with **Notifi** - my reminder and calendar sync SaaS application. Keep the exact styling, layout, and design system, but update the content, features, and functionality to match Notifi's requirements.

## Current Dashboard Structure

```
┌────────────────────────────────────────────────────────────────────┐
│  [N] Notifi                                                        │
├─────────────┬──────────────────────────────────────────────────────┤
│             │  Good Morning, Stqszn!                               │
│  🏠 Home    │  Subtitle text                                       │
│  👤 My prof │                                                      │
│  📅 Schedule│  Tuesday, September 30                               │
│  🕐 History │  [Su Mo Tu We Th Fr Sa] ← Week view                │
│             │  [23 24 25 26 27 28 29]                             │
│             │                                                      │
│             │  ┌──────────────────────────────────────┐           │
│             │  │ [Icon] Design Study                  │  [...]    │
│             │  │ Description text                     │           │
│             │  │ 9:00am - 10:30am                     │           │
│             │  └──────────────────────────────────────┘           │
│             │                                                      │
│  ⚙️ Settings│  [More cards stacked vertically...]                 │
│  ❓ Help?   │                                                      │
│  ↪️ Log out │                                    ┌──────────────┐ │
│             │                                    │ 3D Calendar  │ │
│  ← Collapse │                                    │ Sept 30      │ │
│             │                                    └──────────────┘ │
│             │                                    ┌──────────────┐ │
│             │                                    │ Mini Calendar│ │
│             │                                    │ September    │ │
│             │                                    │ 2025         │ │
│             │                                    │ [+ button]   │ │
│             │                                    └──────────────┘ │
└─────────────┴──────────────────────────────────────────────────────┘
```

---

## What Needs to Change

### 1. Header Section (Keep Current Design)

**Current:** "Good Morning, Stqszn!"  
**Keep:** Dynamic greeting logic you already have

**Current Subtitle:** "Ready to tackle your day? Let's organize your tasks and boost your productivity."  
**Update to:** One of these based on context:
- "You have {count} reminders today" (if count > 0)
- "All clear for today! Enjoy your free time" (if count === 0)
- "Stay on track with your schedule" (generic)
- "{overdue} overdue items need your attention" (if overdue > 0, show in red/orange)

**Keep:** The 3D calendar illustration on the right (perfect for Notifi)

---

### 2. Sidebar Navigation (Keep Current Design)

**Update labels and add new items:**

| Current | New | Icon | Route | Badge |
|---------|-----|------|-------|-------|
| Home | Today | 🏠 Home | `/dashboard` | Show count of today's items |
| My profile | My Profile | 👤 User | `/dashboard/profile` | - |
| Schedule | Upcoming | 📅 Calendar | `/dashboard/upcoming` | - |
| History | Completed | ✓ Check | `/dashboard/completed` | - |
| - | **AI Assistant** | ✨ Sparkles | `/dashboard/ai-chat` | NEW |
| - | **Calendars** | 📆 CalendarDays | `/dashboard/calendars` | NEW - Sync status dot |
| Settings | Settings | ⚙️ Settings | `/dashboard/settings` | - |
| Help? | Help & Support | ❓ Help | `/dashboard/help` | - |
| Log out | Log out | ↪️ Logout | (action) | - |

**Badge/Indicator Logic:**
- "Today" item: Show badge with count of active items (reminders + events)
- "Calendars" item: Show green/red dot (synced/not synced)

**Keep:** Collapse functionality and all current animations

---

### 3. Date Navigation Bar (Keep Current Design)

**Current:** "Tuesday, September 30" with week view

**Keep:** Exact same styling and layout

**Add functionality:**
- Show small colored dots under dates that have items
- Dot colors indicate priority (red=urgent, orange=high, blue=medium, gray=low/events)
- Click date to filter main content to that day
- Current day remains highlighted in purple
- All dates use user's system locale and timezone

**Date formatting:**
```typescript
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat(navigator.language, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }).format(date);
};
```

---

### 4. Main Content Cards (Major Update)

**Current:** Generic task cards (Design Study, Read About Awards, etc.)

**Replace with:** Unified timeline showing BOTH reminders and calendar events in chronological order

#### Card Types & Visual Design

**A. Reminder Cards** (User-created in Notifi)

```tsx
Structure:
┌─┬──────────────────────────────────────────────────┬────────┐
│✓│ [Category Icon] Reminder Title              [...] │        │
│ │ Description text if available                      │ Time   │
│ │ 🏷️ tag1  tag2    📧 ✉️ 📱                         │ Range  │
│ │ 📅 Synced to Google Calendar                      │        │
└─┴──────────────────────────────────────────────────┴────────┘
│← Left border color based on priority
```

**Elements:**
- **Checkbox** (left): Mark complete ✓
- **Left border**: 4px colored border (green=low, blue=medium, orange=high, red=urgent)
- **Icon** (left): Category-based (Bell, Pill, FileText, Dumbbell, etc.)
- **Title**: Bold, medium font
- **Description**: Gray, smaller font (if exists)
- **Time**: Right-aligned, formatted per user's locale
- **Tags**: Small chips below description
- **Notification icons**: Small icons (email 📧, SMS 📱, push 🔔)
- **Calendar badge**: Small "📅 Synced to [Provider]" if synced
- **Three-dot menu** (right): Edit, Delete, Share, Sync options

**Priority Border Colors:**
```css
.priority-low { border-left: 4px solid #10b981; } /* green */
.priority-medium { border-left: 4px solid #3b82f6; } /* blue */
.priority-high { border-left: 4px solid #f97316; } /* orange */
.priority-urgent { border-left: 4px solid #ef4444; } /* red */
```

**B. Calendar Event Cards** (Imported from Google/Outlook)

```tsx
Structure:
┌──┬──────────────────────────────────────────────────┬────────┐
│📅│ [Provider Icon] Event Title                 [...] │        │
│ │ 📍 Location • 👥 5 attendees                      │ Time   │
│ │ 🔔 Notifications: 15m, 1d before                  │ Range  │
│ │ ➕ Set Notifications  |  🔗 Open in Google        │        │
└──┴──────────────────────────────────────────────────┴────────┘
│← Gray or provider-colored border
```

**Elements:**
- **Calendar icon** (left): No checkbox (events are time-bound)
- **Left border**: Gray or provider color (Google: blue, Outlook: blue)
- **Provider badge**: Small logo (top-right corner)
- **Title**: Bold, medium font
- **Location**: 📍 icon + text (if available)
- **Attendees**: 👥 icon + count (if available)
- **Time**: Right-aligned, shows start - end time
- **Notification info**: Shows if notifications set ("🔔 15m, 1d before")
- **Action buttons**: 
  - "➕ Set Notifications" (if none set)
  - "🔔 Edit Notifications" (if set)
  - "🔗 Open in [Provider]"
- **Three-dot menu** (right): View details, Add/Edit notifications, Hide event

**Visual Differentiation:**
- Reminders: Have checkbox, priority-colored border, can be completed
- Events: No checkbox, neutral border, read-only from external calendar
- Both: Same card shape, padding, shadows, hover effects

**Sample Timeline (Replace current cards):**
1. **Take medication** (8:00 AM) - Reminder - Pill icon 💊, health tag, orange border (high priority), synced to Google ✓
2. **Team Standup** (9:00 AM - 9:30 AM) - Google Event - Calendar icon, 5 attendees, has notifications (15m before) 🔔
3. **Submit project proposal** (11:30 AM) - Reminder - FileText icon 📄, work tag, blue border (medium)
4. **Lunch with Client** (12:00 PM - 1:00 PM) - Outlook Event - Calendar icon, "Blue Bottle Coffee" location 📍
5. **Call mom** (2:00 PM) - Reminder - Phone icon 📞, family tag, green border (low), has notifications 🔔
6. **Gym workout** (6:00 PM) - Reminder - Dumbbell icon 🏋️, fitness tag, synced to Outlook ✓

---

### 5. Filter/View Controls (Add Above Cards)

**Add toolbar with filter chips:**
```tsx
[All ✓] [Reminders Only] [Events Only] [With Notifications]
```

**Functionality:**
- "All" (default): Shows both reminders and events
- "Reminders Only": Filters to user-created reminders
- "Events Only": Filters to calendar events
- "With Notifications": Shows only items with notifications configured

**Design:** Use same chip/pill design as tags, with active state

---

### 6. Mini Calendar (Keep Current Design)

**Current:** September 2025 calendar on right side

**Keep:** Exact same styling and position

**Update functionality:**
- Use user's system locale for month/year format
- Respect user's first day of week (Sunday vs Monday)
- Show colored dots on dates with items (color = highest priority that day)
- Click date to jump to that day's view
- "+" button adds quick reminder for selected date
- Selected date has purple circle background

**Localization:**
```typescript
const formatMonthYear = (date: Date) => {
  return new Intl.DateTimeFormat(navigator.language, {
    month: 'long',
    year: 'numeric',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }).format(date);
};
```

---

### 7. Empty States (Add When No Items)

**No items for selected day:**
```
┌──────────────────────────────────────┐
│         📅 ✓                         │
│   No reminders or events today       │
│   You're all caught up!              │
│                                      │
│   [+ Add Reminder]                   │
└──────────────────────────────────────┘
```

**Has events but no reminders:**
```
┌──────────────────────────────────────┐
│         🔔                           │
│   No reminders set for today         │
│   You have 3 calendar events         │
│                                      │
│   [Add Reminder]  [View Events]      │
└──────────────────────────────────────┘
```

**No calendar connected:**
```
┌──────────────────────────────────────┐
│         📆                           │
│   Connect your calendar              │
│   See your schedule alongside        │
│   reminders in one place             │
│                                      │
│   [Connect Google] [Connect Outlook] │
└──────────────────────────────────────┘
```

---

### 8. Calendar Connection Status (Add to Header)

**Add below subtitle or in top-right:**
```tsx
<div className="flex gap-2">
  {googleConnected && (
    <Badge variant="outline" className="flex gap-1 items-center">
      <GoogleIcon className="h-3 w-3" />
      Google Calendar
      <CheckCircle className="h-3 w-3 text-green-500" />
    </Badge>
  )}
  {outlookConnected && (
    <Badge variant="outline">
      <OutlookIcon className="h-3 w-3" />
      Outlook
      <CheckCircle className="h-3 w-3 text-green-500" />
    </Badge>
  )}
  {(!googleConnected || !outlookConnected) && (
    <Button variant="ghost" size="sm">
      <Plus className="h-4 w-4" />
      Connect Calendar
    </Button>
  )}
</div>
```

**Sync status indicator (near calendars badge):**
```tsx
<div className="flex items-center gap-1 text-xs text-muted-foreground">
  {isSyncing ? (
    <>
      <Loader2 className="h-3 w-3 animate-spin" />
      Syncing...
    </>
  ) : lastSync ? (
    <>
      <Check className="h-3 w-3 text-green-500" />
      Synced {formatDistanceToNow(lastSync)} ago
    </>
  ) : null}
  <Button variant="ghost" size="sm" onClick={manualSync}>
    <RefreshCw className="h-3 w-3" />
  </Button>
</div>
```

---

### 9. Quick Add Reminder (Update "+ Button" in Mini Calendar)

**When "+" button clicked, open modal with:**

```tsx
Modal: "Add Reminder"
├── Title input: "What do you need to remember?"
│   Hint: "Try: 'Call Sarah tomorrow at 3pm'"
│
├── Date/Time Picker (user's locale format)
│   Default: Selected date from calendar
│
├── Priority Selector
│   ○ Low  ○ Medium  ○ High  ○ Urgent
│
├── Notification Settings
│   "When should we remind you?"
│   ☐ At time
│   ☐ 5 minutes before
│   ☐ 15 minutes before
│   ☐ 30 minutes before
│   ☐ 1 hour before
│   ☐ 1 day before
│   ☐ Custom (picker)
│
│   "How should we notify you?"
│   ☑ Email
│   ☑ Push Notification
│   ☐ SMS (Pro only)
│
├── Calendar Sync
│   ☐ Sync to calendar
│   If checked: [Dropdown: Google Calendar ▾]
│
├── Tags (optional)
│   [tag input with autocomplete]
│
├── Description (optional)
│   [textarea]
│
└── [Cancel] [Create Reminder]
```

**Default notification settings:**
- Free tier: Email + Push at time
- Pro tier: Email + Push at time + 15 min before

---

### 10. Card Actions (Three-Dot Menus)

**Reminder Card Menu:**
```
✏️ Edit
🔔 Change notifications
📅 Sync to calendar (toggle)
   ├─ If not synced: Select calendar
   └─ If synced: Update/Remove from calendar
👥 Share with someone
🗑️ Delete
   └─ If synced: "Delete from calendar too?"
⏰ Snooze (15m, 1h, 1d, custom)
```

**Calendar Event Card Menu:**
```
🔔 Set/Edit notifications
ℹ️ View full details
🔗 Open in [Google/Outlook]
📋 Copy event link
🚫 Hide this event (won't sync)
🗑️ Remove notifications (if set)
```

---

## Database Integration

### Timezone & Localization
```typescript
// Always store UTC in database
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Save to user profile
await supabase
  .from('users')
  .update({ timezone: userTimezone })
  .eq('id', user.id);
```

### Fetch Dashboard Items (Unified Timeline)
```typescript
const getDashboardItems = async (userId: string, date: Date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  // Fetch reminders
  const { data: reminders } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('scheduled_at', startOfDay.toISOString())
    .lte('scheduled_at', endOfDay.toISOString())
    .order('scheduled_at', { ascending: true });
  
  // Fetch calendar events
  const { data: events } = await supabase
    .from('calendar_events')
    .select(`
      *,
      event_reminders (
        lead_time_minutes,
        notification_channels
      )
    `)
    .eq('user_id', userId)
    .gte('start_time', startOfDay.toISOString())
    .lte('start_time', endOfDay.toISOString())
    .order('start_time', { ascending: true });
  
  // Combine and sort
  const combined = [
    ...reminders.map(r => ({ ...r, type: 'reminder' })),
    ...events.map(e => ({ 
      ...e, 
      type: 'event',
      hasNotifications: e.event_reminders?.length > 0
    }))
  ].sort((a, b) => {
    const timeA = a.type === 'reminder' ? a.scheduled_at : a.start_time;
    const timeB = b.type === 'reminder' ? b.scheduled_at : b.start_time;
    return new Date(timeA).getTime() - new Date(timeB).getTime();
  });
  
  return combined;
};
```

### Realtime Subscriptions
```typescript
useEffect(() => {
  // Subscribe to reminders
  const remindersChannel = supabase
    .channel('reminders')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'reminders',
      filter: `user_id=eq.${user.id}`
    }, () => {
      queryClient.invalidateQueries(['dashboard-items']);
    })
    .subscribe();
  
  // Subscribe to calendar events
  const eventsChannel = supabase
    .channel('calendar_events')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'calendar_events',
      filter: `user_id=eq.${user.id}`
    }, () => {
      queryClient.invalidateQueries(['dashboard-items']);
    })
    .subscribe();
  
  return () => {
    supabase.removeChannel(remindersChannel);
    supabase.removeChannel(eventsChannel);
  };
}, [user.id]);
```

---

## What to Keep EXACTLY As Is

✅ **Keep unchanged:**
- All colors, gradients, backgrounds (purple/pink/blue tones)
- Sidebar glassmorphism effect and styling
- Card shadows, hover effects, border radius
- Date navigation bar design
- Mini calendar styling and animations
- Typography (fonts, sizes, weights)
- Spacing, padding, margins
- Layout structure and grid
- Button styles and states
- 3D calendar illustration
- Responsive breakpoints
- All transitions and animations
- Collapse sidebar functionality

❌ **Don't change:**
- Visual design language
- Color palette
- Component shapes
- Animation timings
- Overall aesthetic

✏️ **Only change:**
- Text content and copy
- Navigation labels
- Card data and structure
- Feature functionality
- Data sources (Supabase queries)
- Business logic

---

## Example Commands for Cursor

**Update header:**
```
"Update header subtitle to show dynamic reminder count. If count > 0: 'You have {count} reminders today'. 
If count === 0: 'All clear for today!'. If overdue > 0: '{overdue} overdue items need your attention' in red/orange."
```

**Replace cards with unified timeline:**
```
"Replace current task cards with unified timeline component. Fetch both reminders and calendar events from Supabase, 
combine them, sort by time. Create two card variants: ReminderCard (with checkbox, priority border, sync badge) 
and EventCard (with provider badge, location, attendee count, notification button). Maintain current card styling 
but differentiate with left border colors and icons."
```

**Add filter controls:**
```
"Add filter chips above cards: 'All', 'Reminders Only', 'Events Only', 'With Notifications'. 
Use same design as existing tags/chips. Filter the timeline based on selection. 
'All' is default and active on page load."
```

**Update sidebar:**
```
"Update sidebar navigation: Keep current design. Add 'AI Assistant' item with Sparkles icon between 
'Completed' and divider. Add 'Calendars' item with CalendarDays icon. Add badge to 'Today' item showing 
count of active items. Add sync status dot to 'Calendars' item (green if synced, red if not)."
```

**Add calendar sync:**
```
"Implement calendar sync toggle in reminder create/edit modal. When enabled, show dropdown to select 
Google/Outlook calendar. On save, call create-calendar-event Edge Function. Store calendar_event_id 
and calendar_provider in reminder. Show small calendar badge on synced reminder cards."
```

**Add event notifications:**
```
"Add 'Set Notifications' button to calendar event cards. When clicked, open modal to configure notification 
lead times (5m, 15m, 30m, 1h, 1d, custom) and channels (email, push, SMS). Save to event_reminders table. 
After saving, show bell badge on card with notification count. Button changes to 'Edit Notifications' if already set."
```

**Add connection status:**
```
"Add calendar connection status badges below header subtitle. Show 'Google Calendar' badge with green checkmark 
if connected, same for Outlook. If neither connected, show 'Connect Calendar' button. Add sync status indicator 
showing last sync time and refresh button."
```

---

## Success Criteria

When complete, the dashboard should:
- ✅ Look identical to current design (colors, layout, spacing, animations)
- ✅ Show unified timeline of reminders + calendar events
- ✅ Have visual differentiation between card types
- ✅ Support two-way calendar sync (Notifi ↔ Google/Outlook)
- ✅ Allow adding notifications to any calendar event
- ✅ Show calendar sync badges on synced reminders
- ✅ Show notification badges on items with notifications set
- ✅ Connect to Supabase for real data
- ✅ Update in real-time via subscriptions
- ✅ Support CRUD operations on reminders
- ✅ Filter timeline by type
- ✅ Respect user's timezone and locale for all dates/times
- ✅ Show proper empty states
- ✅ Display calendar connection status
- ✅ Handle loading and error states gracefully

---

Now you can iterate on specific parts by referencing these requirements!

---

### 2. Sidebar Navigation Items

**Current Items → New Items:**

| Current | New | Icon | Route |
|---------|-----|------|-------|
| Home | Today | Home icon | `/dashboard` |
| My profile | My Profile | User icon | `/dashboard/profile` |
| Schedule | Upcoming | Calendar icon | `/dashboard/upcoming` |
| History | Completed | CheckCircle icon | `/dashboard/completed` |
| ─────── | ─────── | ─────── | ─────── |
| - | AI Assistant | Sparkles icon | `/dashboard/ai-chat` |
| - | Calendars | CalendarDays icon | `/dashboard/calendars` |
| Settings | Settings | Settings icon | `/dashboard/settings` |
| Help? | Help & Support | HelpCircle icon | `/dashboard/help` |
| Log out | Log out | LogOut icon | (action) |

**New "Calendars" Page Purpose:**
- Manage connected calendars (Google, Outlook)
- View sync status and last sync time
- Select which calendars to import from
- Configure sync settings (frequency, date range)
- Connect/disconnect calendar accounts
- View sync logs and troubleshoot issues

---

### 3. Main Content: Reminders List

**Current:** Task cards showing "Design Study", "Read About Awards", "Add Your Work", "Make a Chart"

**New:** Replace with a unified timeline showing both reminders AND calendar events

#### Combined View Structure
Display in chronological order, mixing both types:
- **Reminders** (user-created) - Can sync TO connected calendars
- **Calendar Events** (imported from Google/Outlook) - Can have notification reminders added

#### Reminder Card Structure
```tsx
{
  type: "reminder"
  icon: // Based on category (default: Bell icon)
  title: "Call mom"
  description: "Weekly check-in call" // Optional, gray text
  time: "2:00 PM - 2:30 PM" // Right-aligned, formatted per user locale
  priority: "medium" // Affects left border color
  status: "active" // or "completed"
  tags: ["family", "weekly"] // Optional chips
  notificationChannels: ["email", "push", "sms"] // Show icons
  syncedToCalendar: true // Shows calendar sync badge
  calendarEventId: "abc123" // If synced
  calendarProvider: "google" | "outlook" // If synced
}
```

#### Calendar Event Card Structure
```tsx
{
  type: "event"
  icon: Calendar icon (small provider logo: Google/Outlook badge)
  title: "Team Standup"
  description: "Daily sync meeting" // From event description
  time: "9:00 AM - 9:30 AM" // Start - End time
  location: "Zoom" or "Conference Room B" // If available
  attendees: ["john@example.com", "sarah@example.com"] // Optional, show count
  source: "google" | "outlook" // Show subtle badge
  calendarName: "Work Calendar" // Show which calendar
  hasNotifications: true // Bell badge if user added notifications
  notificationSettings: { // User's notification preferences for this event
    leadTimes: [15, 1440], // 15 min and 1 day before
    channels: ["email", "push"]
  }
}
```

**Visual Differentiation:**
- **Reminders**: Left border (colored by priority), checkbox on left, full edit controls, optional calendar sync badge
- **Calendar Events**: Left border (neutral gray or provider color), calendar icon on left, read-only with notification bell badge if reminders set
- Both types maintain the same card design language
- **Synced Reminders**: Show small calendar badge on reminder card indicating it's synced

**Time Formatting (User's System Settings):**
```typescript
// Format time based on user's locale and 12/24hr preference
const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat(navigator.language, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    hour12: undefined // Auto-detect from locale
  }).format(date);
};
// US: "2:00 PM", UK: "14:00", etc.
```

**Sample Combined Timeline to Display:**
1. **Take medication** (8:00 AM) - Reminder - Pill icon, health tag, high priority, synced to Google Calendar ✓
2. **Team Standup** (9:00 AM - 9:30 AM) - Google Calendar Event - Calendar icon, work calendar, has notifications (15 min before) 🔔
3. **Submit project proposal** (11:30 AM) - Reminder - FileText icon, work tag, not synced
4. **Lunch with Client** (12:00 PM - 1:00 PM) - Outlook Event - Calendar icon, location shown, has notifications (30 min before) 🔔
5. **Call mom** (2:00 PM - 2:30 PM) - Reminder - Bell icon, family tag, synced to Outlook ✓
6. **Gym workout** (6:00 PM) - Reminder - Dumbbell icon, fitness tag, synced to Google Calendar ✓

**Keep:** 
- Three-dot menu on each card
- Card hover effects
- Time display format on the right

**Add for Reminders:**
- Left border colored by priority (green=low, blue=medium, orange=high, red=urgent)
- Small notification channel icons at bottom right (email, SMS, push)
- Checkbox on left to mark complete (checkmark when done, strikethrough title)
- Tag chips below description
- Calendar sync badge (small calendar icon) if synced
- "Sync to Calendar" toggle in three-dot menu

**Add for Calendar Events:**
- Neutral left border or provider color (Google: blue, Outlook: blue)
- Small provider badge/logo (top-right corner)
- Location icon + text if location exists
- Attendee count badge if multiple attendees
- "🔔 Set Notifications" button (appears on hover or always visible)
- Bell badge if notifications already configured
- "Open in [Google/Outlook]" link in three-dot menu
- No completion checkbox (events are time-bound, not tasks)
- Show configured notification times below title if set

**Filtering Options (Add to toolbar):**
- "All" (default - shows both)
- "Reminders Only"
- "Events Only"
- "With Notifications" (shows only items that have notifications set)
- Filter by calendar (if multiple connected)

---

### 3.1 Calendar Connection Status

**Add to Dashboard Header Area:**
Show connection status with subtle badges:

```tsx
// Connected calendars indicator
<div className="flex gap-2">
  {googleConnected && (
    <Badge variant="outline">
      <GoogleIcon /> Google Calendar
    </Badge>
  )}
  {outlookConnected && (
    <Badge variant="outline">
      <OutlookIcon /> Outlook
    </Badge>
  )}
  {!googleConnected && !outlookConnected && (
    <Button variant="ghost" size="sm">
      <Plus /> Connect Calendar
    </Button>
  )}
</div>
```

**Placement:** Below main header or in top-right corner near profile

---

### 3.2 Two-Way Calendar Sync

#### A. Syncing Reminders TO Calendar (Export)

**When user creates/edits a reminder:**

```typescript
// User toggles "Sync to Calendar" option
const syncReminderToCalendar = async (reminder: Reminder, provider: 'google' | 'outlook') => {
  // Call Supabase Edge Function to create calendar event
  const { data, error } = await supabase.functions.invoke('create-calendar-event', {
    body: {
      reminder,
      provider,
      userId: user.id
    }
  });
  
  if (error) {
    toast.error('Failed to sync to calendar');
    return;
  }
  
  // Update reminder with calendar event ID
  await supabase
    .from('reminders')
    .update({
      synced_to_calendar: true,
      calendar_event_id: data.eventId,
      calendar_provider: provider
    })
    .eq('id', reminder.id);
  
  toast.success(`Synced to ${provider === 'google' ? 'Google' : 'Outlook'} Calendar`);
};
```

**Calendar Event Creation Details:**
```typescript
// What gets synced to calendar
{
  summary: reminder.title,
  description: reminder.description || '',
  start: {
    dateTime: reminder.scheduled_at,
    timeZone: user.timezone
  },
  end: {
    dateTime: addMinutes(reminder.scheduled_at, 30), // Default 30min duration
    timeZone: user.timezone
  },
  reminders: {
    useDefault: false, // We'll handle notifications ourselves
    overrides: [] // Don't use calendar's native reminders
  }
}
```

**Bi-directional Updates:**
- If user edits reminder in Notifi → update calendar event
- If user edits event in calendar → update reminder (via webhook/sync)
- If user deletes reminder → optionally delete calendar event (ask user)
- If user deletes calendar event → mark reminder as unsynced

---

#### B. Adding Notifications to Calendar Events (Import)

**When user sets notifications for a calendar event:**

```typescript
// User clicks "Set Notifications" on calendar event
const setEventNotifications = async (
  eventId: string,
  leadTimes: number[], // Minutes before event
  channels: string[]
) => {
  // Create entries in event_reminders table
  const reminders = leadTimes.map(leadTime => ({
    user_id: user.id,
    event_id: eventId,
    lead_time_minutes: leadTime,
    notification_channels: channels
  }));
  
  const { error } = await supabase
    .from('event_reminders')
    .upsert(reminders, {
      onConflict: 'event_id,lead_time_minutes'
    });
  
  if (!error) {
    toast.success('Notifications set successfully');
  }
};
```

**Notification Options for Calendar Events:**
```tsx
// Modal when clicking "Set Notifications"
<Dialog>
  <DialogTitle>Set notifications for "{eventTitle}"</DialogTitle>
  <DialogContent>
    <Label>When should we remind you?</Label>
    <CheckboxGroup>
      <Checkbox value="5">5 minutes before</Checkbox>
      <Checkbox value="15">15 minutes before</Checkbox>
      <Checkbox value="30">30 minutes before</Checkbox>
      <Checkbox value="60">1 hour before</Checkbox>
      <Checkbox value="1440">1 day before</Checkbox>
      <Checkbox value="10080">1 week before</Checkbox>
      <Checkbox value="custom">Custom...</Checkbox>
    </CheckboxGroup>
    
    <Label>How should we notify you?</Label>
    <CheckboxGroup>
      <Checkbox value="email" defaultChecked>Email</Checkbox>
      <Checkbox value="push" defaultChecked>Push Notification</Checkbox>
      <Checkbox value="sms">SMS (Pro only)</Checkbox>
    </CheckboxGroup>
    
    <Button onClick={handleSave}>Save Notifications</Button>
  </DialogContent>
</Dialog>
```

---

### 3.3 Notification Scheduling System

**CRITICAL: All notifications must be scheduled and sent based on user's specified lead times**

#### Notification Trigger Logic

**For Reminders:**
```typescript
// When reminder is created/updated
const scheduleNotifications = async (reminder: Reminder) => {
  const { scheduled_at, notification_channels, notification_lead_times } = reminder;
  
  // notification_lead_times is array of minutes before scheduled_at
  // Example: [0, 15, 1440] = at time, 15 min before, 1 day before
  
  for (const leadTime of notification_lead_times) {
    const sendAt = subMinutes(new Date(scheduled_at), leadTime);
    
    // Schedule notification job in database
    await supabase.from('scheduled_notifications').insert({
      reminder_id: reminder.id,
      user_id: reminder.user_id,
      send_at: sendAt.toISOString(),
      channels: notification_channels,
      status: 'pending'
    });
  }
};
```

**For Calendar Events (with user-set notifications):**
```typescript
// When event_reminder is created
const scheduleEventNotifications = async (event: CalendarEvent, eventReminder: EventReminder) => {
  const { start_time } = event;
  const { lead_time_minutes, notification_channels } = eventReminder;
  
  const sendAt = subMinutes(new Date(start_time), lead_time_minutes);
  
  await supabase.from('scheduled_notifications').insert({
    event_id: event.id,
    user_id: event.user_id,
    send_at: sendAt.toISOString(),
    channels: notification_channels,
    status: 'pending'
  });
};
```

#### Notification Processor (Supabase Edge Function - Cron Job)

**Runs every minute to check for pending notifications:**

```typescript
// Supabase Edge Function: process-notifications
// Scheduled to run every minute via pg_cron

export default async (req: Request) => {
  const now = new Date();
  
  // Fetch all pending notifications that should be sent now
  const { data: pendingNotifications } = await supabase
    .from('scheduled_notifications')
    .select(`
      *,
      reminders (*),
      calendar_events (*)
    `)
    .eq('status', 'pending')
    .lte('send_at', now.toISOString())
    .order('send_at', { ascending: true });
  
  for (const notification of pendingNotifications) {
    const item = notification.reminders || notification.calendar_events;
    const user = await getUser(notification.user_id);
    
    // Send via requested channels
    await Promise.allSettled([
      notification.channels.includes('email') && sendEmail(user, item),
      notification.channels.includes('push') && sendPushNotification(user, item),
      notification.channels.includes('sms') && sendSMS(user, item)
    ]);
    
    // Mark as sent
    await supabase
      .from('scheduled_notifications')
      .update({ 
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', notification.id);
    
    // Log notification
    await supabase.from('notification_logs').insert({
      user_id: notification.user_id,
      reminder_id: notification.reminder_id,
      event_id: notification.event_id,
      channel: notification.channels.join(','),
      status: 'sent',
      sent_at: new Date().toISOString()
    });
  }
  
  return new Response(JSON.stringify({ processed: pendingNotifications.length }));
};
```

#### Notification Content Templates

**Email Template:**
```typescript
const getEmailContent = (item: Reminder | CalendarEvent, leadTime: number) => {
  const isReminder = 'priority' in item;
  const timePhrase = leadTime === 0 ? 'now' : 
                     leadTime < 60 ? `in ${leadTime} minutes` :
                     leadTime < 1440 ? `in ${leadTime / 60} hours` :
                     `in ${leadTime / 1440} days`;
  
  return {
    subject: isReminder 
      ? `⏰ Reminder: ${item.title}` 
      : `📅 Upcoming: ${item.title}`,
    body: `
      <h2>${item.title}</h2>
      <p>This is ${timePhrase}!</p>
      ${item.description ? `<p>${item.description}</p>` : ''}
      <p><strong>Time:</strong> ${formatTime(item.scheduled_at || item.start_time)}</p>
      ${!isReminder && item.location ? `<p><strong>Location:</strong> ${item.location}</p>` : ''}
      <a href="https://notifi.app/dashboard">View in Notifi</a>
    `
  };
};
```

**Push Notification:**
```typescript
const getPushContent = (item: Reminder | CalendarEvent, leadTime: number) => {
  const isReminder = 'priority' in item;
  const timePhrase = leadTime === 0 ? 'Now' : 
                     leadTime < 60 ? `In ${leadTime}m` :
                     leadTime < 1440 ? `In ${leadTime / 60}h` :
                     `In ${leadTime / 1440}d`;
  
  return {
    title: isReminder ? `⏰ ${item.title}` : `📅 ${item.title}`,
    body: `${timePhrase} • ${item.description || 'Click to view details'}`,
    data: {
      type: isReminder ? 'reminder' : 'event',
      id: item.id,
      deepLink: `/dashboard/${isReminder ? 'reminders' : 'events'}/${item.id}`
    }
  };
};
```

**SMS Template:**
```typescript
const getSMSContent = (item: Reminder | CalendarEvent, leadTime: number) => {
  const isReminder = 'priority' in item;
  const timePhrase = leadTime === 0 ? 'NOW' : 
                     leadTime < 60 ? `in ${leadTime}min` :
                     leadTime < 1440 ? `in ${leadTime / 60}hr` :
                     `in ${leadTime / 1440}d`;
  
  const time = formatTime(item.scheduled_at || item.start_time);
  
  return `🔔 Notifi: ${item.title} ${timePhrase} (${time}). ${item.description || ''} - View: notifi.app`;
};
```

---

### 4. Date Navigation Bar

**Current:** Shows "August, 25 Tuesday" with week view (Su-Sa)

**Update to use User's System Settings:**

```typescript
// Date formatting based on user's locale and timezone
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat(navigator.language, {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }).format(date);
};

// Example output based on system:
// US English: "August 25 Tuesday"
// UK English: "25 August Tuesday"
// Spanish: "25 de agosto martes"
```

**Week View Days:**
```typescript
// Get localized day names
const weekDays = Array.from({ length: 7 }, (_, i) => {
  const date = new Date(2024, 0, i); // Any week
  return new Intl.DateTimeFormat(navigator.language, { 
    weekday: 'short',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }).format(date);
});
// Output: ['Sun', 'Mon', 'Tue', ...] or ['Dom', 'Lun', 'Mar', ...] etc.
```

**Keep:** 
- Same design and layout
- Previous/next week arrows

**Update Functionality:**
- Clicking a date filters reminders for that day
- Show small dot indicators under dates that have reminders
- Current day remains highlighted in purple
- All dates respect user's system timezone

---

### 5. Mini Calendar (Right Side)

**Current:** Shows "August 2021" monthly calendar

**Update to use User's System Settings:**

```typescript
// Month/Year header using user's locale
const formatMonthYear = (date: Date) => {
  return new Intl.DateTimeFormat(navigator.language, {
    month: 'long',
    year: 'numeric',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }).format(date);
};
// Output: "August 2025" or "agosto de 2025" or "août 2025" etc.
```

**Week starts on:**
```typescript
// Respect user's locale for first day of week
const getFirstDayOfWeek = () => {
  const locale = navigator.language;
  // US/CA/MX: Sunday (0), Most others: Monday (1)
  return new Intl.Locale(locale).weekInfo?.firstDay || 0;
};
```

**Date numbers:**
```typescript
// Use locale-appropriate number formatting
const formatDayNumber = (day: number) => {
  return new Intl.NumberFormat(navigator.language).format(day);
  // Most locales: "15", Arabic: "١٥", etc.
};
```

**Update:**
- Change to current month/year in user's format
- Show small colored dots on dates with reminders (color = highest priority reminder that day)
- Clicking a date navigates to that day's view
- "TODAY" button jumps to current date (in user's timezone)
- Selected date should have purple circle background
- Calendar grid respects user's first day of week setting

---

### 6. Quick Add Button

**Current:** Large "+" button at bottom of reminders list

**Keep:** Same position and style

**Update Functionality:**
When clicked, open a modal/dialog with:
- Title input (placeholder: "What do you need to remember?")
- Natural language parsing hint: "Try: 'Call Sarah tomorrow at 3pm'"
- Date/time picker (defaults to today, uses user's locale format)
- Priority selector (Low, Medium, High, Urgent)
- **Notification Settings Section:**
  - **When to notify:** Multi-select checkboxes
    - At time of reminder
    - 5 minutes before
    - 15 minutes before
    - 30 minutes before
    - 1 hour before
    - 2 hours before
    - 1 day before
    - 1 week before
    - Custom (time picker)
  - **How to notify:** Checkboxes
    - Email (always available)
    - Push Notification (always available)
    - SMS (Pro tier only)
- **Calendar Sync Toggle:**
  - "Sync to calendar" checkbox
  - If enabled: Dropdown to select calendar (Google/Outlook)
  - Info text: "This reminder will appear in your selected calendar"
- Tags input
- Description textarea (optional)
- "Create Reminder" button

**Date/Time Picker Localization:**
```typescript
// Use native HTML input or library that respects locale
<input 
  type="datetime-local" 
  // Automatically formats based on user's system settings
  // US: MM/DD/YYYY, 12-hour
  // UK: DD/MM/YYYY, 24-hour
  // ISO: YYYY-MM-DD
/>

// When saving to DB:
// 1. Convert to UTC for storage
const utcDate = new Date(localDateTimeValue).toISOString();

// 2. Create scheduled notifications based on lead times
await scheduleNotifications(reminder);

// 3. If "Sync to calendar" enabled, create calendar event
if (syncToCalendar) {
  await syncReminderToCalendar(reminder, selectedCalendar);
}
```

**Default Notification Settings:**
- Free tier: Email + Push at time (0 minutes before)
- Pro tier: Email + Push at time + 15 minutes before

---

### 7. Empty State

**Add:** When user has no reminders OR events for selected day:
```
[Icon: Calendar with checkmark]
No reminders or events for today
You're all caught up! Enjoy your free time or add something new.
[+ Add Reminder button]
```

**Partial Empty States:**

**If has events but no reminders:**
```
[Icon: Bell]
No reminders set for today
You have {count} calendar events. Want to add reminders for them?
[View Events button]
```

**If has reminders but no events:**
```
[Icon: Calendar]
No calendar events today
Connect your calendar to see your schedule alongside reminders.
[Connect Calendar button]
```

---

### 8. Card Actions

**Reminder Card Three-Dot Menu:**
- ✏️ Edit
- 🔔 Change notifications
- 📅 Sync to calendar (toggle on/off)
  - If on: Select calendar (Google/Outlook)
  - If synced: "Update in calendar" or "Remove from calendar"
- 👥 Share with someone
- 🗑️ Delete
  - If synced to calendar: Ask "Delete from calendar too?"
- ⏰ Snooze (mobile view)

**Calendar Event Card Three-Dot Menu:**
- 🔔 Set/Edit notifications (opens modal)
- 🔗 Open in [Google/Outlook]
- 📋 Copy event link
- ℹ️ View details (full modal with attendees, description, etc.)
- 🚫 Hide this event (won't sync in future)
- 🗑️ Remove notifications (if set)

**"Set Notifications" Button on Event Cards:**
- Primary action for calendar events without notifications
- Opens modal to configure notification lead times and channels
- After adding, button changes to "🔔 Edit Notifications"
- Shows bell badge on card with notification count

**"Sync to Calendar" Toggle on Reminder Cards:**
- Appears in create/edit modal
- If enabled: Select which calendar (Google/Outlook)
- Creates event in selected calendar automatically
- Shows calendar badge on reminder card when synced
- If reminder updated: Syncs changes to calendar event
- If calendar event modified externally: Updates reminder (via sync)

---

### 9. Real-time Features to Add

1. **Live Updates:** When a reminder or event is created/updated/deleted in Supabase, reflect immediately
2. **Notification Badge:** On sidebar "Today" item, show count of active reminders + events
3. **Overdue Section:** If there are overdue reminders, show them in red banner at top
4. **Streak Display:** Small badge near profile showing current streak (e.g., "🔥 7 day streak")
5. **Calendar Sync Status:** Show syncing indicator when calendar sync is in progress
6. **Event Update Notifications:** When calendar event changes, show toast notification
7. **Upcoming Soon Badge:** Show badge on items starting in next 15 minutes

---

### 10. Responsive Behavior

**Keep:** Current responsive design

**Ensure:**
- Mobile: Sidebar collapses to hamburger menu
- Mobile: Mini calendar hidden, accessible via bottom sheet
- Mobile: Reminder cards stack vertically with full width
- Tablet: Hybrid view with collapsible sidebar

---

## Database Integration

### Timezone Handling
**CRITICAL: All database timestamps are stored in UTC. Convert for display using user's system timezone.**

```typescript
// Get user's timezone
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
// Example: "America/New_York", "Europe/London", "Asia/Tokyo"

// Store user timezone in profile for server-side operations
await supabase
  .from('users')
  .update({ timezone: userTimezone })
  .eq('id', user.id);
```

### Fetch Reminders + Calendar Events for Today View
```tsx
// Fetch both reminders and calendar events
const { data: items, isLoading } = useDashboardItems({
  date: selectedDate, // In user's timezone
  userId: user.id,
  includeReminders: true,
  includeEvents: true
});
```

### Supabase Queries

**Fetch Reminders:**
```typescript
const fetchTodayReminders = async (userId: string, date: Date) => {
  // Convert user's local date to UTC range for query
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('scheduled_at', startOfDay.toISOString()) // UTC
    .lte('scheduled_at', endOfDay.toISOString()) // UTC
    .order('scheduled_at', { ascending: true });
  
  // Dates returned from DB are UTC, will be formatted to user's locale on display
  return data?.map(r => ({ ...r, type: 'reminder' })) || [];
};
```

**Fetch Calendar Events:**
```typescript
const fetchTodayEvents = async (userId: string, date: Date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const { data, error } = await supabase
    .from('calendar_events')
    .select(`
      *,
      event_reminders (
        id,
        lead_time_minutes,
        notification_channels,
        triggered_at
      )
    `)
    .eq('user_id', userId)
    .gte('start_time', startOfDay.toISOString())
    .lte('start_time', endOfDay.toISOString())
    .order('start_time', { ascending: true });
  
  return data?.map(e => ({ 
    ...e, 
    type: 'event',
    hasReminder: e.event_reminders && e.event_reminders.length > 0
  })) || [];
};
```

**Combine and Sort:**
```typescript
const getDashboardItems = async (userId: string, date: Date) => {
  const [reminders, events] = await Promise.all([
    fetchTodayReminders(userId, date),
    fetchTodayEvents(userId, date)
  ]);
  
  // Combine and sort by time
  const combined = [...reminders, ...events].sort((a, b) => {
    const timeA = a.type === 'reminder' ? a.scheduled_at : a.start_time;
    const timeB = b.type === 'reminder' ? b.scheduled_at : b.start_time;
    return new Date(timeA).getTime() - new Date(timeB).getTime();
  });
  
  return combined;
};
```
```

### Realtime Subscription
```typescript
useEffect(() => {
  // Subscribe to reminders changes
  const remindersChannel = supabase
    .channel('reminders')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'reminders',
        filter: `user_id=eq.${user.id}`
      },
      (payload) => {
        // Refresh reminders list
        queryClient.invalidateQueries(['dashboard-items']);
      }
    )
    .subscribe();
  
  // Subscribe to calendar events changes (from sync)
  const eventsChannel = supabase
    .channel('calendar_events')
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'calendar_events',
        filter: `user_id=eq.${user.id}`
      },
      (payload) => {
        // Refresh events list
        queryClient.invalidateQueries(['dashboard-items']);
      }
    )
    .subscribe();
    
  return () => {
    supabase.removeChannel(remindersChannel);
    supabase.removeChannel(eventsChannel);
  };
}, [user.id]);
```

---

### Calendar Sync Implementation

**Sync Trigger Options:**
1. **Manual Sync**: User clicks "Sync Now" button
2. **Automatic Sync**: Scheduled Supabase function runs daily
3. **Webhook Sync** (Pro tier): Real-time via Google Push Notifications

**Manual Sync Function:**
```typescript
const syncCalendars = async (userId: string) => {
  // Call Supabase Edge Function
  const { data, error } = await supabase.functions.invoke('sync-calendars', {
    body: { userId }
  });
  
  if (error) {
    toast.error('Failed to sync calendars');
    return;
  }
  
  // Log sync result
  await supabase.from('sync_logs').insert({
    user_id: userId,
    provider: data.provider,
    status: data.status,
    events_synced: data.eventsCount,
    completed_at: new Date().toISOString()
  });
  
  toast.success(`Synced ${data.eventsCount} events`);
  
  // Refresh dashboard
  queryClient.invalidateQueries(['dashboard-items']);
};
```

**Sync Status Indicator:**
```tsx
// Show in header or sidebar
<div className="flex items-center gap-2 text-sm text-muted-foreground">
  {isSyncing ? (
    <>
      <Loader2 className="h-4 w-4 animate-spin" />
      Syncing calendars...
    </>
  ) : lastSync ? (
    <>
      <Check className="h-4 w-4 text-green-500" />
      Last synced {formatDistanceToNow(lastSync)} ago
    </>
  ) : (
    <>
      <AlertCircle className="h-4 w-4 text-yellow-500" />
      Never synced
    </>
  )}
  <Button variant="ghost" size="sm" onClick={syncCalendars}>
    <RefreshCw className="h-4 w-4" />
  </Button>
</div>
```

---

## Copy Changes Summary

### Throughout the App:
| Current Term | New Term |
|--------------|----------|
| Task | Reminder |
| Project | Event (for calendar items) |
| Work | Schedule |
| Collaborate | Share |
| Productivity | Never miss |

### Tooltips & Microcopy:
- "Add task" → "Add reminder"
- "Complete task" → "Mark as done"
- "Task details" → "Reminder details"
- "No tasks today" → "No reminders today"

---

## Priority Actions for Cursor

### Phase 1: Content Swap
1. Update header text and subtitle
2. Change sidebar navigation labels and routes
3. Replace task card data with reminder examples
4. Update icon set (Bell, Pill, FileText, Dumbbell instead of generic task icons)

### Phase 2: Feature Additions
1. Add priority borders to reminder cards
2. Add notification channel icons
3. Add checkbox for completion
4. Add tag chips
5. Implement quick add modal with proper form

### Phase 3: Data Connection
1. Connect to Supabase `reminders` table
2. Implement CRUD operations
3. Add realtime subscriptions
4. Add loading and error states

### Phase 4: Polish
1. Add empty states
2. Add overdue banner
3. Add streak counter
4. Add reminder count badges
5. Add smooth animations for card updates

---

## Example Commands for Cursor

**To start:**
```
"Update the header section: change title to 'Never Miss What Matters' 
and subtitle to 'Your smart reminder assistant synced with your calendar'"
```

**For sidebar:**
```
"Update sidebar navigation: rename 'Home' to 'Today', 'Schedule' to 'Upcoming', 
'History' to 'Completed'. Add new item 'AI Assistant' with Sparkles icon 
between Completed and Settings"
```

**For calendar integration:**
```
"Add calendar event card component. Should show: calendar icon with provider badge,
title, time range, location if available, attendee count, '+ Remind Me' button.
Use neutral gray left border. Include three-dot menu with 'Add reminder', 
'Open in Google/Outlook', 'View details' options. No completion checkbox."
```

**For unified timeline:**
```
"Create unified dashboard view that fetches both reminders and calendar events,
combines them, sorts by time chronologically. Add filter buttons for 'All',
'Reminders Only', 'Events Only'. Show calendar connection status badge in header.
Implement different card styles for each type while maintaining design consistency."
```

**For event reminders:**
```
"When user clicks '+ Remind Me' on calendar event, open modal to create event reminder.
Show dropdown with options: 5 min, 15 min, 30 min, 1 hour, 1 day before, or custom.
Allow selecting notification channels. Save to event_reminders table.
After creating, show small bell badge on event card."
```

**For calendar sync:**
```
"Add sync status indicator showing last sync time and sync button. Implement
manual sync trigger that calls Supabase Edge Function. Show loading state during sync.
Log sync results to sync_logs table. Display toast with events synced count.
Refresh dashboard automatically after sync completes."
```

**For data connection:**
```
"Connect the reminders list to Supabase. Fetch reminders for the selected date 
where status='active' and user_id matches current user. Sort by scheduled_at. 
Add loading skeleton and empty state. Subscribe to realtime changes."
```

**For quick add:**
```
"Update the '+' button to open a modal with reminder creation form. Include:
title input, date/time picker, priority dropdown, notification checkboxes,
tags input, description textarea. On submit, create reminder in Supabase
and close modal. Show success toast."
```

---

## What to Keep Exactly As Is

✅ **Keep unchanged:**
- All colors, gradients, and backgrounds
- Sidebar glassmorphism effect
- Card shadows and hover effects
- Date navigation bar styling
- Mini calendar design
- Button styles
- Spacing and padding
- Typography and fonts
- Responsive breakpoints
- Overall layout structure

❌ **Don't change:**
- The visual design language
- Animation timings
- Border radius values
- Color palette

✏️ **Only change:**
- Text content and copy
- Navigation labels
- Card data and icons
- Feature functionality
- Data connections

---

## Success Criteria

When complete, the dashboard should:
- ✅ Look identical to the current design
- ✅ Show reminders instead of generic tasks
- ✅ Have proper navigation for Notifi features
- ✅ Connect to Supabase for real data
- ✅ Support CRUD operations on reminders
- ✅ Show real-time updates
- ✅ Display priority, tags, and notification info
- ✅ Have working quick add functionality
- ✅ Filter by selected date
- ✅ Show proper empty states

