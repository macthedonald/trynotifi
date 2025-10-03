import { supabase } from '@/lib/database/supabase'

export interface ScheduleAction {
  action: 'create_reminder'
  data: {
    title: string
    description?: string
    datetime: string
    recurrence?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
    priority?: 'low' | 'medium' | 'high'
    notification_channels?: string[]
    location_trigger?: any
    tags?: string[]
  }
}

/**
 * Parse relative datetime strings like "TOMORROW_2PM" into actual dates
 */
export function parseRelativeDateTime(relativeDatetime: string): Date {
  const now = new Date()
  const parts = relativeDatetime.split('_')

  let targetDate = new Date(now)
  let hour = 9 // default to 9 AM
  let minute = 0

  // Parse the date part
  const datePart = parts[0]
  switch (datePart) {
    case 'TODAY':
      // Keep current date
      break
    case 'TOMORROW':
      targetDate.setDate(targetDate.getDate() + 1)
      break
    case 'NEXT':
      // Handle "NEXT_MONDAY", "NEXT_TUESDAY", etc.
      if (parts[1]) {
        const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
        const targetDay = daysOfWeek.indexOf(parts[1])
        if (targetDay !== -1) {
          const currentDay = targetDate.getDay()
          let daysToAdd = targetDay - currentDay
          if (daysToAdd <= 0) daysToAdd += 7 // Next week
          targetDate.setDate(targetDate.getDate() + daysToAdd)
        }
      }
      break
    default:
      // Try to parse as ISO date
      const parsed = new Date(relativeDatetime)
      if (!isNaN(parsed.getTime())) {
        return parsed
      }
  }

  // Parse the time part
  const timePart = parts.length > 1 ? parts[parts.length - 1] : null
  if (timePart) {
    // Match patterns like "2PM", "10AM", "14H30", "9H00"
    const timeMatch = timePart.match(/(\d{1,2})(?:H|:)?(\d{2})?(AM|PM)?/)
    if (timeMatch) {
      hour = parseInt(timeMatch[1])
      minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0

      // Convert to 24-hour format if AM/PM specified
      if (timeMatch[3]) {
        if (timeMatch[3] === 'PM' && hour !== 12) {
          hour += 12
        } else if (timeMatch[3] === 'AM' && hour === 12) {
          hour = 0
        }
      }
    }
  }

  targetDate.setHours(hour, minute, 0, 0)
  return targetDate
}

/**
 * Extract schedule actions from AI response text
 */
export function extractScheduleActions(responseText: string): ScheduleAction | null {
  // Look for JSON blocks with SCHEDULE_ACTION tag
  const regex = /```SCHEDULE_ACTION\s*\n([\s\S]*?)\n```/
  const match = responseText.match(regex)

  if (match && match[1]) {
    try {
      const action = JSON.parse(match[1]) as ScheduleAction
      return action
    } catch (error) {
      console.error('Failed to parse schedule action:', error)
      return null
    }
  }

  return null
}

/**
 * Create a reminder in the database
 */
export async function createReminderFromChat(
  userId: string,
  action: ScheduleAction
): Promise<{ success: boolean; reminderId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('reminders')
      .insert({
        user_id: userId,
        title: action.data.title,
        description: action.data.description || '',
        datetime: parseRelativeDateTime(action.data.datetime).toISOString(),
        recurrence: action.data.recurrence || null,
        priority: action.data.priority || 'medium',
        notification_channels: action.data.notification_channels || ['email'],
        tags: action.data.tags || [],
        location_trigger: action.data.location_trigger || null,
        completed: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating reminder:', error)
      return { success: false, error: error.message }
    }

    return { success: true, reminderId: data.id }
  } catch (error: any) {
    console.error('Error creating reminder:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Process AI response and create reminders if needed
 */
export async function processAIResponseForActions(
  userId: string,
  responseText: string
): Promise<{ hasAction: boolean; success?: boolean; reminderId?: string; cleanedResponse: string }> {
  const action = extractScheduleActions(responseText)

  if (!action) {
    return {
      hasAction: false,
      cleanedResponse: responseText
    }
  }

  // Remove the JSON block from the response
  const cleanedResponse = responseText.replace(/```SCHEDULE_ACTION\s*\n[\s\S]*?\n```/g, '').trim()

  // Create the reminder
  const result = await createReminderFromChat(userId, action)

  return {
    hasAction: true,
    success: result.success,
    reminderId: result.reminderId,
    cleanedResponse
  }
}
