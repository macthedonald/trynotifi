'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/database/supabase'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { useRouter, useParams } from 'next/navigation'
import { Send, User, Loader2, CheckCircle2 } from 'lucide-react'
import { generateAIResponse, convertToGeminiHistory } from '@/lib/ai/gemini'
import { processAIResponseForActions } from '@/lib/scheduling/scheduler'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  reminderCreated?: boolean
  reminderId?: string
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  created_at: string
  updated_at: string
  user_id: string
}

export default function ConversationPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const conversationId = params.id as string
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [conversationTitle, setConversationTitle] = useState('New Conversation')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (user && conversationId) {
      loadConversation()
    }
  }, [user, conversationId])

  const loadConversation = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data: conversation, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error loading conversation:', error)
        router.push('/schedule')
        return
      }

      if (conversation) {
        setConversationTitle(conversation.title || 'New Conversation')
        const savedMessages = conversation.messages as Message[]
        if (savedMessages && savedMessages.length > 0) {
          setMessages(savedMessages)
        } else {
          // Initialize with welcome message
          setMessages([
            {
              id: '1',
              role: 'assistant',
              content: "Hi! I'm your AI scheduling assistant. I can help you create reminders, manage your calendar, and organize your tasks. How can I help you today?",
              timestamp: new Date()
            }
          ])
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error)
      router.push('/schedule')
    } finally {
      setLoading(false)
    }
  }

  const saveConversation = async (newMessages: Message[]) => {
    if (!user || !conversationId) return

    try {
      // Generate title from first user message if it's a new conversation
      const firstUserMessage = newMessages.find(m => m.role === 'user')?.content || ''
      const title = firstUserMessage.slice(0, 50) + (firstUserMessage.length > 50 ? '...' : '')

      // Update local state
      setConversationTitle(title || 'New Conversation')

      const { error } = await supabase
        .from('conversations')
        .update({
          messages: newMessages,
          title: title || 'New Conversation',
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)

      if (error) throw error
    } catch (error) {
      console.error('Error saving conversation:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping || !user) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInputMessage('')
    setIsTyping(true)

    try {
      // Convert conversation history to Gemini format
      const history = convertToGeminiHistory(messages)

      // Get AI response from Gemini
      const aiResponse = await generateAIResponse(userMessage.content, history)

      // Process the response for scheduling actions
      const actionResult = await processAIResponseForActions(user.id, aiResponse)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: actionResult.cleanedResponse,
        timestamp: new Date(),
        reminderCreated: actionResult.hasAction && actionResult.success,
        reminderId: actionResult.reminderId
      }

      const finalMessages = [...updatedMessages, assistantMessage]
      setMessages(finalMessages)
      await saveConversation(finalMessages)
    } catch (error) {
      console.error('Error getting AI response:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      }
      const finalMessages = [...updatedMessages, errorMessage]
      setMessages(finalMessages)
      await saveConversation(finalMessages)
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const startNewChat = () => {
    router.push('/schedule')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading conversation...</p>
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

        {/* Main Chat Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="bg-white/40 backdrop-blur-sm border-b border-white/20 px-4 lg:px-8 py-4 lg:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                  <User className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-lg lg:text-2xl font-bold text-gray-900">{conversationTitle}</h1>
                </div>
              </div>
              <button
                onClick={startNewChat}
                className="px-3 lg:px-4 py-2 bg-white/60 hover:bg-white/80 rounded-lg text-sm font-medium text-gray-700 transition-all shadow-sm hover:shadow-md"
              >
                New Chat
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 lg:gap-4 animate-fade-in-up ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-cyan-600'
                      : 'bg-gradient-to-br from-purple-600 to-pink-600'
                  }`}
                >
                  <User className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>

                {/* Message Bubble */}
                <div className={`flex-1 max-w-[85%] lg:max-w-[75%]`}>
                  <div
                    className={`rounded-2xl px-4 lg:px-5 py-3 lg:py-4 shadow-lg ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white'
                        : 'bg-white/80 backdrop-blur-sm text-gray-800'
                    }`}
                  >
                    <p className="text-sm lg:text-base leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>

                    {/* Reminder Created Badge */}
                    {message.reminderCreated && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-green-700 font-medium">Reminder Created</span>
                          </div>
                          <button
                            onClick={() => router.push('/dashboard')}
                            className="px-3 py-2 text-purple-600 hover:text-purple-700 font-medium hover:underline"
                          >
                            View in Dashboard
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className={`text-xs text-gray-500 mt-1 px-2 ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3 lg:gap-4 animate-fade-in-up">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <User className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-4 shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm text-gray-600 ml-2">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white/40 backdrop-blur-sm border-t border-white/20 px-4 lg:px-8 py-4 lg:py-6">
            <div className="max-w-4xl mx-auto">
              {/* Quick Actions */}
              <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                <button
                  onClick={() => setInputMessage('Create a reminder for tomorrow')}
                  className="px-3 py-1.5 bg-white/60 hover:bg-white/80 rounded-full text-xs lg:text-sm font-medium text-gray-700 transition-all whitespace-nowrap shadow-sm"
                >
                  📅 Create Reminder
                </button>
                <button
                  onClick={() => setInputMessage('Schedule a meeting next week')}
                  className="px-3 py-1.5 bg-white/60 hover:bg-white/80 rounded-full text-xs lg:text-sm font-medium text-gray-700 transition-all whitespace-nowrap shadow-sm"
                >
                  🤝 Schedule Meeting
                </button>
                <button
                  onClick={() => setInputMessage('Show my calendar for this week')}
                  className="px-3 py-1.5 bg-white/60 hover:bg-white/80 rounded-full text-xs lg:text-sm font-medium text-gray-700 transition-all whitespace-nowrap shadow-sm"
                >
                  📆 View Calendar
                </button>
              </div>

              {/* Input Box */}
              <div className="flex gap-2 lg:gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message... (e.g., 'Remind me to call John tomorrow at 2pm')"
                  className="flex-1 px-4 lg:px-6 py-3 lg:py-4 bg-white/80 backdrop-blur-sm rounded-xl lg:rounded-2xl border-2 border-white/40 focus:border-purple-600 focus:outline-none transition-all text-sm lg:text-base shadow-lg"
                  disabled={isTyping}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="px-4 lg:px-6 py-3 lg:py-4 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl lg:rounded-2xl font-medium transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isTyping ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span className="hidden lg:inline">Send</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
