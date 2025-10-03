'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Reminder } from '@/types'

interface ReminderCardProps {
  reminder: Reminder
  onComplete: (id: string) => Promise<void>
  onEdit: (id: string) => void
  onDelete: (id: string) => Promise<void>
}

export const ReminderCard = ({
  reminder,
  onComplete,
  onEdit,
  onDelete,
}: ReminderCardProps) => {
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleComplete = async () => {
    setCompletingId(reminder.id)
    try {
      await onComplete(reminder.id)
    } finally {
      setCompletingId(null)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this reminder?')) return

    setDeletingId(reminder.id)
    try {
      await onDelete(reminder.id)
    } finally {
      setDeletingId(null)
    }
  }

  const getIconForPriority = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          icon: (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ),
          bgColor: 'from-red-400 to-pink-500',
          textColor: 'text-white'
        }
      case 'medium':
        return {
          icon: (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          ),
          bgColor: 'from-yellow-400 to-orange-500',
          textColor: 'text-white'
        }
      case 'low':
        return {
          icon: (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ),
          bgColor: 'from-green-400 to-blue-500',
          textColor: 'text-white'
        }
      default:
        return {
          icon: (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          ),
          bgColor: 'from-purple-400 to-indigo-500',
          textColor: 'text-white'
        }
    }
  }

  const getTimeStatus = (datetime: string) => {
    const now = new Date()
    const reminderTime = new Date(datetime)
    const isOverdue = reminderTime < now

    return {
      isOverdue,
      timeText: format(reminderTime, 'h:mm a'),
      dateText: format(reminderTime, 'MMM d')
    }
  }

  const iconConfig = getIconForPriority(reminder.priority)
  const { isOverdue, timeText, dateText } = getTimeStatus(reminder.datetime)

  return (
    <div className={`bg-white/20 backdrop-blur-sm rounded-xl lg:rounded-2xl p-4 lg:p-6 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:bg-white/35 hover:border hover:border-white/30 ${
      reminder.completed ? 'opacity-60 scale-95' : ''
    } ${isOverdue && !reminder.completed ? 'ring-2 ring-red-300 animate-pulse' : ''}`}>
      <div className="flex items-start space-x-3 lg:space-x-4">
        {/* Icon */}
        <div className={`w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br ${iconConfig.bgColor} rounded-lg lg:rounded-xl flex items-center justify-center ${iconConfig.textColor} shadow-lg flex-shrink-0`}>
          <div className="w-5 h-5 lg:w-6 lg:h-6">
            {iconConfig.icon}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className={`font-semibold text-gray-800 mb-1 text-sm lg:text-base ${reminder.completed ? 'line-through' : ''}`}>
                {reminder.title}
              </h3>

              {reminder.description && (
                <p className={`text-xs lg:text-sm text-gray-600 mb-3 ${reminder.completed ? 'line-through' : ''}`}>
                  {reminder.description}
                </p>
              )}

              <div className="flex items-center space-x-2 lg:space-x-4 text-xs lg:text-sm flex-wrap">
                <span className={`font-medium ${isOverdue && !reminder.completed ? 'text-red-600' : 'text-gray-700'}`}>
                  {timeText} • {dateText}
                  {isOverdue && !reminder.completed && ' (Overdue)'}
                </span>

                {reminder.recurrence && (
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                    {reminder.recurrence}
                  </span>
                )}
              </div>

              {reminder.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {reminder.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-white/30 text-gray-700 px-2 py-1 rounded-full text-xs font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col lg:flex-row items-center space-y-1 lg:space-y-0 lg:space-x-2 ml-2 lg:ml-4">
              {!reminder.completed && (
                <>
                  <button
                    onClick={() => onEdit(reminder.id)}
                    className="p-1.5 lg:p-2 text-gray-500 hover:text-gray-700 hover:bg-white/20 rounded-lg transition-all duration-300 transform hover:scale-110 hover:shadow-md group"
                    title="Edit"
                  >
                    <svg className="w-4 h-4 transition-all duration-300 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={completingId === reminder.id}
                    className="p-1.5 lg:p-2 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-300 transform hover:scale-110 hover:shadow-md disabled:opacity-50 disabled:transform-none group"
                    title="Complete"
                  >
                    <svg className="w-4 h-4 transition-all duration-300 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </>
              )}
              <button
                onClick={handleDelete}
                disabled={deletingId === reminder.id}
                className="p-1.5 lg:p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300 transform hover:scale-110 hover:shadow-md disabled:opacity-50 disabled:transform-none group"
                title="Delete"
              >
                <svg className="w-4 h-4 transition-all duration-300 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}