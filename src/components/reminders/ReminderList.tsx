'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Reminder } from '@/types'
import { Button } from '@/components/ui/Button'
import { ReminderForm } from './ReminderForm'

interface ReminderListProps {
  reminders: Reminder[]
  loading?: boolean
  onComplete: (id: string) => Promise<void>
  onEdit: (id: string, updates: Partial<Reminder>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export const ReminderList = ({
  reminders,
  loading = false,
  onComplete,
  onEdit,
  onDelete,
}: ReminderListProps) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleComplete = async (id: string) => {
    setCompletingId(id)
    try {
      await onComplete(id)
    } finally {
      setCompletingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return

    setDeletingId(id)
    try {
      await onDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

  const handleEdit = async (reminder: Reminder, updates: any) => {
    try {
      await onEdit(reminder.id, updates)
      setEditingId(null)
    } catch (error) {
      console.error('Failed to update reminder:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTimeStatus = (datetime: string) => {
    const now = new Date()
    const reminderTime = new Date(datetime)
    const isOverdue = reminderTime < now

    return {
      isOverdue,
      timeText: format(reminderTime, 'MMM d, yyyy h:mm a'),
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 lg:p-6">
            <div className="animate-shimmer h-6 rounded mb-3"></div>
            <div className="animate-shimmer h-4 rounded mb-2 w-3/4"></div>
            <div className="animate-shimmer h-4 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (reminders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">No reminders found</div>
        <p className="text-gray-400 mt-2">Create your first reminder to get started!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reminders.map((reminder) => {
        const { isOverdue, timeText } = getTimeStatus(reminder.datetime)

        if (editingId === reminder.id) {
          return (
            <div key={reminder.id} className="bg-white rounded-lg border p-6">
              <ReminderForm
                initialData={reminder}
                onSubmit={(data) => handleEdit(reminder, data)}
                onCancel={() => setEditingId(null)}
              />
            </div>
          )
        }

        return (
          <div
            key={reminder.id}
            className={`bg-white rounded-lg border p-4 lg:p-6 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-lg hover:border-gray-300 ${
              reminder.completed ? 'opacity-60 scale-95' : ''
            } ${isOverdue && !reminder.completed ? 'border-red-200 bg-red-50 animate-pulse' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 lg:gap-3 mb-2 flex-wrap">
                  <h3 className={`font-semibold text-sm lg:text-base ${reminder.completed ? 'line-through text-gray-500' : ''}`}>
                    {reminder.title}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(
                      reminder.priority
                    )}`}
                  >
                    {reminder.priority}
                  </span>
                </div>

                {reminder.description && (
                  <p className={`text-gray-600 mb-3 text-sm lg:text-base ${reminder.completed ? 'line-through' : ''}`}>
                    {reminder.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className={isOverdue && !reminder.completed ? 'text-red-600 font-medium' : ''}>
                    {timeText}
                    {isOverdue && !reminder.completed && ' (Overdue)'}
                  </span>

                  {reminder.recurrence && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                      {reminder.recurrence}
                    </span>
                  )}
                </div>

                {reminder.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {reminder.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col lg:flex-row items-end lg:items-center gap-2 ml-2 lg:ml-4">
                {!reminder.completed && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(reminder.id)}
                      className="w-full lg:w-auto text-xs lg:text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-md"
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleComplete(reminder.id)}
                      disabled={completingId === reminder.id}
                      className="w-full lg:w-auto text-xs lg:text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-md disabled:transform-none"
                    >
                      {completingId === reminder.id ? 'Completing...' : 'Complete'}
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(reminder.id)}
                  disabled={deletingId === reminder.id}
                  className="text-red-600 hover:bg-red-50 w-full lg:w-auto text-xs lg:text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-md disabled:transform-none"
                >
                  {deletingId === reminder.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}