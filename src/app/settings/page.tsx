'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { supabase } from '@/lib/database/supabase'
import { Button } from '@/components/ui/Button'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { useRouter } from 'next/navigation'
import {
  Settings as SettingsIcon,
  Bell,
  Lock,
  Palette,
  Globe,
  Smartphone,
  Mail,
  MessageSquare,
  Calendar,
  Shield,
  Trash2,
  Key,
  CreditCard,
  Download,
  AlertCircle,
  Sun,
  Moon,
  Monitor
} from 'lucide-react'

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<'notifications' | 'account' | 'privacy' | 'appearance'>('notifications')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [reminderSound, setReminderSound] = useState(true)
  const [dailyDigest, setDailyDigest] = useState(false)

  // Account settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [autoSyncCalendar, setAutoSyncCalendar] = useState(true)

  // Appearance settings
  const [compactMode, setCompactMode] = useState(false)

  // Privacy settings
  const [shareActivity, setShareActivity] = useState(false)
  const [allowAnalytics, setAllowAnalytics] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
    }
  }, [user, authLoading, router])

  const handleSaveSettings = async () => {
    setIsSaving(true)
    setSaveSuccess(false)

    try {
      // Save settings to database
      const settings = {
        notifications: {
          email: emailNotifications,
          sms: smsNotifications,
          push: pushNotifications,
          sound: reminderSound,
          dailyDigest: dailyDigest
        },
        account: {
          twoFactor: twoFactorEnabled,
          autoSync: autoSyncCalendar
        },
        appearance: {
          theme: theme,
          compactMode: compactMode
        },
        privacy: {
          shareActivity: shareActivity,
          allowAnalytics: allowAnalytics
        }
      }

      // You can save to a settings table or user preferences column
      const { error } = await supabase
        .from('users')
        .update({ settings: settings })
        .eq('id', user?.id)

      if (error) throw error

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return
    if (!confirm('This will permanently delete all your data, reminders, and conversations. Are you absolutely sure?')) return

    try {
      // Delete user account
      const { error } = await supabase.rpc('delete_user_account')
      if (error) throw error

      // Sign out and redirect
      window.location.href = '/'
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Failed to delete account. Please contact support.')
    }
  }

  const handleExportData = async () => {
    try {
      // Export user data
      const { data: reminders } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user?.id)

      const { data: conversations } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user?.id)

      const exportData = {
        user: user,
        reminders: reminders,
        conversations: conversations,
        exportedAt: new Date().toISOString()
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `notifi-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting data:', error)
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

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
    { id: 'account', label: 'Account', icon: <Lock className="w-5 h-5" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-5 h-5" /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield className="w-5 h-5" /> }
  ]

  return (
    <div className="min-h-screen bg-white transition-colors duration-300">
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
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <SettingsIcon className="w-8 h-8 lg:w-10 lg:h-10" />
                Settings
              </h1>
              <p className="text-gray-600 your account preferences and app settings</p>
            </div>

            {saveSuccess && (
              <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-xl text-green-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Settings saved successfully!
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-black text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-gray-50 rounded-2xl p-6 lg:p-8 border border-gray-200 shadow-xl">
              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Notification Preferences</h2>
                    <p className="text-gray-600 mb-6">Choose how you want to receive reminders and updates</p>
                  </div>

                  <div className="space-y-4">
                    <SettingToggle
                      icon={<Mail className="w-5 h-5 text-blue-600" />}
                      title="Email Notifications"
                      description="Receive reminder notifications via email"
                      checked={emailNotifications}
                      onChange={setEmailNotifications}
                    />
                    <SettingToggle
                      icon={<MessageSquare className="w-5 h-5 text-green-600" />}
                      title="SMS Notifications"
                      description="Receive text message alerts for important reminders"
                      checked={smsNotifications}
                      onChange={setSmsNotifications}
                      badge="Pro"
                    />
                    <SettingToggle
                      icon={<Smartphone className="w-5 h-5 text-purple-600" />}
                      title="Push Notifications"
                      description="Browser push notifications for real-time alerts"
                      checked={pushNotifications}
                      onChange={setPushNotifications}
                    />
                    <SettingToggle
                      icon={<Bell className="w-5 h-5 text-orange-600" />}
                      title="Reminder Sound"
                      description="Play sound when notifications arrive"
                      checked={reminderSound}
                      onChange={setReminderSound}
                    />
                    <SettingToggle
                      icon={<Calendar className="w-5 h-5 text-pink-600" />}
                      title="Daily Digest"
                      description="Receive a summary of your day every morning"
                      checked={dailyDigest}
                      onChange={setDailyDigest}
                    />
                  </div>
                </div>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Account Settings</h2>
                    <p className="text-gray-600 mb-6">Manage your account security and integrations</p>
                  </div>

                  <div className="space-y-4">
                    <SettingToggle
                      icon={<Key className="w-5 h-5 text-red-600" />}
                      title="Two-Factor Authentication"
                      description="Add an extra layer of security to your account"
                      checked={twoFactorEnabled}
                      onChange={setTwoFactorEnabled}
                      badge="Recommended"
                    />
                    <SettingToggle
                      icon={<Calendar className="w-5 h-5 text-blue-600" />}
                      title="Auto-Sync Calendar"
                      description="Automatically sync with Google/Outlook calendar"
                      checked={autoSyncCalendar}
                      onChange={setAutoSyncCalendar}
                    />
                  </div>

                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
                    <div className="space-y-3">
                      <button
                        onClick={handleExportData}
                        className="w-full flex items-center justify-between p-4 bg-white/60 hover:bg-white/80 rounded-xl transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <Download className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="font-semibold text-gray-900">Export Your Data</div>
                            <div className="text-sm text-gray-600">Download all your data in JSON format</div>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={handleDeleteAccount}
                        className="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-all text-left border-2 border-red-200"
                      >
                        <div className="flex items-center gap-3">
                          <Trash2 className="w-5 h-5 text-red-600" />
                          <div>
                            <div className="font-semibold text-red-900">Delete Account</div>
                            <div className="text-sm text-red-600">Permanently delete your account and all data</div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Appearance Settings</h2>
                    <p className="text-gray-600 mb-6">Customize how Notifi looks and feels</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Theme</label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => setTheme('light')}
                          className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                            theme === 'light'
                              ? 'border-black bg-gray-100
                              : 'border-gray-200 bg-white/40 hover:border-gray-400
                          }`}
                        >
                          <Sun className="w-6 h-6" />
                          <div className="font-semibold text-gray-900
                        </button>
                        <button
                          onClick={() => setTheme('dark')}
                          className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                            theme === 'dark'
                              ? 'border-black bg-gray-100
                              : 'border-gray-200 bg-white/40 hover:border-gray-400
                          }`}
                        >
                          <Moon className="w-6 h-6" />
                          <div className="font-semibold text-gray-900
                        </button>
                        <button
                          onClick={() => setTheme('auto')}
                          className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                            theme === 'auto'
                              ? 'border-black bg-gray-100
                              : 'border-gray-200 bg-white/40 hover:border-gray-400
                          }`}
                        >
                          <Monitor className="w-6 h-6" />
                          <div className="font-semibold text-gray-900
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {theme === 'auto' && 'Theme will match your system preferences'}
                        {theme === 'light' && 'Always use light theme'}
                        {theme === 'dark' && 'Always use dark theme'}
                      </p>
                    </div>

                    <SettingToggle
                      icon={<Palette className="w-5 h-5 text-gray-700 />}
                      title="Compact Mode"
                      description="Reduce spacing and make UI more compact"
                      checked={compactMode}
                      onChange={setCompactMode}
                    />
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Privacy Settings</h2>
                    <p className="text-gray-600 mb-6">Control your privacy and data sharing preferences</p>
                  </div>

                  <div className="space-y-4">
                    <SettingToggle
                      icon={<Globe className="w-5 h-5 text-blue-600" />}
                      title="Share Activity Status"
                      description="Let team members see when you're active"
                      checked={shareActivity}
                      onChange={setShareActivity}
                    />
                    <SettingToggle
                      icon={<Shield className="w-5 h-5 text-green-600" />}
                      title="Usage Analytics"
                      description="Help improve Notifi by sharing anonymous usage data"
                      checked={allowAnalytics}
                      onChange={setAllowAnalytics}
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-900">
                        <div className="font-semibold mb-1">Your Privacy Matters</div>
                        <p className="text-blue-700">We take your privacy seriously. Read our <a href="#" className="underline">Privacy Policy</a> to learn more about how we protect your data.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="flex gap-3 pt-6 border-t border-gray-200 mt-8">
                <Button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="flex-1 lg:flex-none"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Reset to defaults or reload from DB
                    window.location.reload()
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
      <div className="lg:hidden h-20"></div>
    </div>
  )
}

// Reusable Setting Toggle Component
function SettingToggle({
  icon,
  title,
  description,
  checked,
  onChange,
  badge
}: {
  icon: React.ReactNode
  title: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
  badge?: string
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/60 rounded-xl hover:bg-white/80 transition-all">
      <div className="flex items-start gap-3 flex-1">
        <div className="mt-1">{icon}</div>
        <div className="flex-1">
          <div className="font-semibold text-gray-900 flex items-center gap-2">
            {title}
            {badge && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                {badge}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600 mt-0.5">{description}</div>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer ml-4">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
      </label>
    </div>
  )
}
