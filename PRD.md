# Notifi - Product Requirements Document v1.0

## Executive Summary

**Product Name:** Notifi  
**Type:** SaaS Productivity Platform  
**Target Audience:** Professionals, teams, and individuals seeking intelligent reminder and calendar management  
**Core Value Proposition:** Unified reminder, calendar synchronization, and AI-powered productivity assistant with cross-platform support

---

## 1. Product Overview

### 1.1 Vision
Transform how users manage time-sensitive tasks by providing an intelligent, multi-platform reminder system with seamless calendar integration and AI-powered assistance.

### 1.2 Success Metrics
- User Activation: 60% of signups create ≥3 reminders within first week
- Retention: 40% MAU/DAU ratio after 30 days
- Conversion: 8% free-to-paid conversion within 90 days
- Engagement: Average 15+ reminder interactions per active user per week
- NPS: Target score of 45+

---

## 2. Technical Architecture

### 2.1 Stack Overview

**Frontend**
- Web: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Shadcn/ui
- Mobile: React Native 0.73+, Expo SDK 50+, TypeScript, NativeWind

**Backend & Infrastructure**
- Database & Auth: Supabase (PostgreSQL 15+, Row Level Security)
- API: Supabase Edge Functions (Deno runtime)
- Email: Resend API
- Payments: Lemon Squeezy (subscription management)
- SMS: Twilio Programmable SMS
- Push Notifications: Expo Push Notification Service + FCM
- AI: OpenAI API (GPT-4, Whisper, TTS)
- Calendar APIs: Google Calendar API v3, Microsoft Graph API

**DevOps**
- Hosting: Vercel (web), EAS (mobile)
- Monitoring: Sentry (error tracking), PostHog (analytics)
- CI/CD: GitHub Actions
- Environment: Staging + Production

---

## 3. Database Schema

### 3.1 Core Tables

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  plan_expires_at TIMESTAMP WITH TIME ZONE,
  lemon_squeezy_customer_id TEXT UNIQUE,
  lemon_squeezy_subscription_id TEXT,
  
  -- Gamification
  streak_count INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_completed_reminders INTEGER DEFAULT 0,
  last_activity_date DATE,
  
  -- Preferences
  timezone TEXT DEFAULT 'UTC',
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb,
  digest_frequency TEXT DEFAULT 'daily' CHECK (digest_frequency IN ('none', 'daily', 'weekly')),
  
  -- Calendar tokens (encrypted)
  google_tokens JSONB,
  microsoft_tokens JSONB,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Reminders table
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  tags TEXT[] DEFAULT '{}',
  
  -- Scheduling
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  snoozed_until TIMESTAMP WITH TIME ZONE,
  
  -- Recurrence
  recurrence_rule TEXT, -- RRULE format (RFC 5545)
  recurrence_end_date TIMESTAMP WITH TIME ZONE,
  parent_reminder_id UUID REFERENCES reminders(id) ON DELETE CASCADE,
  
  -- Notifications
  notification_channels TEXT[] DEFAULT '{email}',
  notification_lead_times INTEGER[] DEFAULT '{0}', -- minutes before scheduled_at
  last_notification_sent_at TIMESTAMP WITH TIME ZONE,
  notification_count INTEGER DEFAULT 0,
  
  -- Location (mobile only)
  location_trigger JSONB, -- {lat, lng, radius, address}
  
  -- Calendar sync
  synced_to_calendar BOOLEAN DEFAULT false,
  calendar_event_id TEXT,
  calendar_provider TEXT CHECK (calendar_provider IN ('google', 'microsoft')),
  
  -- Collaboration
  shared_with UUID[], -- array of user_ids
  assigned_to UUID REFERENCES users(id),
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'snoozed')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT DEFAULT 'user' CHECK (created_by IN ('user', 'ai', 'import'))
);

-- Calendar events table (imported from external calendars)
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- External reference
  external_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft', 'ical')),
  calendar_id TEXT NOT NULL,
  
  -- Event details
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  
  -- Timing
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_all_day BOOLEAN DEFAULT false,
  timezone TEXT,
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  
  -- Metadata
  organizer TEXT,
  attendees JSONB,
  html_link TEXT,
  
  -- Sync
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_modified TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  UNIQUE(user_id, provider, external_id)
);

-- Extra reminders for calendar events
CREATE TABLE event_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  
  -- Reminder config
  lead_time_minutes INTEGER NOT NULL, -- e.g., 1440 for 1 day before
  notification_channels TEXT[] DEFAULT '{email}',
  
  -- Status
  triggered_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(event_id, lead_time_minutes)
);

-- AI conversation history
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Message content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- Voice support
  is_voice_input BOOLEAN DEFAULT false,
  audio_url TEXT,
  audio_duration_seconds INTEGER,
  
  -- Context
  related_reminder_ids UUID[],
  related_event_ids UUID[],
  
  -- Actions taken
  actions_performed JSONB, -- [{type: 'create_reminder', data: {...}}]
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendar sync logs
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  events_synced INTEGER DEFAULT 0,
  error_message TEXT,
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Notification logs
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reminder_id UUID REFERENCES reminders(id) ON DELETE CASCADE,
  
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push', 'in_app')),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  
  provider_id TEXT, -- external ID from Resend/Twilio/Expo
  error_message TEXT,
  
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements/Badges
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  achievement_type TEXT NOT NULL CHECK (achievement_type IN (
    'first_reminder', 'week_streak', 'month_streak', 'hundred_completed',
    'early_bird', 'night_owl', 'calendar_connector', 'power_user'
  )),
  
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_type)
);

-- Sharing/Collaboration
CREATE TABLE shared_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reminder_id UUID NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  permission TEXT DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(reminder_id, shared_with)
);

