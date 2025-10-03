'use client'

import { useState } from 'react'
import { Event } from '@/types'
import {
  Calendar,
  MapPin,
  Users,
  Bell,
  ExternalLink,
  MoreVertical,
  Plus,
  Eye,
  Link as LinkIcon,
  EyeOff
} from 'lucide-react'
import { format } from 'date-fns'

interface EventCardProps {
  event: Event & { type: 'event' }
  onSetNotifications?: (eventId: string) => void
}

const providerColors: Record<string, string> = {
  google: 'border-l-blue-500',
  outlook: 'border-l-cyan-500',
  ical: 'border-l-gray-500'
}

const providerLogos: Record<string, string> = {
  google: '📅',
  ical: '📆',
  outlook: '📆'
}

export function EventCard({ event, onSetNotifications }: EventCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  const formatTime = (datetime: string) => {
    return format(new Date(datetime), 'h:mm a')
  }

  const formatTimeRange = () => {
    const start = formatTime(event.datetime)
    const end = event.end_datetime ? formatTime(event.end_datetime) : null
    return end ? `${start} - ${end}` : start
  }

  return (
    <div
      className={`
        bg-white rounded-2xl shadow-lg p-4 lg:p-6
        border border-gray-200
        border-l-4 ${providerColors[event.source] || 'border-l-gray-400'}
        hover:shadow-xl transition-all duration-300
      `}
    >
      <div className="flex items-start gap-4">
        {/* Calendar Icon */}
        <div className="p-2 bg-gray-100 rounded-lg mt-1">
          <Calendar className="w-5 h-5 text-gray-700" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title with Provider Badge */}
          <div className="flex items-start gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 flex-1">
              {event.title}
            </h3>
            <span className="text-lg" title={`${event.source === 'google' ? 'Google' : 'Outlook'} Calendar`}>
              {providerLogos[event.source]}
            </span>
          </div>

          {/* Description */}
          {event.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {event.description}
            </p>
          )}

          {/* Location & Attendees */}
          <div className="flex flex-wrap items-center gap-3 mb-3 text-sm text-gray-600">
            {event.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
            )}
          </div>

          {/* Notifications Info */}
          {event.has_notifications && event.notification_count && event.notification_count > 0 ? (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 rounded-lg">
                <Bell className="w-4 h-4 text-purple-700" />
                <span className="text-sm text-purple-800 font-medium">
                  {event.notification_count} notification{event.notification_count > 1 ? 's' : ''} set
                </span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => onSetNotifications?.(event.id)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium hover:shadow-lg transition-all text-sm mb-3"
            >
              <Plus className="w-4 h-4" />
              Set Notifications
            </button>
          )}

          {/* Bottom Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {event.has_notifications && (
              <button
                onClick={() => onSetNotifications?.(event.id)}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
              >
                <Bell className="w-4 h-4" />
                Edit Notifications
              </button>
            )}

            {event.event_url && (
              <a
                href={event.event_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-gray-700 font-medium flex items-center gap-1"
              >
                <ExternalLink className="w-4 h-4" />
                Open in {event.source === 'google' ? 'Google' : 'Outlook'}
              </a>
            )}
          </div>
        </div>

        {/* Time & Menu */}
        <div className="flex flex-col items-end gap-2">
          <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
            {formatTimeRange()}
          </span>

          {event.is_all_day && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              All day
            </span>
          )}

          {/* Three-dot menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                  <button
                    onClick={() => {
                      onSetNotifications?.(event.id)
                      setShowMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Bell className="w-4 h-4" />
                    {event.has_notifications ? 'Edit' : 'Set'} Notifications
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  {event.event_url && (
                    <a
                      href={event.event_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open in Calendar
                    </a>
                  )}
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Copy Link
                  </button>
                  <div className="border-t border-gray-200 my-2" />
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-600">
                    <EyeOff className="w-4 h-4" />
                    Hide Event
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
