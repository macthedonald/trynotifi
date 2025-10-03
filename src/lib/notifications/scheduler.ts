import { supabase } from '@/lib/database/supabase'

export interface ScheduleNotificationParams {
  userId: string
  reminderId?: string
  eventId?: string
  scheduledAt: Date
  leadTimes: number[] // Minutes before the event/reminder
  channels: ('email' | 'push' | 'sms')[]
}

/**
 * Schedule notifications for a reminder or event
 * Creates entries in scheduled_notifications table for each lead time
 */
export async function scheduleNotifications(params: ScheduleNotificationParams) {
  const { userId, reminderId, eventId, scheduledAt, leadTimes, channels } = params

  if (!reminderId && !eventId) {
    throw new Error('Either reminderId or eventId must be provided')
  }

  // Delete existing pending notifications for this item
  if (reminderId) {
    await supabase
      .from('scheduled_notifications')
      .delete()
      .eq('reminder_id', reminderId)
      .eq('status', 'pending')
  } else if (eventId) {
    await supabase
      .from('scheduled_notifications')
      .delete()
      .eq('event_id', eventId)
      .eq('status', 'pending')
  }

  // Create new scheduled notifications for each lead time
  const notifications = leadTimes.map(leadTime => {
    const sendAt = new Date(scheduledAt.getTime() - leadTime * 60000) // Convert minutes to milliseconds

    return {
      user_id: userId,
      reminder_id: reminderId,
      event_id: eventId,
      send_at: sendAt.toISOString(),
      lead_time_minutes: leadTime,
      channels,
      status: 'pending' as const
    }
  }).filter(notification => {
    // Only schedule notifications that are in the future
    return new Date(notification.send_at) > new Date()
  })

  if (notifications.length === 0) {
    console.warn('No future notifications to schedule')
    return { success: true, count: 0 }
  }

  const { error } = await supabase
    .from('scheduled_notifications')
    .insert(notifications)

  if (error) {
    console.error('Error scheduling notifications:', error)
    throw error
  }

  return {
    success: true,
    count: notifications.length
  }
}

/**
 * Cancel all pending notifications for a reminder or event
 */
export async function cancelNotifications(reminderId?: string, eventId?: string) {
  const { supabase: supabaseClient } = await import('@/lib/database/supabase')
  const supabase = supabaseClient

  if (!reminderId && !eventId) {
    throw new Error('Either reminderId or eventId must be provided')
  }

  const query = supabase
    .from('scheduled_notifications')
    .update({ status: 'cancelled' })
    .eq('status', 'pending')

  if (reminderId) {
    query.eq('reminder_id', reminderId)
  } else if (eventId) {
    query.eq('event_id', eventId)
  }

  const { error } = await query

  if (error) {
    console.error('Error cancelling notifications:', error)
    throw error
  }

  return { success: true }
}

/**
 * Get scheduled notifications for a reminder or event
 */
export async function getScheduledNotifications(reminderId?: string, eventId?: string) {
  const { supabase: supabaseClient } = await import('@/lib/database/supabase')
  const supabase = supabaseClient

  if (!reminderId && !eventId) {
    throw new Error('Either reminderId or eventId must be provided')
  }

  const query = supabase
    .from('scheduled_notifications')
    .select('*')
    .eq('status', 'pending')
    .order('send_at', { ascending: true })

  if (reminderId) {
    query.eq('reminder_id', reminderId)
  } else if (eventId) {
    query.eq('event_id', eventId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching scheduled notifications:', error)
    throw error
  }

  return data || []
}

/**
 * Update notification channels for existing scheduled notifications
 */
export async function updateNotificationChannels(
  channels: ('email' | 'push' | 'sms')[],
  reminderId?: string,
  eventId?: string
) {
  const { supabase: supabaseClient } = await import('@/lib/database/supabase')
  const supabase = supabaseClient

  if (!reminderId && !eventId) {
    throw new Error('Either reminderId or eventId must be provided')
  }

  const query = supabase
    .from('scheduled_notifications')
    .update({ channels })
    .eq('status', 'pending')

  if (reminderId) {
    query.eq('reminder_id', reminderId)
  } else if (eventId) {
    query.eq('event_id', eventId)
  }

  const { error } = await query

  if (error) {
    console.error('Error updating notification channels:', error)
    throw error
  }

  return { success: true }
}

/**
 * Get notification logs for a user
 */
export async function getNotificationLogs(
  userId: string,
  options?: {
    limit?: number
    status?: 'sent' | 'failed'
    channel?: 'email' | 'push' | 'sms'
  }
) {
  const { supabase: supabaseClient } = await import('@/lib/database/supabase')
  const supabase = supabaseClient

  let query = supabase
    .from('notification_logs')
    .select('*')
    .eq('user_id', userId)
    .order('sent_at', { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.channel) {
    query = query.eq('channel', options.channel)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching notification logs:', error)
    throw error
  }

  return data || []
}

/**
 * Format lead times into human-readable strings
 */
export function formatLeadTime(minutes: number): string {
  if (minutes === 0) return 'At time'
  if (minutes < 60) return `${minutes} minutes before`
  if (minutes < 1440) {
    const hours = minutes / 60
    return `${hours} hour${hours > 1 ? 's' : ''} before`
  }
  const days = minutes / 1440
  return `${days} day${days > 1 ? 's' : ''} before`
}

/**
 * Common notification lead time presets
 */
export const NOTIFICATION_PRESETS = [
  { label: 'At time', value: 0 },
  { label: '5 minutes before', value: 5 },
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '2 hours before', value: 120 },
  { label: '1 day before', value: 1440 },
  { label: '1 week before', value: 10080 }
] as const
