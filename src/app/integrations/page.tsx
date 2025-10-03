'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { Calendar, CheckCircle2, XCircle, RefreshCw, Settings, ExternalLink, Clock, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/database/supabase'
import { getGoogleAuthUrl } from '@/lib/calendar/google-calendar'
import { getMicrosoftAuthUrl } from '@/lib/calendar/microsoft-calendar'

interface CalendarConnection {
  id: string
  provider: 'google' | 'microsoft'
  calendar_name: string
  is_connected: boolean
  last_synced_at?: string
  sync_enabled: boolean
  sync_direction: 'import' | 'export' | 'both'
}

export default function IntegrationsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [connections, setConnections] = useState<CalendarConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Handle OAuth callback notifications
  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success === 'google_connected') {
      setNotification({ type: 'success', message: 'Google Calendar connected successfully!' })
    } else if (success === 'microsoft_connected') {
      setNotification({ type: 'success', message: 'Microsoft Calendar connected successfully!' })
    } else if (error) {
      const errorMessages: Record<string, string> = {
        oauth_cancelled: 'Calendar connection was cancelled',
        invalid_callback: 'Invalid callback parameters',
        connection_failed: 'Failed to connect calendar. Please try again.'
      }
      setNotification({ type: 'error', message: errorMessages[error] || 'An error occurred' })
    }

    // Clear notification after 5 seconds
    if (success || error) {
      setTimeout(() => setNotification(null), 5000)
      // Clear URL parameters
      router.replace('/integrations')
    }
  }, [searchParams, router])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
    }
  }, [user, authLoading, router])

  // Fetch calendar connections
  useEffect(() => {
    if (user) {
      fetchConnections()
    }
  }, [user])

  const fetchConnections = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('calendar_connections')
        .select('*')
        .eq('user_id', user?.id)

      if (error) throw error

      setConnections(data || [])
    } catch (error) {
      console.error('Error fetching connections:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectCalendar = async (provider: 'google' | 'microsoft') => {
    if (!user) return

    try {
      const authUrl = provider === 'google'
        ? getGoogleAuthUrl(user.id)
        : getMicrosoftAuthUrl(user.id)

      window.location.href = authUrl
    } catch (error) {
      console.error('Error initiating OAuth:', error)
      setNotification({ type: 'error', message: 'Failed to start calendar connection' })
    }
  }

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect this calendar? Your imported events will be removed.')) {
      return
    }

    try {
      // Delete connection (cascades to events and event_reminders)
      const { error } = await supabase
        .from('calendar_connections')
        .delete()
        .eq('id', connectionId)

      if (error) throw error

      setNotification({ type: 'success', message: 'Calendar disconnected successfully' })
      await fetchConnections()
    } catch (error) {
      console.error('Error disconnecting calendar:', error)
      setNotification({ type: 'error', message: 'Failed to disconnect calendar' })
    }
  }

  const handleSync = async (connectionId: string) => {
    setSyncing(connectionId)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sync-calendar-events`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) throw new Error('Sync failed')

      setNotification({ type: 'success', message: 'Calendar synced successfully!' })
      await fetchConnections()
    } catch (error) {
      console.error('Sync error:', error)
      setNotification({ type: 'error', message: 'Failed to sync calendar' })
    } finally {
      setSyncing(null)
    }
  }

  const handleToggleSyncDirection = async (connectionId: string, direction: 'import' | 'export' | 'both') => {
    try {
      const { error } = await supabase
        .from('calendar_connections')
        .update({ sync_direction: direction })
        .eq('id', connectionId)

      if (error) throw error

      await fetchConnections()
    } catch (error) {
      console.error('Error updating sync direction:', error)
      setNotification({ type: 'error', message: 'Failed to update settings' })
    }
  }

  // Check if user has connections for each provider
  const googleConnection = connections.find(c => c.provider === 'google')
  const microsoftConnection = connections.find(c => c.provider === 'microsoft')

  if (authLoading || loading) {
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
        {/* Sidebar */}
        <div className={`hidden lg:block lg:relative lg:z-auto transition-all duration-300 ease-in-out p-6 ${
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
        }`}>
          <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24 lg:pb-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Calendar Integrations
              </h1>
              <p className="text-gray-600">Connect your calendars to see all your events in one place</p>
            </div>

            {/* Notification Banner */}
            {notification && (
              <div className={`mb-8 p-4 rounded-2xl border-2 flex items-center gap-3 ${
                notification.type === 'success'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                {notification.type === 'success' ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
                <span className={notification.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                  {notification.message}
                </span>
              </div>
            )}

            {/* Info Banner */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-8 flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-blue-900 mb-2">How Calendar Sync Works</h3>
                <p className="text-blue-800 text-sm leading-relaxed">
                  Connect your Google or Microsoft calendars to automatically import events. You can set extra reminders for any imported event,
                  and optionally enable two-way sync to create Notifi reminders as calendar events.
                </p>
              </div>
            </div>

            {/* Calendar Connections */}
            <div className="space-y-6 mb-8">
              {/* Google Calendar */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-red-500 to-yellow-500">
                      <Calendar className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Google Calendar</h2>
                      {googleConnection && (
                        <p className="text-gray-600 text-sm">{googleConnection.calendar_name}</p>
                      )}
                    </div>
                  </div>

                  {googleConnection ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                      <span className="text-green-600 font-medium">Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <XCircle className="w-6 h-6 text-gray-400" />
                      <span className="text-gray-600 font-medium">Not Connected</span>
                    </div>
                  )}
                </div>

                {googleConnection ? (
                  <>
                    {/* Last Sync Info */}
                    {googleConnection.last_synced_at && (
                      <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-xl mb-6">
                        <Clock className="w-5 h-5 text-gray-600" />
                        <span className="text-sm text-gray-600">
                          Last synced: <strong>{new Date(googleConnection.last_synced_at).toLocaleString()}</strong>
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleSync(googleConnection.id)}
                        disabled={syncing === googleConnection.id}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        <RefreshCw className={`w-5 h-5 ${syncing === googleConnection.id ? 'animate-spin' : ''}`} />
                        {syncing === googleConnection.id ? 'Syncing...' : 'Sync Now'}
                      </button>
                      <button
                        onClick={() => handleDisconnect(googleConnection.id)}
                        className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                      >
                        Disconnect
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-6">
                      Connect your Google calendar to import events and set reminders
                    </p>
                    <button
                      onClick={() => handleConnectCalendar('google')}
                      className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all inline-flex items-center gap-2"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Connect Google Calendar
                    </button>
                  </div>
                )}
              </div>

              {/* Microsoft Calendar */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500">
                      <Calendar className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Microsoft Calendar</h2>
                      {microsoftConnection && (
                        <p className="text-gray-600 text-sm">{microsoftConnection.calendar_name}</p>
                      )}
                    </div>
                  </div>

                  {microsoftConnection ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                      <span className="text-green-600 font-medium">Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <XCircle className="w-6 h-6 text-gray-400" />
                      <span className="text-gray-600 font-medium">Not Connected</span>
                    </div>
                  )}
                </div>

                {microsoftConnection ? (
                  <>
                    {/* Last Sync Info */}
                    {microsoftConnection.last_synced_at && (
                      <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-xl mb-6">
                        <Clock className="w-5 h-5 text-gray-600" />
                        <span className="text-sm text-gray-600">
                          Last synced: <strong>{new Date(microsoftConnection.last_synced_at).toLocaleString()}</strong>
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleSync(microsoftConnection.id)}
                        disabled={syncing === microsoftConnection.id}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        <RefreshCw className={`w-5 h-5 ${syncing === microsoftConnection.id ? 'animate-spin' : ''}`} />
                        {syncing === microsoftConnection.id ? 'Syncing...' : 'Sync Now'}
                      </button>
                      <button
                        onClick={() => handleDisconnect(microsoftConnection.id)}
                        className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                      >
                        Disconnect
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-6">
                      Connect your Microsoft calendar to import events and set reminders
                    </p>
                    <button
                      onClick={() => handleConnectCalendar('microsoft')}
                      className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all inline-flex items-center gap-2"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Connect Microsoft Calendar
                    </button>
                    {user?.plan === 'free' && googleConnection && (
                      <p className="text-sm text-gray-500 mt-4">
                        Free plan includes 1 calendar connection.
                        <a href="/pricing" className="text-purple-600 hover:underline ml-1">Upgrade to Pro</a> for unlimited connections.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sync Settings */}
            {(googleConnection || microsoftConnection) && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 lg:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Sync Settings</h2>
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all cursor-pointer">
                    <div>
                      <div className="font-medium text-gray-900">Auto-sync</div>
                      <div className="text-sm text-gray-600">Automatically sync calendars daily</div>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500" />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all cursor-pointer">
                    <div>
                      <div className="font-medium text-gray-900">Two-way sync</div>
                      <div className="text-sm text-gray-600">Export Notifi reminders to your calendar (Pro only)</div>
                    </div>
                    <input
                      type="checkbox"
                      disabled={user?.plan === 'free'}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 disabled:opacity-50"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