-- Indexes for performance
CREATE INDEX idx_reminders_user_scheduled ON reminders(user_id, scheduled_at) WHERE status = 'active';
CREATE INDEX idx_reminders_status ON reminders(status, scheduled_at);
CREATE INDEX idx_calendar_events_user_time ON calendar_events(user_id, start_time);
CREATE INDEX idx_notification_logs_reminder ON notification_logs(reminder_id, sent_at);
CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id, created_at DESC);
```

### 3.2 Row Level Security Policies

```sql
-- Users can only see their own data
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD their own reminders" ON reminders
  FOR ALL USING (auth.uid() = user_id);

-- Allow viewing shared reminders
CREATE POLICY "Users can view shared reminders" ON reminders
  FOR SELECT USING (
    auth.uid() = ANY(shared_with) OR 
    auth.uid() IN (SELECT shared_with FROM shared_reminders WHERE reminder_id = id)
  );

-- Similar policies for calendar_events, ai_conversations, etc.
```

---

## 4. Feature Specifications

### 4.1 Reminder Management

#### 1. Reminders

##### Natural Language Input
**Functionality:**
- Parse natural language strings to extract:
  - Action/title
  - Date and time
  - Recurrence pattern
  - Priority indicators

**Examples:**
- "Remind me to call Sarah next Monday at 2pm" → Reminder on next Monday, 14:00
- "Every Friday at 5pm, review weekly goals" → Weekly recurring reminder
- "Take medication daily at 8am and 8pm" → Twice-daily recurring reminder

**Implementation:**
- Use Chrono.js library for date parsing
- Pattern matching for priority keywords (urgent, important, ASAP)
- Fallback to date picker if parsing confidence < 70%

**Acceptance Criteria:**
- ✅ Parse 90%+ of common date/time expressions correctly
- ✅ Handle timezones correctly
- ✅ Provide visual confirmation before creating reminder
- ✅ Allow manual editing of parsed values

##### Recurrence Patterns
**Supported patterns:**
- Daily (every N days)
- Weekly (specific days: Mon, Wed, Fri)
- Monthly (specific dates or patterns: first Monday, last Friday)
- Yearly
- Custom (RRULE format)

**Business Rules:**
- Free tier: Max 3 active recurring reminders
- Pro tier: Unlimited recurring reminders
- Recurring reminders generate instances 90 days in advance
- Completing one instance doesn't affect future instances

##### Multi-Channel Notifications

**Notification Configuration:**
Users can specify WHEN and HOW they want to be notified for each reminder.

**When to Notify (Lead Times):**
- At time of reminder (0 minutes before)
- 5, 10, 15, 30 minutes before
- 1, 2, 4, 8, 12 hours before
- 1, 2, 3, 7 days before
- 1 week before
- Custom time picker

**Multiple lead times per reminder:**
Users can select multiple notification times. Example:
- "Dentist appointment" might have notifications:
  - 1 day before (email)
  - 1 hour before (push + SMS)
  - At time (all channels)

**How to Notify (Channels):**
| Channel | Free | Pro | Configuration |
|---------|------|-----|---------------|
| Email | ✅ | ✅ | Always available |
| Push (Web) | ✅ | ✅ | Service worker registration |
| Push (Mobile) | ✅ | ✅ | Expo push token |
| SMS | ❌ | ✅ | Requires phone number |
| In-App | ✅ | ✅ | Real-time subscription |

**Rate Limiting:**
- Max 100 notifications per user per day across all channels
- Max 3 SMS per user per day (Pro tier)
- Max 50 push notifications per user per day

**Notification Scheduling System:**

When a reminder is created or updated, the system automatically schedules notifications:

1. **Calculate Send Times:** For each lead time, calculate exact UTC timestamp
2. **Create Scheduled Jobs:** Insert records into `scheduled_notifications` table
3. **Cron Processor:** Runs every minute to check for pending notifications
4. **Send Notifications:** Dispatch via Resend (email), Expo (push), Twilio (SMS)
5. **Log Results:** Record success/failure in `notification_logs` table
6. **Retry Logic:** Failed notifications retry up to 3 times with 5-minute delays

**Notification Content Templates:**

**Email:**
- Subject: "⏰ Reminder: [Title]"
- Body: Title, description, time, lead time context, link to dashboard
- HTML formatted with branding

**Push:**
- Title: "⏰ [Title]"
- Body: "[Lead time phrase] • [Description]"
- Deep link to reminder details
- Sound based on priority

**SMS:**
- Format: "🔔 Notifi: [Title] [lead time] ([time]). [Description] - View: notifi.app"
- Max 160 characters

**Lead Time Phrases:**
- 0 minutes: "NOW"
- < 60 minutes: "in [X] minutes"
- < 24 hours: "in [X] hours"
- ≥ 24 hours: "in [X] days"

##### Priority System

**Priority Levels:**
1. **Urgent** (Red border) - Critical, time-sensitive, highest notification priority
2. **High** (Orange border) - Important, should not be missed
3. **Medium** (Blue border) - Standard priority (default)
4. **Low** (Gray border) - Nice to have, lower priority

**UI Treatment:**
- Color-coded left border on cards (4px)
- Urgent reminders appear in dedicated top section
- Push notifications use different sounds per priority
- Urgent: High-priority delivery
- Sort order: Urgent → High → Medium → Low within same time slot

##### Location-Based Reminders (Mobile Only)

**Requirements:**
- Requires Pro tier
- User grants location permission
- Background location tracking (energy-efficient geofencing)

**Configuration:**
- Set location via map picker or address search
- Define radius (50m - 5km)
- Trigger: on arrival, on departure, or both
- Optional: Only trigger during specific time windows

**Implementation:**
- Use Expo Location with geofencing
- iOS: Significant location change API
- Android: Geofencing API
- Battery optimization: coarse location unless within 1km

**Privacy:**
- Location data never stored on servers
- Stored only locally on device encrypted storage
- User can view/delete location history
- Clear permissions UI and privacy explanation

##### Calendar Sync (Two-Way)

**Export: Reminders → External Calendar**

When user creates a reminder with "Sync to calendar" enabled:

1. **Selection:** User chooses which calendar (Google/Outlook)
2. **Event Creation:** System calls Edge Function to create calendar event via API
3. **Storage:** Store `calendar_event_id` and `calendar_provider` in reminder record
4. **Badge Display:** Show small calendar badge on reminder card
5. **Bi-directional Updates:**
   - Edit reminder in Notifi → Update calendar event
   - Edit event in calendar → Update reminder (detected during sync)
   - Delete reminder → Optionally delete calendar event (ask user)

**Calendar Event Structure:**
```json
{
  "summary": "Reminder title",
  "description": "Reminder description + tags",
  "start": {
    "dateTime": "2025-09-30T14:00:00Z",
    "timeZone": "America/New_York"
  },
  "end": {
    "dateTime": "2025-09-30T14:30:00Z",
    "timeZone": "America/New_York"
  },
  "reminders": {
    "useDefault": false,
    "overrides": []
  }
}
```

**Business Rules:**
- Default event duration: 30 minutes
- Reminders without end time: 30-minute block
- All-day reminders: Create all-day event
- Recurring reminders: Create recurring calendar event
- Calendar notifications disabled (Notifi handles notifications)

##### Tags & Categories

**Usage:**
- User-defined tags for organization
- Autocomplete from previously used tags
- Color-coding per tag (auto-assigned or custom)
- Filter and search by tags
- Common tags: #work, #personal, #health, #family, #urgent

**Implementation:**
- Stored as text array in database
- Case-insensitive matching
- Max 10 tags per reminder
- Tag analytics: Most used, tag-based productivity insights

### 4.2 Calendar Integration

#### 4.2.1 OAuth Connection Flow

**Google Calendar:**
1. User clicks "Connect Google Calendar"
2. OAuth 2.0 flow with scopes:
   - `calendar.readonly` (for importing)
   - `calendar.events` (for two-way sync if enabled)
3. Store encrypted refresh token + access token in `users.google_tokens`
4. Initial sync triggered immediately
5. Schedule daily sync via cron

**Microsoft Outlook:**
- Similar flow using Microsoft Graph API
- Scopes: `Calendars.Read`, `Calendars.ReadWrite`

**Security:**
- Tokens encrypted at rest using Supabase Vault
- Refresh token rotation every 60 days
- Revoke tokens on account deletion

#### 4.2.2 Event Import Rules

**Import Filters:**
- Date range: Past 7 days + Future 90 days
- Exclude declined events
- Exclude cancelled events
- Free tier: 1 calendar, Pro tier: All calendars

**Conflict Handling:**
- Use `last_modified` timestamp to determine latest version
- Update existing events if `external_id` matches
- Mark as deleted if removed from source calendar

**Sync Frequency:**
- Automatic: Daily at 2 AM user local time
- Manual: User can trigger via button (rate limited to 1/hour)
- Webhook: Google Push Notifications for real-time sync (Pro tier)

#### 4.2.3 Extra Reminders for Events

**User Story:**
"As a user, I want to get reminded 1 day before my dentist appointment even though it's in my Google Calendar."

**Implementation:**
- Each imported event shows "+ Add Reminder" button
- User selects lead time and channels
- Creates entry in `event_reminders` table
- Notifications triggered by scheduled function

**Business Rules:**
- Free tier: 1 extra reminder per event
- Pro tier: Unlimited extra reminders per event

#### 4.2.4 Two-Way Sync (Pro Feature)

**Export Reminders to Calendar:**
- User toggles "Sync to Calendar" on reminder
- Creates event in selected calendar (Google/Microsoft)
- Stores `calendar_event_id` for future updates
- Updates propagate on reminder edit

**Conflict Resolution:**
- Calendar edit takes precedence over reminder
- Show conflict warning in UI
- Allow user to choose: Keep Calendar / Keep Reminder

### 4.3 AI Assistant

#### 4.3.1 Chat Interface

**UI Design:**
- ChatGPT-style interface
- Message bubbles (user vs assistant)
- Suggested prompts:
  - "What's on my schedule today?"
  - "Create a reminder for tomorrow"
  - "Summarize this week"
  - "Reschedule my 3pm meeting"

**Context Awareness:**
- Loads user's reminders + calendar events
- Maintains conversation history (last 20 messages)
- References specific items: "Reschedule the dentist appointment" → AI knows which one

**Capabilities:**
| Action | Example |
|--------|---------|
| Query reminders | "What are my high-priority tasks?" |
| Create reminder | "Remind me to buy groceries tomorrow at 5pm" |
| Update reminder | "Move my dentist appointment to next week" |
| Delete reminder | "Cancel the team meeting reminder" |
| Summarize | "What does my week look like?" |
| Analytics | "How many reminders did I complete this month?" |

**Implementation:**
```typescript
// AI System Prompt Template
You are Notifi AI, a productivity assistant. You have access to the user's:
- Reminders: {reminders_json}
- Calendar events: {events_json}
- Current date/time: {now}
- User timezone: {timezone}

