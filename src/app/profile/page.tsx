'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/database/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { useRouter } from 'next/navigation'
import { User, Mail, Clock, Award, Zap, Calendar, Bell, Shield, CreditCard } from 'lucide-react'

export default function ProfilePage() {
  const { user, loading: authLoading, refreshUser } = useAuth()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [timezone, setTimezone] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      const nameParts = user.full_name?.split(' ') || []
      setFirstName(nameParts[0] || '')
      setLastName(nameParts.slice(1).join(' ') || '')
      setTimezone(user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
    }
  }, [user])

  const handleSave = async () => {
    if (!user) return
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      const fullName = `${firstName} ${lastName}`.trim()
      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName, timezone })
        .eq('id', user.id)
      if (error) throw error
      await refreshUser()
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (user) {
      const nameParts = user.full_name?.split(' ') || []
      setFirstName(nameParts[0] || '')
      setLastName(nameParts.slice(1).join(' ') || '')
      setTimezone(user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const stats = [
    {
      label: 'Current Plan',
      value: user.plan?.toUpperCase() || 'FREE',
      icon: <CreditCard className="w-5 h-5 text-purple-600" />,
      bgColor: 'from-purple-100 to-purple-50'
    },
    {
      label: 'Active Streak',
      value: `${user.streak_count || 0} days`,
      icon: <Zap className="w-5 h-5 text-orange-600" />,
      bgColor: 'from-orange-100 to-orange-50'
    },
    {
      label: 'Completed Tasks',
      value: user.total_completed_reminders || 0,
      icon: <Award className="w-5 h-5 text-green-600" />,
      bgColor: 'from-green-100 to-green-50'
    },
    {
      label: 'Member Since',
      value: new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      icon: <Calendar className="w-5 h-5 text-blue-600" />,
      bgColor: 'from-blue-100 to-blue-50'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 transition-all duration-300">
      <div className="flex h-screen flex-col lg:flex-row">
        {/* Sidebar - Hidden on mobile */}
        <div className={`hidden lg:block lg:relative lg:z-auto transition-all duration-300 ease-in-out p-6 lg:p-6 ${
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
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
              <p className="text-gray-600">Manage your account settings and preferences</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className={`bg-gradient-to-br ${stat.bgColor} rounded-2xl p-4 lg:p-6 border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {stat.icon}
                    <span className="text-xs lg:text-sm font-medium text-gray-600">{stat.label}</span>
                  </div>
                  <div className="text-xl lg:text-2xl font-bold text-gray-900">{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Profile Information Card */}
            <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-white/20 shadow-xl mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                  <User className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
                </div>
                <div>
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                    {user.full_name || 'Complete your profile'}
                  </h2>
                  <p className="text-gray-600 flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </p>
                </div>
              </div>

              {saveSuccess && (
                <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-800 text-sm">
                  ✓ Profile updated successfully!
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      First Name
                    </label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter first name"
                      className="bg-white/60"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Name
                    </label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter last name"
                      className="bg-white/60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <Input
                    value={user.email}
                    disabled
                    className="bg-gray-100 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white/60 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Asia/Shanghai">Shanghai (CST)</option>
                    <option value="Australia/Sydney">Sydney (AEST)</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 lg:flex-none"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={isSaving}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>

            {/* Preferences Card */}
            <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-white/20 shadow-xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/40 rounded-xl">
                  <div>
                    <div className="font-semibold text-gray-900">Email Notifications</div>
                    <div className="text-sm text-gray-600">Receive email reminders</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/40 rounded-xl">
                  <div>
                    <div className="font-semibold text-gray-900">SMS Notifications</div>
                    <div className="text-sm text-gray-600">Receive text message alerts</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/40 rounded-xl">
                  <div>
                    <div className="font-semibold text-gray-900">Push Notifications</div>
                    <div className="text-sm text-gray-600">Browser push notifications</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
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
