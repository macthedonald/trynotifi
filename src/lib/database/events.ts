import { supabase } from './supabase'
import { Event } from '@/types'

export const getUserEventsInRange = async (startIso: string, endIso: string): Promise<Event[]> => {
	const { data: { user } } = await supabase.auth.getUser()

	if (!user) {
		throw new Error('User not authenticated')
	}

	const { data: events, error } = await supabase
		.from('events')
		.select('*')
		.eq('user_id', user.id)
		.gte('datetime', startIso)
		.lte('datetime', endIso)
		.order('datetime', { ascending: true })

	if (error) {
		throw error
	}

	return events || []
}