Respond conversationally. If the user asks to create/update/delete a reminder, 
respond with a structured JSON action:
{
  "action": "create_reminder",
  "data": { "title": "...", "scheduled_at": "..." }
}
```

**Function Calling:**
- Use OpenAI function calling for structured actions
- Functions: `create_reminder`, `update_reminder`, `delete_reminder`, `snooze_reminder`
- Parse user intent → execute → confirm in natural language

#### 4.3.2 Voice Assistant (Mobile)

**Voice Input:**
- Hold-to-record button
- Audio recorded as M4A
- Uploaded to Supabase Storage
- Transcribed via OpenAI Whisper API
- Text sent to AI chat

**Voice Output (Optional):**
- AI response converted to speech via OpenAI TTS
- Streamed to device
- User preference: Text only / Voice only / Both

**Offline Handling:**
- Voice recordings queued locally
- Uploaded when connection restored
- Show pending status in UI

### 4.4 Collaboration Features

#### 4.4.1 Sharing Reminders

**User Flow:**
1. User clicks "Share" on reminder
2. Enters email of recipient
3. Selects permission: View only / Can edit
4. Recipient gets email invitation
5. Shared reminder appears in their dashboard

**Permissions:**
- **View**: See details, cannot modify
- **Edit**: Can update all fields, mark complete

**Team Plans:**
- Pro tier: Share with up to 5 users
- Team tier: Share with up to 50 users
- Shared reminders count toward sharer's limit

#### 4.4.2 Assignment

**Concept:**
- Assign reminder to another user
- Assignee gets notification
- Shows in assignee's "Assigned to Me" section

**Use Cases:**
- Manager assigns tasks to team
- Family members delegate chores
- Project collaborators split work

### 4.5 Gamification

#### 4.5.1 Streak System

**Logic:**
- Streak increments if user completes ≥1 reminder per day
- Streak resets if user misses a day
- "Freeze" power-up (Pro tier): Skip 1 day without losing streak

**Display:**
- Fire emoji + number on dashboard
- Celebrate milestones: 7, 30, 100, 365 days

#### 4.5.2 Achievements

| Achievement | Criteria |
|-------------|----------|
| First Step | Create first reminder |
| Week Warrior | 7-day streak |
| Month Master | 30-day streak |
| Century Club | Complete 100 reminders |
| Early Bird | Complete reminder before 8am |
| Night Owl | Complete reminder after 10pm |
| Calendar Pro | Connect 2+ calendars |
| Power User | Create 50+ reminders |

**Rewards:**
- Badge display on profile
- Email notification on unlock
- Leaderboard (opt-in)

#### 4.5.3 Analytics Dashboard

**Metrics:**
- Total reminders created/completed
- Completion rate
- Average completion time
- Busiest day/hour
- Most used tags
- Streak history graph

**Weekly Report Email:**
- Sent every Monday at 9am
- Highlights: Reminders completed, streak status, upcoming week preview
- Call-to-action: Upgrade to Pro

---

## 5. Monetization

### 5.1 Pricing Tiers

| Feature | Free | Pro ($8/mo) | Team ($15/user/mo) |
|---------|------|-------------|---------------------|
| Active Reminders | 10 | Unlimited | Unlimited |
| Calendar Connections | 1 | Unlimited | Unlimited |
| Email Notifications | ✅ | ✅ | ✅ |
| Push Notifications | ✅ | ✅ | ✅ |
| SMS Notifications | ❌ | ✅ (50/mo) | ✅ (100/mo) |
| Location Reminders | ❌ | ✅ | ✅ |
| AI Chat | 10 msg/day | Unlimited | Unlimited |
| Voice Assistant | ❌ | ✅ | ✅ |
| Sharing | ❌ | ✅ (5 users) | ✅ (50 users) |
| Two-Way Calendar Sync | ❌ | ✅ | ✅ |
| Priority Support | ❌ | ✅ | ✅ |
| Analytics | Basic | Advanced | Advanced + Team |

### 5.2 Lemon Squeezy Integration

**Setup:**
- Create products in Lemon Squeezy dashboard
- Configure webhook endpoint: `/api/webhooks/lemon-squeezy`
- Verify webhook signatures

**Webhook Events:**
| Event | Action |
|-------|--------|
| `order_created` | Upgrade user, send welcome email |
| `subscription_created` | Set `plan_expires_at` to next billing date |
| `subscription_updated` | Handle plan changes |
| `subscription_cancelled` | Downgrade at period end |
| `subscription_payment_success` | Extend `plan_expires_at` |
| `subscription_payment_failed` | Send dunning email |

**Upgrade Flow:**
1. User clicks "Upgrade to Pro"
2. Redirect to Lemon Squeezy checkout (embedded)
3. After payment, redirect to success page
4. Webhook updates database
5. Show success toast + unlock Pro features

**Downgrade Flow:**
- User cancels subscription
- Access remains until current period ends
- At period end: Enforce Free tier limits (mark reminders as archived if over limit)

### 5.3 Free Trial

- 14-day Pro trial for new signups
- No credit card required
- Email reminders at day 7, 12, 13
- Auto-downgrade to Free after trial if no payment

---

## 6. Non-Functional Requirements

### 6.1 Performance

- **Page Load Time**: < 2 seconds (web)
- **Time to Interactive**: < 3 seconds (web)
- **App Launch**: < 1 second (mobile)
- **API Response Time**: P95 < 500ms
- **Notification Delivery**: Within 30 seconds of scheduled time
- **Calendar Sync**: Complete within 5 minutes for 1000 events

### 6.2 Scalability

- **Concurrent Users**: Support 10,000 simultaneous users
- **Database**: Handle 1M+ reminders, 5M+ events
- **Notifications**: Process 100,000 notifications/hour
- **API Rate Limits**:
  - Authenticated: 1000 requests/hour
  - Unauthenticated: 100 requests/hour

### 6.3 Security

- **Authentication**: Supabase Auth with JWT
- **Password Policy**: Min 8 characters, 1 uppercase, 1 number
- **Token Storage**: Encrypted at rest using AES-256
- **API Keys**: Stored in environment variables, never in code
- **SQL Injection**: Use parameterized queries only
- **XSS Protection**: Sanitize all user inputs
- **CSRF**: Use Supabase CSRF protection
- **HTTPS**: Enforce TLS 1.3 for all connections
- **Data Deletion**: Complete data wipe within 30 days of account deletion

### 6.4 Compliance

- **GDPR**: Right to access, delete, export data
- **CCPA**: Opt-out of data sale (N/A, we don't sell data)
- **COPPA**: Require 18+ age verification
- **Privacy Policy**: Clear disclosure of data usage
- **Terms of Service**: User agreement required at signup

### 6.5 Reliability

- **Uptime SLA**: 99.9% (Pro tier), 99.5% (Free tier)
- **Backup**: Daily automated backups, 30-day retention
- **Disaster Recovery**: RPO 24 hours, RTO 4 hours
- **Error Handling**: Graceful degradation, user-friendly error messages
- **Monitoring**: Real-time alerts for critical failures

---

## 7. API Specifications

### 7.1 REST Endpoints

**Base URL**: `https://api.notifi.app/v1`

