'use client'

import { useState } from 'react'
import { X, Bell, Mail, MessageSquare, Smartphone, Check, Clock } from 'lucide-react'
import { supabase } from '@/lib/database/supabase'
import { scheduleNotifications } from '@/lib/notifications/scheduler'

interface EventNotificationModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  eventTitle: string
  eventDateTime: string
  existingNotifications?: {
    lead_time_minutes: number
    notification_channels: string[]
  }[]
  onSave?: () => void
}

const LEAD_TIME_PRESETS = [
  { label: 'At time of event', value: 0 },
  { label: '5 minutes before', value: 5 },
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '2 hours before', value: 120 },
  { label: '1 day before', value: 1440 },
  { label: '1 week before', value: 10080 }
]

export function EventNotificationModal({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  eventDateTime,
  existingNotifications,
  onSave
}: EventNotificationModalProps) {
  const [selectedLeadTimes, setSelectedLeadTimes] = useState<number[]>(
    existingNotifications?.map(n => n.lead_time_minutes) || [15]
  )
  const [selectedChannels, setSelectedChannels] = useState<string[]>(
    existingNotifications?.[0]?.notification_channels || ['email', 'push']
  )
  const [customLeadTime, setCustomLeadTime] = useState('')
  const [customUnit, setCustomUnit] = useState<'minutes' | 'hours' | 'days'>('minutes')
  const [showCustom, setShowCustom] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) return null

  const toggleLeadTime = (value: number) => {
    setSelectedLeadTimes(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    )
  }

  const toggleChannel = (channel: string) => {
    setSelectedChannels(prev =>
      prev.includes(channel)
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    )
  }

  const addCustomLeadTime = () => {
    const minutes = parseInt(customLeadTime)
    if (!minutes || minutes <= 0) return

    let leadTimeMinutes = minutes
    if (customUnit === 'hours') leadTimeMinutes = minutes * 60
    if (customUnit === 'days') leadTimeMinutes = minutes * 1440

    if (!selectedLeadTimes.includes(leadTimeMinutes)) {
      setSelectedLeadTimes([...selectedLeadTimes, leadTimeMinutes])
    }
    setCustomLeadTime('')
    setShowCustom(false)
  }

  const handleSave = async () => {
    if (selectedLeadTimes.length === 0) {
      alert('Please select at least one notification time')
      return
    }

    if (selectedChannels.length === 0) {
      alert('Please select at least one notification channel')
      return
    }

    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Delete existing event_reminders for this event
      await supabase
        .from('event_reminders')
        .delete()
        .eq('event_id', eventId)

      // Create new event_reminders entries
      const eventReminders = selectedLeadTimes.map(leadTime => ({
        user_id: user.id,
        event_id: eventId,
        lead_time_minutes: leadTime,
        notification_channels: selectedChannels
      }))

      const { error: insertError } = await supabase
        .from('event_reminders')
        .insert(eventReminders)

      if (insertError) throw insertError

      // Schedule notifications
      await scheduleNotifications({
        userId: user.id,
        eventId,
        scheduledAt: new Date(eventDateTime),
        leadTimes: selectedLeadTimes,
        channels: selectedChannels as ('email' | 'push' | 'sms')[]
      })

      onSave?.()
      onClose()
    } catch (error) {
      console.error('Error saving notifications:', error)
      alert('Failed to save notifications. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const formatLeadTime = (minutes: number) => {
    if (minutes === 0) return 'At time'
    if (minutes < 60) return `${minutes} min before`
    if (minutes < 1440) return `${minutes / 60} hr before`
    return `${minutes / 1440} day${minutes / 1440 > 1 ? 's' : ''} before`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">Set Notifications</h2>
              <p className="text-purple-100 text-sm line-clamp-1">{eventTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* When to notify */}
          <div>
            <label className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
              <Clock className="w-5 h-5 text-purple-600" />
              When should we remind you?
            </label>
            <div className="space-y-2">
              {LEAD_TIME_PRESETS.map(preset => (
                <label
                  key={preset.value}
                  className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedLeadTimes.includes(preset.value)}
                    onChange={() => toggleLeadTime(preset.value)}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="flex-1 font-medium text-gray-700">{preset.label}</span>
                  {selectedLeadTimes.includes(preset.value) && (
                    <Check className="w-5 h-5 text-purple-600" />
                  )}
                </label>
              ))}

              {/* Custom lead time */}
              {!showCustom ? (
                <button
                  onClick={() => setShowCustom(true)}
                  className="w-full p-4 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-medium transition-colors"
                >
                  + Add Custom Time
                </button>
              ) : (
                <div className="p-4 bg-purple-50 rounded-xl space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={customLeadTime}
                      onChange={(e) => setCustomLeadTime(e.target.value)}
                      placeholder="Enter amount"
                      className="flex-1 px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="1"
                    />
                    <select
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value as any)}
                      className="px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={addCustomLeadTime}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowCustom(false)
                        setCustomLeadTime('')
                      }}
                      className="px-4 py-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Selected lead times preview */}
            {selectedLeadTimes.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm font-medium text-blue-900 mb-2">Selected notifications:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedLeadTimes.sort((a, b) => a - b).map(minutes => (
                    <span
                      key={minutes}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1"
                    >
                      {formatLeadTime(minutes)}
                      <button
                        onClick={() => toggleLeadTime(minutes)}
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* How to notify */}
          <div>
            <label className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
              <Bell className="w-5 h-5 text-purple-600" />
              How should we notify you?
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={selectedChannels.includes('email')}
                  onChange={() => toggleChannel('email')}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <Mail className="w-5 h-5 text-gray-600" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Email</div>
                  <div className="text-sm text-gray-600">Receive email notifications</div>
                </div>
                {selectedChannels.includes('email') && (
                  <Check className="w-5 h-5 text-purple-600" />
                )}
              </label>

              <label className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={selectedChannels.includes('push')}
                  onChange={() => toggleChannel('push')}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <Smartphone className="w-5 h-5 text-gray-600" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Push Notification</div>
                  <div className="text-sm text-gray-600">Mobile and browser notifications</div>
                </div>
                {selectedChannels.includes('push') && (
                  <Check className="w-5 h-5 text-purple-600" />
                )}
              </label>

              <label className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors opacity-75">
                <input
                  type="checkbox"
                  checked={selectedChannels.includes('sms')}
                  onChange={() => toggleChannel('sms')}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  disabled
                />
                <MessageSquare className="w-5 h-5 text-gray-600" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">SMS</div>
                  <div className="text-sm text-gray-600">Text message notifications (Pro only)</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || selectedLeadTimes.length === 0 || selectedChannels.length === 0}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Notifications'}
          </button>
        </div>
      </div>
    </div>
  )
}
