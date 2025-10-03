"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Reminder, Event } from '@/types'
import { getUserReminders } from '@/lib/database/reminders'
import { getUserEventsInRange } from '@/lib/database/events'
import { supabase } from '@/lib/database/supabase'
import { useAuth } from '@/context/AuthContext'

export type DashboardItem = (Reminder & { type: 'reminder' }) | (Event & { type: 'event' })

export type DashboardFilter = 'all' | 'reminders' | 'events' | 'with-notifications'

interface UseDashboardItemsOptions {
	selectedDate: Date
	filter?: DashboardFilter
}

export const useDashboardItems = (options: UseDashboardItemsOptions | Date) => {
	// Support both old and new API
	const { selectedDate, filter = 'all' } = typeof options === 'object' && 'selectedDate' in options
		? options
		: { selectedDate: options as Date, filter: 'all' as DashboardFilter }

	const { user } = useAuth()
	const [items, setItems] = useState<DashboardItem[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const startOfDay = useMemo(() => {
		const d = new Date(selectedDate)
		d.setHours(0, 0, 0, 0)
		return d
	}, [selectedDate])

	const endOfDay = useMemo(() => {
		const d = new Date(selectedDate)
		d.setHours(23, 59, 59, 999)
		return d
	}, [selectedDate])

	const fetchItems = useCallback(async () => {
		try {
			setLoading(true)
			setError(null)

			// Fetch reminders for the day (client filters after fetching all user's reminders)
			const reminders = await getUserReminders()
			const dayReminders = reminders.filter(r => {
				const t = new Date(r.datetime).getTime()
				return t >= startOfDay.getTime() && t <= endOfDay.getTime()
			}) as (Reminder & { type: 'reminder' })[]
			for (const r of dayReminders) (r as any).type = 'reminder'

			// Fetch events for the day via range query
			const events = await getUserEventsInRange(startOfDay.toISOString(), endOfDay.toISOString())
			const dayEvents = events.map(e => ({ ...(e as any), type: 'event' as const }))

			// Combine and sort
			let combined: DashboardItem[] = [...dayReminders, ...dayEvents].sort((a, b) => {
				const timeA = (a.type === 'reminder' ? a.datetime : a.datetime)
				const timeB = (b.type === 'reminder' ? b.datetime : b.datetime)
				return new Date(timeA).getTime() - new Date(timeB).getTime()
			})

			// Apply filter
			if (filter === 'reminders') {
				combined = combined.filter(item => item.type === 'reminder')
			} else if (filter === 'events') {
				combined = combined.filter(item => item.type === 'event')
			} else if (filter === 'with-notifications') {
				combined = combined.filter(item => {
					if (item.type === 'reminder') {
						return item.notification_channels && item.notification_channels.length > 0
					} else {
						return item.has_notifications === true
					}
				})
			}

			setItems(combined)
		} catch (err: any) {
			setError(err.message || 'Failed to load dashboard items')
		} finally {
			setLoading(false)
		}
	}, [startOfDay, endOfDay, filter])

	useEffect(() => {
		fetchItems()
	}, [fetchItems])

	// Set up realtime subscriptions
	useEffect(() => {
		if (!user) return

		const remindersChannel = supabase
			.channel('reminders_realtime')
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'reminders',
					filter: `user_id=eq.${user.id}`
				},
				() => {
					console.log('Reminders updated, refetching...')
					fetchItems()
				}
			)
			.subscribe()

		const eventsChannel = supabase
			.channel('events_realtime')
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'events',
					filter: `user_id=eq.${user.id}`
				},
				() => {
					console.log('Events updated, refetching...')
					fetchItems()
				}
			)
			.subscribe()

		return () => {
			supabase.removeChannel(remindersChannel)
			supabase.removeChannel(eventsChannel)
		}
	}, [user, fetchItems])

	return {
		items,
		loading,
		error,
		reload: fetchItems,
		reminders: items.filter((item): item is Reminder & { type: 'reminder' } => item.type === 'reminder'),
		events: items.filter((item): item is Event & { type: 'event' } => item.type === 'event')
	}
}

// Hook for dashboard stats
export const useDashboardStats = () => {
	const { user } = useAuth()
	const [stats, setStats] = useState({
		todayCount: 0,
		overdueCount: 0,
		upcomingCount: 0
	})

	useEffect(() => {
		if (!user) return

		const fetchStats = async () => {
			const now = new Date()
			const startOfToday = new Date(now)
			startOfToday.setHours(0, 0, 0, 0)

			const endOfToday = new Date(now)
			endOfToday.setHours(23, 59, 59, 999)

			// Today's count (reminders + events)
			const { count: todayReminders } = await supabase
				.from('reminders')
				.select('*', { count: 'exact', head: true })
				.eq('user_id', user.id)
				.eq('completed', false)
				.gte('datetime', startOfToday.toISOString())
				.lte('datetime', endOfToday.toISOString())

			const { count: todayEvents } = await supabase
				.from('events')
				.select('*', { count: 'exact', head: true })
				.eq('user_id', user.id)
				.gte('datetime', startOfToday.toISOString())
				.lte('datetime', endOfToday.toISOString())

			// Overdue count
			const { count: overdueCount } = await supabase
				.from('reminders')
				.select('*', { count: 'exact', head: true })
				.eq('user_id', user.id)
				.eq('completed', false)
				.lt('datetime', startOfToday.toISOString())

			// Upcoming count (next 7 days)
			const startOfTomorrow = new Date(now)
			startOfTomorrow.setDate(startOfTomorrow.getDate() + 1)
			startOfTomorrow.setHours(0, 0, 0, 0)

			const endOfWeek = new Date(now)
			endOfWeek.setDate(endOfWeek.getDate() + 7)
			endOfWeek.setHours(23, 59, 59, 999)

			const { count: upcomingReminders } = await supabase
				.from('reminders')
				.select('*', { count: 'exact', head: true })
				.eq('user_id', user.id)
				.eq('completed', false)
				.gte('datetime', startOfTomorrow.toISOString())
				.lte('datetime', endOfWeek.toISOString())

			const { count: upcomingEvents } = await supabase
				.from('events')
				.select('*', { count: 'exact', head: true })
				.eq('user_id', user.id)
				.gte('datetime', startOfTomorrow.toISOString())
				.lte('datetime', endOfWeek.toISOString())

			setStats({
				todayCount: (todayReminders || 0) + (todayEvents || 0),
				overdueCount: overdueCount || 0,
				upcomingCount: (upcomingReminders || 0) + (upcomingEvents || 0)
			})
		}

		fetchStats()

		// Refresh stats when data changes
		const channel = supabase
			.channel('stats_changes')
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'reminders',
					filter: `user_id=eq.${user.id}`
				},
				() => fetchStats()
			)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'events',
					filter: `user_id=eq.${user.id}`
				},
				() => fetchStats()
			)
			.subscribe()

		return () => {
			supabase.removeChannel(channel)
		}
	}, [user])

	return stats
}