#### Authentication
```
POST /auth/signup
POST /auth/login
POST /auth/logout
POST /auth/refresh
POST /auth/forgot-password
POST /auth/reset-password
```

#### Reminders
```
GET    /reminders                    # List user's reminders
POST   /reminders                    # Create reminder
GET    /reminders/:id                # Get reminder details
PATCH  /reminders/:id                # Update reminder
DELETE /reminders/:id                # Delete reminder
POST   /reminders/:id/complete       # Mark complete
POST   /reminders/:id/snooze         # Snooze reminder
POST   /reminders/:id/share          # Share with user
```

#### Calendar
```
GET    /calendars                    # List connected calendars
POST   /calendars/connect/google     # Start Google OAuth
POST   /calendars/connect/microsoft  # Start Microsoft OAuth
DELETE /calendars/:provider          # Disconnect calendar
POST   /calendars/sync               # Trigger manual sync
GET    /calendar-events              # List imported events
POST   /calendar-events/:id/remind   # Add extra reminder
```

#### AI
```
POST   /ai/chat                      # Send message to AI
GET    /ai/conversations             # Get conversation history
POST   /ai/voice/transcribe          # Transcribe audio
POST   /ai/voice/synthesize          # Generate TTS
```

#### User
```
GET    /user/profile                 # Get user profile
PATCH  /user/profile                 # Update profile
GET    /user/stats                   # Get analytics
GET    /user/achievements            # List achievements
PATCH  /user/preferences             # Update preferences
DELETE /user/account                 # Delete account
```

