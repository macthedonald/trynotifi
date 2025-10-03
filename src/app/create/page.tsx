'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useReminders } from '@/hooks/useReminders'
import { ReminderForm } from '@/components/reminders/ReminderForm'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { useRouter } from 'next/navigation'

export default function CreatePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { addReminder } = useReminders()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
    }
  }, [user, authLoading, router])

  const handleCreateReminder = async (data: any) => {
    setIsLoading(true)
    try {
      await addReminder(data)
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to create reminder:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white/30 backdrop-blur-sm p-4 border-b border-white/20">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="text-gray-800 font-semibold">Create Reminder</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="hidden lg:block mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create New Reminder
            </h1>
            <p className="text-gray-600">Set up a new reminder to stay organized and on track.</p>
          </div>

          <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-6 lg:p-8">
            <ReminderForm
              onSubmit={handleCreateReminder}
              onCancel={handleCancel}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Mobile spacing for bottom nav */}
      <div className="lg:hidden h-20"></div>
    </div>
  )
}