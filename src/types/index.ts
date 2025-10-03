export type PlanType = 'free' | 'pro';
export type PriorityType = 'low' | 'medium' | 'high';
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
export type CalendarSource = 'google' | 'outlook' | 'ical';

export interface User {
  id: string;
  email: string;
  plan: PlanType;
  streak_count: number;
  completed_reminders: number;
  calendar_tokens: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  datetime: string;
  recurrence?: RecurrenceType;
  priority: PriorityType;
  tags: string[];
  notification_channels: string[];
  synced_to_calendar: boolean;
  location_trigger?: {
    lat: number;
    lon: number;
    radius: number;
  };
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  user_id: string;
  source: CalendarSource;
  external_id?: string;
  title: string;
  description?: string;
  datetime: string;
  end_datetime?: string;
  location?: string;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface SharedReminder {
  id: string;
  reminder_id: string;
  shared_by: string;
  shared_with: string;
  can_edit: boolean;
  created_at: string;
}

export interface NotificationLog {
  id: string;
  user_id: string;
  reminder_id?: string;
  channel: string;
  status: string;
  sent_at: string;
  error_message?: string;
}

export interface CreateReminderData {
  title: string;
  description?: string;
  datetime: string;
  recurrence?: RecurrenceType;
  priority?: PriorityType;
  tags?: string[];
  notification_channels?: string[];
  location_trigger?: {
    lat: number;
    lon: number;
    radius: number;
  };
}

export interface CalendarToken {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  provider: CalendarSource;
}