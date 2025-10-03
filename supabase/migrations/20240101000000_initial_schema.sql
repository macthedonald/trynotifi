-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE plan_type AS ENUM ('free', 'pro');
CREATE TYPE priority_type AS ENUM ('low', 'medium', 'high');
CREATE TYPE recurrence_type AS ENUM ('daily', 'weekly', 'monthly', 'yearly', 'custom');
CREATE TYPE calendar_source AS ENUM ('google', 'outlook', 'ical');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    plan plan_type DEFAULT 'free' NOT NULL,
    streak_count INTEGER DEFAULT 0 NOT NULL,
    completed_reminders INTEGER DEFAULT 0 NOT NULL,
    calendar_tokens JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reminders table
CREATE TABLE public.reminders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    recurrence recurrence_type DEFAULT NULL,
    priority priority_type DEFAULT 'medium',
    tags TEXT[] DEFAULT '{}',
    notification_channels TEXT[] DEFAULT '{"email"}',
    synced_to_calendar BOOLEAN DEFAULT FALSE,
    location_trigger JSONB DEFAULT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table (for calendar sync)
CREATE TABLE public.events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    source calendar_source NOT NULL,
    external_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE,
    location TEXT,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, source, external_id)
);

-- Shared reminders table (for collaboration)
CREATE TABLE public.shared_reminders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reminder_id UUID REFERENCES public.reminders(id) ON DELETE CASCADE NOT NULL,
    shared_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    shared_with UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    can_edit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification logs table
CREATE TABLE public.notification_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    reminder_id UUID REFERENCES public.reminders(id) ON DELETE CASCADE,
    channel TEXT NOT NULL,
    status TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error_message TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX idx_reminders_datetime ON public.reminders(datetime);
CREATE INDEX idx_reminders_user_datetime ON public.reminders(user_id, datetime);
CREATE INDEX idx_events_user_id ON public.events(user_id);
CREATE INDEX idx_events_datetime ON public.events(datetime);
CREATE INDEX idx_events_source ON public.events(source);
CREATE INDEX idx_shared_reminders_shared_with ON public.shared_reminders(shared_with);
CREATE INDEX idx_notification_logs_user_id ON public.notification_logs(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can only access their own user record
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Users can manage their own reminders
CREATE POLICY "Users can view own reminders" ON public.reminders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders" ON public.reminders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders" ON public.reminders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders" ON public.reminders
    FOR DELETE USING (auth.uid() = user_id);

-- Users can view shared reminders
CREATE POLICY "Users can view shared reminders" ON public.reminders
    FOR SELECT USING (
        auth.uid() = user_id OR
        id IN (
            SELECT reminder_id FROM public.shared_reminders
            WHERE shared_with = auth.uid()
        )
    );

-- Events policies
CREATE POLICY "Users can view own events" ON public.events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events" ON public.events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events" ON public.events
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events" ON public.events
    FOR DELETE USING (auth.uid() = user_id);

-- Shared reminders policies
CREATE POLICY "Users can view shared reminders they created" ON public.shared_reminders
    FOR SELECT USING (auth.uid() = shared_by);

CREATE POLICY "Users can view shared reminders shared with them" ON public.shared_reminders
    FOR SELECT USING (auth.uid() = shared_with);

CREATE POLICY "Users can create shared reminders" ON public.shared_reminders
    FOR INSERT WITH CHECK (auth.uid() = shared_by);

CREATE POLICY "Users can delete shared reminders they created" ON public.shared_reminders
    FOR DELETE USING (auth.uid() = shared_by);

-- Notification logs policies
CREATE POLICY "Users can view own notification logs" ON public.notification_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notification logs" ON public.notification_logs
    FOR INSERT WITH CHECK (true);

-- Functions and triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON public.reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle user creation (trigger on auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on auth signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to increment completed reminders and update streak
CREATE OR REPLACE FUNCTION public.increment_completed_reminder(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.users
    SET
        completed_reminders = completed_reminders + 1,
        streak_count = streak_count + 1
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;