'use client'

import { useState } from 'react'
import { Reminder } from '@/types'
import {
  Bell,
  Pill,
  FileText,
  Dumbbell,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Check,
  MoreVertical,
  Edit,
  Trash2,
  Share2,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '@/lib/database/supabase'

interface ReminderCardProps {
  reminder: Reminder & { type: 'reminder' }
  onUpdate?: () => void
}

const priorityColors: Record<string, string> = {
  low: 'border-l-green-500',
  medium: 'border-l-blue-500',
  high: 'border-l-orange-500'
}

const categoryIcons: Record<string, any> = {
  health: Pill,
  work: FileText,
  fitness: Dumbbell,
  personal: Bell,
  call: Phone,
  default: Bell
}

export function ReminderCard({ reminder, onUpdate }: ReminderCardProps) {
  const [isCompleting, setIsCompleting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const Icon = reminder.tags?.[0]
    ? categoryIcons[reminder.tags[0].toLowerCase()] || categoryIcons.default
    : categoryIcons.default

  const handleComplete = async () => {
    setIsCompleting(true)
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ completed: true })
        .eq('id', reminder.id)

      if (error) throw error
      onUpdate?.()
    } catch (error) {
      console.error('Error completing reminder:', error)
    } finally {
      setIsCompleting(false)
    }
  }

  const formatTime = (datetime: string) => {
    return format(new Date(datetime), 'h:mm a')
  }

  return (
    <div
      className={`
        bg-white rounded-2xl shadow-lg p-4 lg:p-6
        border border-gray-200
        border-l-4 ${priorityColors[reminder.priority]}
        hover:shadow-xl transition-all duration-300
        ${reminder.completed ? 'opacity-60' : ''}
      `}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <button
          onClick={handleComplete}
          disabled={isCompleting || reminder.completed}
          className={`
            mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center
            transition-all duration-200
            ${reminder.completed
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 hover:border-purple-500'
            }
            ${isCompleting ? 'opacity-50' : ''}
          `}
        >
          {reminder.completed && <Check className="w-4 h-4 text-white" />}
        </button>

        {/* Icon */}
        <div className={`
          p-2 rounded-lg mt-1
          ${reminder.priority === 'high' ? 'bg-orange-100' :
            reminder.priority === 'medium' ? 'bg-blue-100' : 'bg-green-100'
          }
        `}>
          <Icon className={`
            w-5 h-5
            ${reminder.priority === 'high' ? 'text-orange-600' :
              reminder.priority === 'medium' ? 'text-blue-600' : 'text-green-600'
            }
          `} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`
            text-lg font-semibold text-gray-900 mb-1
            ${reminder.completed ? 'line-through' : ''}
          `}>
            {reminder.title}
          </h3>

          {reminder.description && (
            <p className="text-gray-600 text-sm mb-3">
              {reminder.description}
            </p>
          )}

          {/* Tags */}
          {reminder.tags && reminder.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {reminder.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Bottom row: Notifications + Calendar Sync */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Notification channels */}
            {reminder.notification_channels && reminder.notification_channels.length > 0 && (
              <div className="flex items-center gap-1.5">
                {reminder.notification_channels.includes('email') && (
                  <Mail className="w-4 h-4 text-gray-500 title="Email notification" />
                )}
                {reminder.notification_channels.includes('push') && (
                  <Bell className="w-4 h-4 text-gray-500 title="Push notification" />
                )}
                {reminder.notification_channels.includes('sms') && (
                  <MessageSquare className="w-4 h-4 text-gray-500" title="SMS notification" />
                )}
              </div>
            )}

            {/* Calendar sync badge */}
            {reminder.synced_to_calendar && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-lg">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs text-blue-700 font-medium">
                  Synced to Calendar
                </span>
              </div>
            )}

            {/* Lead times */}
            {reminder.notification_lead_times && reminder.notification_lead_times.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {reminder.notification_lead_times.map(minutes => {
                    if (minutes === 0) return 'At time'
                    if (minutes < 60) return `${minutes}m before`
                    if (minutes < 1440) return `${minutes / 60}h before`
                    return `${minutes / 1440}d before`
                  }).join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Time */}
        <div className="flex flex-col items-end gap-2">
          <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
            {formatTime(reminder.datetime)}
          </span>

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
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Change notifications
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {reminder.synced_to_calendar ? 'Update in calendar' : 'Sync to calendar'}
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <div className="border-t border-gray-200 my-2" />
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600">
                    <Trash2 className="w-4 h-4" />
                    Delete
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