### 7.2 Realtime Subscriptions

**Using Supabase Realtime:**

```typescript
// Subscribe to new reminders
supabase
  .channel('reminders')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'reminders',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // Handle new reminder
  })
  .subscribe()
```

---

## 8. Mobile App Specifications

### 8.1 Offline Support

**Strategy: Offline-First Architecture**

**Data Sync:**
- Use WatermelonDB for local SQLite storage
- Queue all mutations (create, update, delete)
- Sync when online using differential sync
- Conflict resolution: Last-write-wins with timestamp

**Features Available Offline:**
- View all synced reminders
- Create new reminders (queued)
- Mark reminders complete (queued)
- View cached calendar events
- Access AI conversation history

**Sync Indicators:**
- Show sync status icon (synced, syncing, pending)
- Badge on pending changes
- Pull-to-refresh for manual sync

### 8.2 Push Notifications

**Setup:**
- Use Expo Push Notification Service
- Request permissions on first launch
- Store Expo push token in user profile

**Notification Types:**
| Type | Sound | Badge | Deep Link |
|------|-------|-------|-----------|
| Reminder Due | Default | +1 | Open reminder |
| Shared Reminder | Subtle | +1 | Open reminder |
| Streak Reminder | Cheerful | No | Open dashboard |
| Achievement | Celebration | No | Open achievements |

**User Controls:**
- Enable/disable per type
- Quiet hours (e.g., 10pm - 8am)
- Do Not Disturb mode

### 8.3 Geofencing

**Implementation:**
- Use Expo Location with TaskManager
- Register geofences (max 100 per user)
- Background task triggers notification

**Power Management:**
- Android: Use Fused Location Provider
- iOS: Use Significant-Change Location Service
- Geofence monitoring stops if battery < 15%

### 8.4 Voice Input

**UI:**
- Floating action button with microphone icon
- Hold-to-record (or tap-to-start/tap-to-stop)
- Waveform visualization during recording
- Auto-stops after 60 seconds

**Processing:**
1. Record audio (M4A format)
2. Show "Transcribing..." loading state
3. Upload to `/api/ai/voice/transcribe`
4. Display transcription with edit option
5. Send to AI chat after confirmation

---

## 9. Web App Specifications

### 9.1 Landing Page

**Structure & Content:**

#### 1. Navigation Bar
**Layout:**
- Logo (left)
- Links: Product, Pricing, Resources, Company (center)
- CTA buttons: Login, Start Free Trial (right)

**Behavior:**
- Sticky on scroll
- Mobile: Hamburger menu
- Transparent initially, solid background on scroll

**Implementation Notes:**
- Use Next.js Link for client-side routing
- Smooth scroll to sections
- Active state for current section

---

#### 2. Hero Section
**Layout:**
- Full viewport height
- Two-column: Copy (left 50%) + Visual (right 50%)

