'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CreateReminderData, PriorityType, RecurrenceType } from '@/types'

const reminderSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  datetime: z.string().min(1, 'Date and time is required'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  recurrence: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'custom']).optional(),
  tags: z.string().optional(),
  notification_channels: z.array(z.string()).default(['email']),
})

type ReminderFormData = z.infer<typeof reminderSchema>

interface ReminderFormProps {
  onSubmit: (data: CreateReminderData) => Promise<void>
  onCancel?: () => void
  initialData?: Partial<CreateReminderData>
  isLoading?: boolean
}

export const ReminderForm = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: ReminderFormProps) => {
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ReminderFormData>({
    // resolver: zodResolver(reminderSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      datetime: initialData?.datetime || '',
      priority: initialData?.priority || 'medium',
      recurrence: initialData?.recurrence,
      tags: initialData?.tags?.join(', ') || '',
      notification_channels: initialData?.notification_channels || ['email'],
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = form

  const watchedChannels = watch('notification_channels')

  const handleFormSubmit = async (data: ReminderFormData) => {
    setError(null)
    try {
      const reminderData: CreateReminderData = {
        title: data.title,
        description: data.description,
        datetime: data.datetime,
        priority: data.priority,
        recurrence: data.recurrence,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        notification_channels: data.notification_channels,
      }

      await onSubmit(reminderData)
    } catch (err: any) {
      setError(err.message || 'Failed to save reminder')
    }
  }

  const handleChannelChange = (channel: string, checked: boolean) => {
    const currentChannels = watchedChannels || []
    if (checked) {
      setValue('notification_channels', [...currentChannels, channel])
    } else {
      setValue('notification_channels', currentChannels.filter(c => c !== channel))
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit as any)} className="space-y-4 lg:space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div>
        <Input
          label="Title"
          placeholder="Remind me to..."
          {...register('title')}
          error={errors.title?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          placeholder="Add more details..."
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm lg:text-base"
          rows={3}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
        )}
      </div>

      <div>
        <Input
          type="datetime-local"
          label="Date & Time"
          {...register('datetime')}
          error={errors.datetime?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Priority
        </label>
        <select
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm lg:text-base"
          {...register('priority')}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Recurrence
        </label>
        <select
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm lg:text-base"
          {...register('recurrence')}
        >
          <option value="">No recurrence</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      <div>
        <Input
          label="Tags (comma-separated)"
          placeholder="work, personal, urgent"
          {...register('tags')}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notification Channels
        </label>
        <div className="space-y-2">
          {['email', 'sms', 'push'].map((channel) => (
            <label key={channel} className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={watchedChannels?.includes(channel) || false}
                onChange={(e) => handleChannelChange(channel, e.target.checked)}
              />
              <span className="ml-2 text-sm text-gray-700 capitalize">
                {channel}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-end space-y-2 lg:space-y-0 lg:space-x-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full lg:w-auto"
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="w-full lg:w-auto">
          {isLoading ? 'Saving...' : 'Save Reminder'}
        </Button>
      </div>
    </form>
  )
}