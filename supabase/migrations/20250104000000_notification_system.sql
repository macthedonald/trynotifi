-- Notification Scheduling System
-- This migration creates the infrastructure for scheduled notifications

-- 1. Create scheduled_notifications table
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Link to either reminder or calendar event
  reminder_id UUID REFERENCES reminders(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,

  -- When to send
  send_at TIMESTAMPTZ NOT NULL,
  lead_time_minutes INTEGER NOT NULL, -- For display purposes (e.g., "15 minutes before")

  -- How to send
  channels TEXT[] NOT NULL DEFAULT '{"email"}', -- ['email', 'push', 'sms']

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraint: Either reminder_id OR event_id must be set (not both)
  CONSTRAINT check_item_reference CHECK (
    (reminder_id IS NOT NULL AND event_id IS NULL) OR
    (reminder_id IS NULL AND event_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own scheduled notifications"
  ON scheduled_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled notifications"
  ON scheduled_notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled notifications"
  ON scheduled_notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled notifications"
  ON scheduled_notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can do everything (for cron job)
CREATE POLICY "Service role has full access to scheduled notifications"
  ON scheduled_notifications
  FOR ALL
  USING (auth.role() = 'service_role');

-- Critical index for cron job performance
CREATE INDEX idx_scheduled_notifications_pending
ON scheduled_notifications(send_at, status)
WHERE status = 'pending';

-- Index for user queries
CREATE INDEX idx_scheduled_notifications_user
ON scheduled_notifications(user_id, status);

-- Index for reminder/event lookups
CREATE INDEX idx_scheduled_notifications_reminder ON scheduled_notifications(reminder_id);
CREATE INDEX idx_scheduled_notifications_event ON scheduled_notifications(event_id);


-- 2. Update reminders table with notification fields
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS notification_lead_times INTEGER[] DEFAULT '{0}';

-- Index for notification queries
CREATE INDEX IF NOT EXISTS idx_reminders_notification_lead_times ON reminders USING GIN(notification_lead_times);


-- 3. Update events table with notification tracking
ALTER TABLE events ADD COLUMN IF NOT EXISTS has_notifications BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS notification_count INTEGER DEFAULT 0;

-- Trigger to update has_notifications when event_reminders added/removed
CREATE OR REPLACE FUNCTION update_event_notification_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events
    SET
      has_notifications = true,
      notification_count = (
        SELECT COUNT(*) FROM event_reminders WHERE event_id = NEW.event_id
      )
    WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events
    SET notification_count = (
      SELECT COUNT(*) FROM event_reminders WHERE event_id = OLD.event_id
    )
    WHERE id = OLD.event_id;

    UPDATE events
    SET has_notifications = (notification_count > 0)
    WHERE id = OLD.event_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_event_notifications
AFTER INSERT OR DELETE ON event_reminders
FOR EACH ROW EXECUTE FUNCTION update_event_notification_status();


-- 4. Update event_reminders table with notification channels
ALTER TABLE event_reminders ADD COLUMN IF NOT EXISTS notification_channels TEXT[] DEFAULT '{"email", "push"}';
ALTER TABLE event_reminders ADD COLUMN IF NOT EXISTS lead_time_minutes INTEGER DEFAULT 15;

-- Make lead_time_minutes required
UPDATE event_reminders SET lead_time_minutes = 15 WHERE lead_time_minutes IS NULL;


-- 5. Create notification_logs table for tracking sent notifications
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  reminder_id UUID REFERENCES reminders(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,

  channel TEXT NOT NULL CHECK (channel IN ('email', 'push', 'sms')),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),

  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),

  -- Notification content (for audit trail)
  subject TEXT,
  body TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notification logs"
  ON notification_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert (for cron job)
CREATE POLICY "Service role can insert notification logs"
  ON notification_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Indexes
CREATE INDEX idx_notification_logs_user ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at DESC);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);


-- 6. Create function to schedule notifications for a reminder
CREATE OR REPLACE FUNCTION schedule_reminder_notifications(
  p_reminder_id UUID,
  p_user_id UUID,
  p_scheduled_at TIMESTAMPTZ,
  p_lead_times INTEGER[],
  p_channels TEXT[]
)
RETURNS void AS $$
DECLARE
  lead_time INTEGER;
  send_time TIMESTAMPTZ;
BEGIN
  -- Delete existing scheduled notifications for this reminder
  DELETE FROM scheduled_notifications
  WHERE reminder_id = p_reminder_id
  AND status = 'pending';

  -- Create new scheduled notifications for each lead time
  FOREACH lead_time IN ARRAY p_lead_times
  LOOP
    send_time := p_scheduled_at - (lead_time || ' minutes')::INTERVAL;

    -- Only schedule if send time is in the future
    IF send_time > now() THEN
      INSERT INTO scheduled_notifications (
        user_id,
        reminder_id,
        send_at,
        lead_time_minutes,
        channels,
        status
      ) VALUES (
        p_user_id,
        p_reminder_id,
        send_time,
        lead_time,
        p_channels,
        'pending'
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. Create function to schedule notifications for an event
CREATE OR REPLACE FUNCTION schedule_event_notifications(
  p_event_id UUID,
  p_user_id UUID,
  p_start_time TIMESTAMPTZ,
  p_lead_times INTEGER[],
  p_channels TEXT[]
)
RETURNS void AS $$
DECLARE
  lead_time INTEGER;
  send_time TIMESTAMPTZ;
BEGIN
  -- Delete existing scheduled notifications for this event
  DELETE FROM scheduled_notifications
  WHERE event_id = p_event_id
  AND status = 'pending';

  -- Create new scheduled notifications for each lead time
  FOREACH lead_time IN ARRAY p_lead_times
  LOOP
    send_time := p_start_time - (lead_time || ' minutes')::INTERVAL;

    -- Only schedule if send time is in the future
    IF send_time > now() THEN
      INSERT INTO scheduled_notifications (
        user_id,
        event_id,
        send_at,
        lead_time_minutes,
        channels,
        status
      ) VALUES (
        p_user_id,
        p_event_id,
        send_time,
        lead_time,
        p_channels,
        'pending'
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 8. Update timestamp trigger for scheduled_notifications
CREATE OR REPLACE FUNCTION update_scheduled_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scheduled_notifications_updated_at
  BEFORE UPDATE ON scheduled_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_notifications_updated_at();