**Content:**
- **Headline**: "Never Miss What Matters"
- **Subheadline**: "Your AI-powered reminder assistant that syncs with your calendar, sends smart notifications, and helps you stay on top of everything—without the overwhelm."
- **Primary CTA**: "Start Free Trial" (button, prominent)
- **Secondary CTA**: "Watch Demo" (text link with play icon)
- **Trust indicator**: "Join 10,000+ productive people" or "No credit card required"

**Visual:**
- Animated product screenshot or demo video
- Show multi-device usage (web + mobile)
- Subtle background gradient or pattern

**Performance:**
- Hero image optimized (WebP, lazy load below fold)
- Animation: Framer Motion with reduced motion respect

---

#### 3. Partner Section
**Purpose:** Build trust through social proof

**Content:**
- Heading: "Trusted by teams at"
- Logo grid: 6-8 recognizable brands (grayscale)
- If pre-launch: "As featured in" → tech blogs, Product Hunt, etc.

**Layout:**
- Single row, centered
- Logos auto-scroll on mobile
- Hover: Color on desktop

**Implementation:**
- SVG logos for crisp rendering
- Link to case studies if available

---

#### 4. Benefits Section
**Focus:** User outcomes, not features

**Structure:** 3-column grid of benefit cards

**Content:**

**Benefit 1: Reclaim Your Mental Space**
- Icon: Brain/Head with sparkles
- Description: "Stop carrying your to-do list in your head. Let Notifi remember everything so you can focus on what matters—work, family, and living in the moment."
- Supporting stat: "Users report 40% less daily stress"

**Benefit 2: Never Drop the Ball Again**
- Icon: Shield with checkmark
- Description: "From medication reminders to important meetings, Notifi has your back with smart, multi-channel alerts that reach you wherever you are."
- Supporting stat: "98% reminder completion rate"

**Benefit 3: Work Smarter, Not Harder**
- Icon: Lightning bolt or rocket
- Description: "AI assistant handles the busywork. Just say 'Remind me to follow up with Sarah tomorrow' and Notifi takes care of the rest—no typing, no clicking through menus."
- Supporting stat: "Save 2+ hours per week"

**Benefit 4: Everything in One Place**
- Icon: Connected nodes/hub
- Description: "Your Google Calendar, Outlook events, and personal reminders all in one beautiful timeline. No more app-switching or missed appointments."
- Supporting stat: "Sync with all your calendars"

**Benefit 5: Build Better Habits**
- Icon: Streak/Fire
- Description: "Track your progress with streaks and insights. See how consistent you are and celebrate every win—big or small."
- Supporting stat: "Users maintain 30+ day streaks"

**Benefit 6: Your Life, Everywhere**
- Icon: Devices (phone, laptop, watch)
- Description: "Start on your laptop, get notified on your phone, complete on the go. Notifi syncs seamlessly across all your devices."
- Supporting stat: "Works offline, syncs when online"

**Design:**
- Card-based layout with hover effects
- Icons: Custom illustrations (consistent style)
- Subtle shadows and rounded corners
- Responsive: 3 cols → 2 cols → 1 col

---

#### 5. How It Works Section
**Headline:** "Get Started in 3 Simple Steps"
**Subheadline:** "From setup to your first reminder—in under 60 seconds"

**Step 1: Sign Up & Connect**
- Icon: User plus
- Visual: Animated screenshot of signup + calendar connection
- Description: "Create your free account and optionally connect your Google or Outlook calendar. No complicated setup required."

**Step 2: Add Your First Reminder**
- Icon: Plus circle
- Visual: Demo of natural language input
- Description: "Just type naturally: 'Call mom tomorrow at 3pm' or use voice on mobile. Notifi understands and schedules it instantly."

**Step 3: Relax & Get Notified**
- Icon: Bell with checkmark
- Visual: Notification examples (email, push, SMS)
- Description: "Choose how you want to be reminded. Email, push, SMS, or all of them. We'll make sure you never miss it."

**Layout:**
- Horizontal timeline on desktop (3 steps with connecting line)
- Vertical stack on mobile
- Number badges (1, 2, 3) prominent
- Each step has screenshot/mockup

**CTA at bottom:** "Start Your Free Trial" (button)

---

#### 6. Pricing Section
**Headline:** "Simple Pricing. No Hidden Fees."
**Subheadline:** "Start free. Upgrade when you're ready."

**Layout:** 3-column comparison cards

**Free Tier Card:**
- Price: $0/month
- Label: "For personal use"
- Features:
  - 10 active reminders
  - 1 calendar connection
  - Email & push notifications
  - Basic AI chat (10/day)
  - Mobile & web apps
- CTA: "Start Free" (secondary button)

**Pro Tier Card (Highlighted):**
- Badge: "Most Popular"
- Price: $8/month or $80/year (save 17%)
- Label: "For power users"
- Features:
  - Unlimited reminders
  - Unlimited calendar connections
  - Email, push & SMS (50/mo)
  - Unlimited AI chat + voice
  - Location-based reminders
  - 2-way calendar sync
  - Priority support
- CTA: "Start 14-Day Free Trial" (primary button)
- Note: "No credit card required"

**Team Tier Card:**
- Price: $15/user/month
- Label: "For teams"
- Features:
  - Everything in Pro
  - Share with 50 teammates
  - Team analytics
  - Admin controls
  - Dedicated support
  - Custom integrations
- CTA: "Contact Sales" (secondary button)

**Below Cards:**
- FAQ toggle: "What happens after my trial?" → "Your account continues as Free tier. No charges."
- Money-back guarantee: "Not satisfied? Full refund within 30 days."

**Design:**
- Pro card elevated with shadow
- Toggle: Monthly/Yearly (with savings badge)
- Feature comparison table (expandable)

