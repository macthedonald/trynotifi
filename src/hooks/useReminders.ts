'use client'

import { useState, useEffect, useCallback } from 'react'
import { Reminder, CreateReminderData } from '@/types'
import {
  getUserReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  completeReminder,
  getUpcomingReminders,
  getOverdueReminders,
  searchReminders,
} from '@/lib/database/reminders'

export const useReminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReminders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getUserReminders()
      setReminders(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reminders')
    } finally {
      setLoading(false)
    }
  }, [])

  const addReminder = useCallback(async (data: CreateReminderData) => {
    try {
      setError(null)
      const newReminder = await createReminder(data)
      setReminders(prev => [...prev, newReminder])
      return newReminder
    } catch (err: any) {
      setError(err.message || 'Failed to create reminder')
      throw err
    }
  }, [])

  const editReminder = useCallback(async (id: string, updates: Partial<Reminder>) => {
    try {
      setError(null)
      const updatedReminder = await updateReminder(id, updates)
      setReminders(prev =>
        prev.map(reminder =>
          reminder.id === id ? updatedReminder : reminder
        )
      )
      return updatedReminder
    } catch (err: any) {
      setError(err.message || 'Failed to update reminder')
      throw err
    }
  }, [])

  const removeReminder = useCallback(async (id: string) => {
    try {
      setError(null)
      await deleteReminder(id)
      setReminders(prev => prev.filter(reminder => reminder.id !== id))
    } catch (err: any) {
      setError(err.message || 'Failed to delete reminder')
      throw err
    }
  }, [])

  const markCompleted = useCallback(async (id: string) => {
    try {
      setError(null)
      const completedReminder = await completeReminder(id)
      setReminders(prev =>
        prev.map(reminder =>
          reminder.id === id ? completedReminder : reminder
        )
      )
      return completedReminder
    } catch (err: any) {
      setError(err.message || 'Failed to complete reminder')
      throw err
    }
  }, [])

  const search = useCallback(async (query: string) => {
    try {
      setError(null)
      const results = await searchReminders(query)
      return results
    } catch (err: any) {
      setError(err.message || 'Failed to search reminders')
      throw err
    }
  }, [])

  useEffect(() => {
    fetchReminders()
  }, [fetchReminders])

  return {
    reminders,
    loading,
    error,
    refetch: fetchReminders,
    addReminder,
    editReminder,
    removeReminder,
    markCompleted,
    search,
  }
}

export const useUpcomingReminders = (limit?: number) => {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUpcoming = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getUpcomingReminders(limit)
      setReminders(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch upcoming reminders')
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchUpcoming()
  }, [fetchUpcoming])

  return {
    reminders,
    loading,
    error,
    refetch: fetchUpcoming,
  }
}

export const useOverdueReminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOverdue = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getOverdueReminders()
      setReminders(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch overdue reminders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOverdue()
  }, [fetchOverdue])

  return {
    reminders,
    loading,
    error,
    refetch: fetchOverdue,
  }
}