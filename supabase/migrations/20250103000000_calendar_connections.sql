-- Calendar Connections Table
-- Stores OAuth tokens and connection status for Google Calendar and Microsoft Calendar

CREATE TABLE IF NOT EXISTS calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),

  -- OAuth tokens
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,

  -- Calendar information
  calendar_id TEXT NOT NULL, -- External calendar ID (e.g., 'primary' for Google)
  calendar_name TEXT NOT NULL,

  -- Connection status
  is_connected BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  sync_enabled BOOLEAN DEFAULT true,

  -- Sync preferences
  sync_direction TEXT DEFAULT 'both' CHECK (sync_direction IN ('import', 'export', 'both')),
  auto_sync BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure one connection per provider per user per calendar
  UNIQUE(user_id, provider, calendar_id)
);

-- Enable RLS
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own calendar connections"
  ON calendar_connections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar connections"
  ON calendar_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar connections"
  ON calendar_connections
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar connections"
  ON calendar_connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_calendar_connections_user_id ON calendar_connections(user_id);
CREATE INDEX idx_calendar_connections_provider ON calendar_connections(provider);
CREATE INDEX idx_calendar_connections_sync_enabled ON calendar_connections(sync_enabled);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_calendar_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calendar_connections_updated_at
  BEFORE UPDATE ON calendar_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_connections_updated_at();


-- Extend existing events table with calendar sync fields
-- Note: The events table already exists from initial schema

ALTER TABLE events ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES calendar_connections(id) ON DELETE CASCADE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_all_day BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_synced BOOLEAN DEFAULT true;
ALTER TABLE events ADD COLUMN IF NOT EXISTS sync_error TEXT;

-- Add constraint to ensure unique external event per connection (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_connection_external_unique'
  ) THEN
    ALTER TABLE events ADD CONSTRAINT events_connection_external_unique
      UNIQUE(connection_id, external_id);
  END IF;
END $$;

-- Add indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_events_connection_id ON events(connection_id);
CREATE INDEX IF NOT EXISTS idx_events_last_synced ON events(last_synced_at);


-- Event Reminders Junction Table
-- Links calendar events to Notifi reminders for two-way sync

CREATE TABLE IF NOT EXISTS event_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Link to calendar event (if imported from calendar)
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,

  -- Link to reminder (if exported to calendar)
  reminder_id UUID REFERENCES reminders(id) ON DELETE CASCADE,

  -- Sync tracking
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error')),
  sync_error TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure either event_id or reminder_id is set (not both null)
  CHECK (event_id IS NOT NULL OR reminder_id IS NOT NULL)
);

-- Enable RLS
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own event reminders"
  ON event_reminders
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own event reminders"
  ON event_reminders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own event reminders"
  ON event_reminders
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own event reminders"
  ON event_reminders
  FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_event_reminders_user_id ON event_reminders(user_id);
CREATE INDEX idx_event_reminders_event_id ON event_reminders(event_id);
CREATE INDEX idx_event_reminders_reminder_id ON event_reminders(reminder_id);

-- Update timestamp trigger
CREATE TRIGGER event_reminders_updated_at
  BEFORE UPDATE ON event_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_connections_updated_at();