---

#### 7. Testimonials Section
**Headline:** "Loved by Productive People Everywhere"

**Layout:** Carousel or masonry grid of testimonial cards

**Testimonial Card Structure:**
- Quote: "Notifi changed how I manage my life. I used to forget appointments all the time—now I haven't missed one in 6 months."
- Avatar: Profile photo
- Name: Sarah Johnson
- Title: Product Manager at TechCo
- Rating: 5 stars

**Testimonials (6-8 total):**
1. Busy professional who stopped missing meetings
2. Parent managing family schedules
3. Student keeping track of assignments
4. Freelancer juggling multiple projects
5. Team lead using collaboration features
6. Someone with ADHD praising the executive function support

**Design:**
- Cards with light background
- Testimonial text prominent (larger font)
- Avatars circular
- Auto-scroll carousel on mobile
- Manual navigation on desktop

**Trust Element:**
- Show aggregate rating: "4.9/5 from 2,847 users"
- Link to more reviews (Trustpilot, G2, etc.)

---

#### 8. FAQ Section
**Headline:** "Frequently Asked Questions"

**Format:** Accordion (expandable items)

**Questions:**

**Q: Do I need a credit card to start?**
A: No! Our 14-day Pro trial requires no payment information. You can explore all premium features risk-free.

**Q: What happens after my free trial ends?**
A: Your account automatically switches to the Free tier. You keep all your data and can continue using Notifi forever—or upgrade anytime.

**Q: Can I sync with multiple calendars?**
A: Yes! Pro users can connect unlimited Google and Outlook calendars. Free users can connect one calendar.

**Q: How do location-based reminders work?**
A: Set a location and radius in the mobile app. When you arrive or leave, Notifi sends you a reminder. Perfect for "Buy milk when near grocery store."

**Q: Is my data secure?**
A: Absolutely. We use bank-level encryption, never sell your data, and you can delete your account anytime with complete data removal.

**Q: Can I share reminders with my family or team?**
A: Yes! Pro users can share reminders with up to 5 people, and Team users can share with up to 50 teammates.

**Q: What if I miss a reminder?**
A: Overdue reminders stay visible until completed. You can also set multiple alerts (e.g., 1 day before + 1 hour before).

**Q: Do you offer refunds?**
A: Yes! If you're not happy within 30 days of subscribing, we'll refund you in full—no questions asked.

**Q: Can I export my data?**
A: Yes. You can export all your reminders and settings as JSON or CSV anytime from your account settings.

**Q: Which platforms do you support?**
A: Notifi works on Web (all modern browsers), iOS, and Android. Full feature parity across all platforms.

**Design:**
- Two-column layout on desktop (5 items per column)
- Single column on mobile
- Smooth expand/collapse animation
- "Still have questions? Contact us" link at bottom

---

#### 9. Final CTA Section
**Purpose:** Last conversion opportunity

**Layout:** Full-width, colorful gradient background

**Content:**
- Headline: "Ready to Never Miss What Matters?"
- Subheadline: "Join thousands who've taken back control of their time"
- Primary CTA: "Start Your Free Trial" (large button)
- Below button: "14 days free • No credit card required • Cancel anytime"
- Visual: Product mockup or happy user illustration

**Design:**
- High contrast (white text on gradient)
- CTA button stands out (different color)
- Optional: Subtle animation (floating elements)

---

#### 10. Footer
**Layout:** Multi-column grid

**Column 1: Product**
- Features
- Pricing
- Mobile Apps
- Integrations
- Changelog
- Roadmap

**Column 2: Resources**
- Blog
- Help Center
- API Documentation
- Video Tutorials
- Community Forum

**Column 3: Company**
- About Us
- Careers
- Press Kit
- Contact Us
- Brand Assets

**Column 4: Legal**
- Privacy Policy
- Terms of Service
- Cookie Policy
- Security
- GDPR Compliance

**Column 5: Newsletter Signup**
- Heading: "Stay Updated"
- Email input + Subscribe button
- Text: "Tips, updates, and productivity insights"

**Bottom Bar:**
- Left: © 2025 Notifi. All rights reserved.
- Center: Social icons (Twitter, LinkedIn, Instagram, YouTube)
- Right: Language selector (if applicable)

**Design:**
- Dark background (contrast with page)
- Links in muted color
- Hover effects on links
- Mobile: Accordion or stacked columns

---

**Performance & SEO:**
- Lighthouse score > 95
- Core Web Vitals optimized
- Semantic HTML (h1, h2, section tags)
- Schema.org markup (Product, Review, FAQPage)
- Open Graph tags for social sharing
- Lazy load all images below fold
- Prefetch critical fonts (Inter, SF Pro)
- Minified CSS/JS
- CDN for static assets

### 9.2 Dashboard

**Layout:**
- Sidebar: Navigation (Today, My Profile, Upcoming, Completed, AI Assistant, Calendars, Settings, Help, Log out)
- Main area: Content based on selected view
- Header: Dynamic greeting + subtitle with context
- Right panel: 3D calendar illustration + mini calendar widget

**Design Reference:**
The dashboard follows a modern, clean aesthetic with:
- Purple/pink/blue gradient backgrounds
- Glassmorphism sidebar effect
- Card-based content layout
- Smooth animations and transitions
- Rounded corners and subtle shadows

**Today View (Main Dashboard):**

**Header Section:**
- Dynamic greeting: "Good morning/afternoon/evening, [Name]!"
- Contextual subtitle showing:
  - "You have {count} reminders today" (if items exist)
  - "All clear for today! Enjoy your free time" (if no items)
  - "{overdue} overdue items need your attention" (if overdue, shown in red/orange)
