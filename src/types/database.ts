export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          timezone: string | null
          plan: 'free' | 'pro'
          streak_count: number
          completed_reminders: number
          total_completed_reminders: number
          calendar_tokens: Json
          stripe_customer_id: string | null
          subscription_id: string | null
          subscription_status: string | null
          settings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          timezone?: string | null
          plan?: 'free' | 'pro'
          streak_count?: number
          completed_reminders?: number
          total_completed_reminders?: number
          calendar_tokens?: Json
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          timezone?: string | null
          plan?: 'free' | 'pro'
          streak_count?: number
          completed_reminders?: number
          total_completed_reminders?: number
          calendar_tokens?: Json
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      reminders: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          datetime: string
          recurrence: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | null
          priority: 'low' | 'medium' | 'high'
          tags: string[]
          notification_channels: string[]
          notification_lead_times: number[] | null
          synced_to_calendar: boolean
          location_trigger: Json | null
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          datetime: string
          recurrence?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | null
          priority?: 'low' | 'medium' | 'high'
          tags?: string[]
          notification_channels?: string[]
          notification_lead_times?: number[] | null
          synced_to_calendar?: boolean
          location_trigger?: Json | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          datetime?: string
          recurrence?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | null
          priority?: 'low' | 'medium' | 'high'
          tags?: string[]
          notification_channels?: string[]
          notification_lead_times?: number[] | null
          synced_to_calendar?: boolean
          location_trigger?: Json | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          user_id: string
          source: 'google' | 'outlook' | 'ical'
          external_id: string | null
          title: string
          description: string | null
          datetime: string
          end_datetime: string | null
          location: string | null
          has_notifications: boolean | null
          notification_count: number | null
          is_all_day: boolean | null
          event_url: string | null
          synced_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          source: 'google' | 'outlook' | 'ical'
          external_id?: string | null
          title: string
          description?: string | null
          datetime: string
          end_datetime?: string | null
          location?: string | null
          has_notifications?: boolean | null
          notification_count?: number | null
          is_all_day?: boolean | null
          event_url?: string | null
          synced_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          source?: 'google' | 'outlook' | 'ical'
          external_id?: string | null
          title?: string
          description?: string | null
          datetime?: string
          end_datetime?: string | null
          location?: string | null
          has_notifications?: boolean | null
          notification_count?: number | null
          is_all_day?: boolean | null
          event_url?: string | null
          synced_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      shared_reminders: {
        Row: {
          id: string
          reminder_id: string
          shared_by: string
          shared_with: string
          can_edit: boolean
          created_at: string
        }
        Insert: {
          id?: string
          reminder_id: string
          shared_by: string
          shared_with: string
          can_edit?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          reminder_id?: string
          shared_by?: string
          shared_with?: string
          can_edit?: boolean
          created_at?: string
        }
      }
      notification_logs: {
        Row: {
          id: string
          user_id: string
          reminder_id: string | null
          channel: string
          status: string
          sent_at: string
          error_message: string | null
        }
        Insert: {
          id?: string
          user_id: string
          reminder_id?: string | null
          channel: string
          status: string
          sent_at?: string
          error_message?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          reminder_id?: string | null
          channel?: string
          status?: string
          sent_at?: string
          error_message?: string | null
        }
      }
      scheduled_notifications: {
        Row: {
          id: string
          user_id: string
          reminder_id: string | null
          event_id: string | null
          send_at: string
          lead_time_minutes: number
          channels: string[]
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          reminder_id?: string | null
          event_id?: string | null
          send_at: string
          lead_time_minutes: number
          channels: string[]
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          reminder_id?: string | null
          event_id?: string | null
          send_at?: string
          lead_time_minutes?: number
          channels?: string[]
          status?: string
          created_at?: string
        }
      }
      event_reminders: {
        Row: {
          id: string
          user_id: string
          event_id: string
          lead_time_minutes: number
          notification_channels: string[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_id: string
          lead_time_minutes: number
          notification_channels: string[]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_id?: string
          lead_time_minutes?: number
          notification_channels?: string[]
          created_at?: string
        }
      }
      calendar_integrations: {
        Row: {
          id: string
          user_id: string
          provider: string
          sync_direction: string
          last_synced: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          sync_direction: string
          last_synced?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          sync_direction?: string
          last_synced?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string
          messages: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          messages: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          messages?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}