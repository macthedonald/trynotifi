'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/database/supabase'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { useRouter } from 'next/navigation'
import { MessageSquare, Trash2, Clock, Search, Bot, Calendar as CalendarIcon } from 'lucide-react'
import { Input } from '@/components/ui/Input'

interface Conversation {
  id: string
  title: string
  messages: any[]
  created_at: string
  updated_at: string
  user_id: string
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user])

  const loadConversations = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setConversations(data || [])
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteConversation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id)

      if (error) throw error

      setConversations(conversations.filter(c => c.id !== id))
      if (selectedConversation?.id === id) {
        setSelectedConversation(null)
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }

  const openConversation = (conversation: Conversation) => {
    // Navigate to schedule page and load this conversation
    router.push(`/schedule?conversation=${conversation.id}`)
  }

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groupConversationsByDate = (conversations: Conversation[]) => {
    const groups: { [key: string]: Conversation[] } = {
      today: [],
      yesterday: [],
      thisWeek: [],
      thisMonth: [],
      older: []
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const thisWeek = new Date(today)
    thisWeek.setDate(thisWeek.getDate() - 7)
    const thisMonth = new Date(today)
    thisMonth.setMonth(thisMonth.getMonth() - 1)

    conversations.forEach(conv => {
      const convDate = new Date(conv.updated_at)
      if (convDate >= today) {
        groups.today.push(conv)
      } else if (convDate >= yesterday) {
        groups.yesterday.push(conv)
      } else if (convDate >= thisWeek) {
        groups.thisWeek.push(conv)
      } else if (convDate >= thisMonth) {
        groups.thisMonth.push(conv)
      } else {
        groups.older.push(conv)
      }
    })

    return groups
  }

  const groupedConversations = groupConversationsByDate(filteredConversations)

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

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Conversation History</h1>
              <p className="text-gray-600">View and manage your previous chats with the AI assistant</p>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 bg-white/60 backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl p-4 lg:p-6 border border-white/40 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-600">Total Chats</span>
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-gray-900">{conversations.length}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl p-4 lg:p-6 border border-white/40 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">This Week</span>
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {groupedConversations.today.length + groupedConversations.yesterday.length + groupedConversations.thisWeek.length}
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-2xl p-4 lg:p-6 border border-white/40 shadow-lg col-span-2 lg:col-span-1">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">Active Today</span>
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-gray-900">{groupedConversations.today.length}</div>
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading conversations...</p>
                </div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  <MessageSquare className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No conversations yet</h3>
                <p className="text-gray-600 mb-6">Start chatting with the AI assistant to see your conversation history here</p>
                <button
                  onClick={() => router.push('/schedule')}
                  className="px-6 py-3 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  Start New Chat
                </button>
              </div>
            ) : (
              <>
                {/* Grouped Conversations */}
                {Object.entries(groupedConversations).map(([group, convs]) => {
                  if (convs.length === 0) return null

                  const groupLabels: { [key: string]: string } = {
                    today: 'Today',
                    yesterday: 'Yesterday',
                    thisWeek: 'This Week',
                    thisMonth: 'This Month',
                    older: 'Older'
                  }

                  return (
                    <div key={group} className="mb-8">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-purple-600" />
                        {groupLabels[group]}
                      </h2>
                      <div className="grid gap-4">
                        {convs.map((conversation) => (
                          <div
                            key={conversation.id}
                            className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-white/40 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group"
                            onClick={() => openConversation(conversation)}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-md">
                                    <Bot className="w-6 h-6 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="text-base lg:text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-1">
                                      {conversation.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 flex items-center gap-2">
                                      <Clock className="w-4 h-4" />
                                      {new Date(conversation.updated_at).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2 ml-13">
                                  {conversation.messages?.length || 0} messages
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteConversation(conversation.id)
                                }}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete conversation"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
      <div className="lg:hidden h-20"></div>
    </div>
  )
}
