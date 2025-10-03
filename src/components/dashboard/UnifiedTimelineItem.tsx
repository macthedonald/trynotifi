'use client'

import { format } from 'date-fns'
import { Reminder } from '@/types'

interface CalendarEvent {
  id: string
  user_id: string
  source: 'google' | 'outlook' | 'ical'
  external_id?: string | null
  title: string
  description?: string | null
  datetime: string
  end_datetime?: string | null
  location?: string | null
  synced_at: string
  created_at: string
  updated_at: string
}

type TimelineItem = (Reminder & { type: 'reminder' }) | (CalendarEvent & { type: 'event' })

interface UnifiedTimelineItemProps {
  item: TimelineItem
  onComplete?: (id: string) => Promise<void>
  onEdit?: (id: string) => void
  onDelete?: (id: string) => Promise<void>
}

export const UnifiedTimelineItem = ({
  item,
  onComplete,
  onEdit,
  onDelete,
}: UnifiedTimelineItemProps) => {
  const isReminder = item.type === 'reminder'
  const isEvent = item.type === 'event'

  const getTimeDisplay = () => {
    const datetime = new Date(item.datetime)
    const timeText = format(datetime, 'h:mm a')

    if (isEvent && 'end_datetime' in item && item.end_datetime) {
      const endTime = format(new Date(item.end_datetime), 'h:mm a')
      return `${timeText} - ${endTime}`
    }

    return timeText
  }

  const getPriorityBorderColor = () => {
    if (!isReminder) return 'border-l-gray-300'

    const reminder = item as Reminder & { type: 'reminder' }
    switch (reminder.priority) {
      case 'high':
        return 'border-l-orange-500'
      case 'medium':
        return 'border-l-blue-500'
      case 'low':
        return 'border-l-green-500'
      default:
        return 'border-l-gray-400'
    }
  }

  const getIcon = () => {
    if (isEvent) {
      return (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      )
    }

    // Default bell icon for reminders
    return (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
      </svg>
    )
  }

  return (
    <div className={`bg-white/40 backdrop-blur-sm rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-white/20 transition-all duration-300 hover:bg-white/60 hover:shadow-lg border-l-4 ${getPriorityBorderColor()}`}>
      <div className="flex items-start space-x-3 lg:space-x-4">
        {/* Checkbox for reminders only */}
        {isReminder && onComplete && (
          <button
            onClick={() => onComplete(item.id)}
            className="flex-shrink-0 w-5 h-5 rounded border-2 border-gray-400 hover:border-purple-500 transition-colors mt-1"
            title="Mark as complete"
          >
            {(item as Reminder & { type: 'reminder' }).completed && (
              <svg className="w-full h-full text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        )}

        {/* Icon */}
        <div className={`w-10 h-10 lg:w-12 lg:h-12 ${isEvent ? 'bg-gray-100' : 'bg-purple-100'} rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0 ${isEvent ? 'text-gray-600' : 'text-purple-600'}`}>
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1 text-sm lg:text-base">
                {item.title}
              </h3>

              {item.description && (
                <p className="text-xs lg:text-sm text-gray-600 mb-2">
                  {item.description}
                </p>
              )}

              <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500">
                {/* Time */}
                <span className="font-medium">
                  {getTimeDisplay()}
                </span>

                {/* Event-specific info */}
                {isEvent && 'location' in item && item.location && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {item.location}
                  </span>
                )}

                {/* Provider badge for events */}
                {isEvent && 'source' in item && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium capitalize">
                    {item.source}
                  </span>
                )}
              </div>

              {/* Tags for reminders */}
              {isReminder && 'tags' in item && item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-white/30 text-gray-700 px-2 py-1 rounded-full text-xs font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Notification channels for reminders */}
              {isReminder && 'notification_channels' in item && item.notification_channels && item.notification_channels.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  {item.notification_channels.includes('email') && (
                    <span className="text-gray-500" title="Email notification">
                      📧
                    </span>
                  )}
                  {item.notification_channels.includes('push') && (
                    <span className="text-gray-500" title="Push notification">
                      📱
                    </span>
                  )}
                  {item.notification_channels.includes('sms') && (
                    <span className="text-gray-500" title="SMS notification">
                      💬
                    </span>
                  )}
                </div>
              )}

              {/* Calendar sync badge for reminders */}
              {isReminder && 'synced_to_calendar' in item && item.synced_to_calendar && (
                <div className="mt-2">
                  <span className="text-xs text-gray-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    Synced to calendar
                  </span>
                </div>
              )}
            </div>

            {/* Actions menu */}
            <button
              className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
              title="More options"
            >
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}