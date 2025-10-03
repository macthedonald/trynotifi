'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/database/supabase'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { useRouter } from 'next/navigation'
import { ScheduleChatStarter } from '@/components/ui/schedule-chat-starter'

export default function SchedulePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
    }
  }, [user, authLoading, router])

  const handleStartConversation = async (firstMessage: string) => {
    if (!user) return

    try {
      // Create a new conversation with the first message
      const initialMessages = [
        {
          id: '1',
          role: 'assistant' as const,
          content: "Hi! I'm your AI scheduling assistant. I can help you create reminders, manage your calendar, and organize your tasks. How can I help you today?",
          timestamp: new Date()
        },
        {
          id: '2',
          role: 'user' as const,
          content: firstMessage,
          timestamp: new Date()
        }
      ]

      // Generate title from first message
      const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '')

      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: title,
          messages: initialMessages
        })
        .select()
        .single()

      if (error) throw error

      // Redirect to the new conversation
      if (newConversation) {
        router.push(`/schedule/${newConversation.id}`)
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
      <div className="flex h-screen flex-col lg:flex-row">
        {/* Sidebar - Hidden on mobile */}
        <div className={`hidden lg:block lg:relative lg:z-auto transition-all duration-300 ease-in-out p-6 ${
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
        }`}>
          <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Main Content - Chat Starter */}
        <div className="flex-1 flex items-center justify-center overflow-y-auto">
          <ScheduleChatStarter onSubmit={handleStartConversation} />
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