- Calendar connection status badges (Google/Outlook with checkmarks)
- Last sync indicator with manual refresh button
- 3D calendar illustration (decorative)

**Date Navigation Bar:**
- Current date display: "Tuesday, September 30" (formatted per user locale)
- Horizontal week view: Su Mo Tu We Th Fr Sa
- Date numbers with visual indicators:
  - Current day: Purple background
  - Dates with items: Small colored dots below (color = highest priority)
  - Clickable to filter content by date
- Previous/next week navigation arrows

**Filter Controls:**
- Chip-style filters: [All ✓] [Reminders Only] [Events Only] [With Notifications]
- Active state highlighted
- Filters the unified timeline below

**Unified Timeline (Main Content):**

Shows both reminders and calendar events in chronological order:

**Reminder Card Structure:**
```
┌─┬──────────────────────────────────────────────────┬────────┐
│✓│ [Icon] Reminder Title                       [...] │ Time   │
│ │ Description text                                  │ Range  │
│ │ 🏷️ tag1  tag2    📧 📱 🔔                        │        │
│ │ 📅 Synced to Google Calendar                     │        │
└─┴──────────────────────────────────────────────────┴────────┘
  ↑ 4px colored border (priority)
```

**Elements:**
- Checkbox (left): Mark as complete
- Left border: Color-coded by priority (green/blue/orange/red)
- Category icon: Based on reminder type (Bell, Pill, Phone, Dumbbell, etc.)
- Title: Bold, prominent
- Description: Gray, smaller (optional)
- Time: Right-aligned, user's locale format
- Tags: Small colored chips
- Notification indicators: Icons showing channels (email, SMS, push)
- Calendar sync badge: If synced to external calendar
- Three-dot menu: Edit, Delete, Share, Sync options

**Calendar Event Card Structure:**
```
┌──┬──────────────────────────────────────────────────┬────────┐
│📅│ Event Title                                 [...] │ Time   │
│ │ 📍 Location • 👥 Attendees                        │ Range  │
│ │ 🔔 Notifications: 15m, 1d before                  │        │
│ │ ➕ Set Notifications  |  🔗 Open in Google        │        │
└──┴──────────────────────────────────────────────────┴────────┘
  ↑ Gray/provider-colored border
```

**Elements:**
- Calendar icon (left): No checkbox (read-only)
- Provider badge: Small Google/Outlook logo (top-right)
- Title: Bold, prominent
- Location: With map pin icon (if available)
- Attendees: Count with people icon (if available)
- Time: Start - end time range
- Notification status: Shows configured lead times
- Action buttons: Set/Edit Notifications, Open in provider
- Three-dot menu: View details, Manage notifications, Hide event

**Sample Timeline Items:**
1. **Take medication** (8:00 AM) - Reminder, orange border (high priority), pill icon, synced ✓
2. **Team Standup** (9:00 AM - 9:30 AM) - Google Event, 5 attendees, notifications set 🔔
3. **Submit project proposal** (11:30 AM) - Reminder, blue border (medium), file icon
4. **Lunch with Client** (12:00 PM - 1:00 PM) - Outlook Event, location shown 📍
5. **Call mom** (2:00 PM) - Reminder, green border (low), phone icon
6. **Gym workout** (6:00 PM) - Reminder, dumbbell icon, synced to calendar ✓

**Empty States:**

If no items for selected day:
- Icon: Calendar with checkmark
- Message: "No reminders or events for today"
- Subtext: "You're all caught up! Enjoy your free time"
- CTA: "+ Add Reminder" button

If has events but no reminders:
- Icon: Bell
- Message: "No reminders set for today"
- Subtext: "You have {count} calendar events"
- CTAs: "Add Reminder" and "View Events"

If no calendar connected:
- Icon: Calendar
- Message: "Connect your calendar"
- Subtext: "See your schedule alongside reminders in one place"
- CTAs: "Connect Google" and "Connect Outlook"

**Mini Calendar Widget (Right Panel):**
- Month/year header: "September 2025" (formatted per locale)
- Calendar grid with dates
- Visual indicators:
  - Current day: Purple circle background
  - Selected day: Purple background
  - Days with items: Small colored dots
- Navigation: Previous/next month arrows
- "TODAY" button: Jump to current date
- "+" button: Quick add reminder for selected date
- Respects user's first day of week setting

**Interaction Patterns:**
- Click date in mini calendar → Filter main timeline to that date
- Click card → Open details modal/sheet
- Hover card → Show three-dot menu and quick actions
- Drag card → Reorder or reschedule (future enhancement)
- Checkbox reminder → Mark complete with animation
- Swipe on mobile → Quick actions (complete, snooze, delete)

---

**Upcoming View:**
- Timeline grouped by date (Today, Tomorrow, This Week, Next Week, Later)
- Filter by priority, tags, calendar
- Search functionality
- Bulk actions (select multiple, mark complete, delete)

---

**Completed View:**
- List of completed reminders
- Group by date completed (Today, Yesterday, This Week, Earlier)
- Show completion time
- Restore or permanently delete options
- Statistics: Total completed, completion rate, streaks

---

**Calendars View:**
- Manage connected calendars
- Connection status for each (Google, Outlook)
- Last sync time and sync history
- Select which calendars to import from (if multiple)
- Configure sync settings:
  - Sync frequency (manual, hourly, daily)
  - Date range (past 7 days, future 90 days)
  - Event filters (include/exclude declined events)
- Connect/disconnect buttons with OAuth flow
- Sync logs table showing recent sync activity
- Troubleshooting tips for sync issues

### 9.3 AI Chat

**Desktop:**
- Full-page interface or slide-out panel
- Persists across navigation
- Keyboard shortcut: Cmd+K /