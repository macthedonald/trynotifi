import { supabase } from './supabase'
import { Reminder, CreateReminderData, PriorityType, RecurrenceType } from '@/types'
import type { Database } from '@/types/database'

export const createReminder = async (data: CreateReminderData): Promise<Reminder> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const reminderData = {
    user_id: user.id,
    title: data.title,
    description: data.description || null,
    datetime: data.datetime,
    recurrence: data.recurrence || null,
    priority: data.priority || 'medium',
    tags: data.tags || [],
    notification_channels: data.notification_channels || ['email'],
    synced_to_calendar: false,
    location_trigger: data.location_trigger || null,
    completed: false,
  } as const

  const { data: reminder, error } = await (supabase as any)
    .from('reminders')
    .insert(reminderData)
    .select()
    .single()

  if (error) {
    throw error
  }

  return reminder as Reminder
}

export const getUserReminders = async (): Promise<Reminder[]> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: reminders, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', user.id)
    .order('datetime', { ascending: true })

  if (error) {
    throw error
  }

  return reminders || []
}

export const updateReminder = async (id: string, updates: Partial<Reminder>): Promise<Reminder> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: reminder, error } = await (supabase as any)
    .from('reminders')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return reminder as Reminder
}

export const deleteReminder = async (id: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    throw error
  }
}

export const completeReminder = async (id: string): Promise<Reminder> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: reminder, error } = await (supabase as any)
    .from('reminders')
    .update({ completed: true })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    throw error
  }

  // Increment completed reminders count
  await supabase.rpc('increment_completed_reminder', { user_uuid: user.id } as any)

  return reminder as Reminder
}

export const getUpcomingReminders = async (limit: number = 10): Promise<Reminder[]> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const now = new Date().toISOString()

  const { data: reminders, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', user.id)
    .eq('completed', false)
    .gte('datetime', now)
    .order('datetime', { ascending: true })
    .limit(limit)

  if (error) {
    throw error
  }

  return reminders || []
}

export const getOverdueReminders = async (): Promise<Reminder[]> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const now = new Date().toISOString()

  const { data: reminders, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', user.id)
    .eq('completed', false)
    .lt('datetime', now)
    .order('datetime', { ascending: false })

  if (error) {
    throw error
  }

  return reminders || []
}

export const searchReminders = async (query: string): Promise<Reminder[]> => {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: reminders, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', user.id)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order('datetime', { ascending: true })

  if (error) {
    throw error
  }

  return reminders || []
}