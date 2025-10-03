'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { TrendingUp, Target, Calendar, Clock, Tag, Zap, CheckCircle2, AlertCircle } from 'lucide-react'

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
    }
  }, [user, authLoading, router])

  // Mock data - replace with actual Supabase queries
  const stats = {
    totalReminders: 156,
    completedReminders: user?.completed_reminders || 142,
    completionRate: 91,
    currentStreak: user?.streak_count || 12,
    longestStreak: 28,
    avgCompletionTime: '2.3 hours',
    mostProductiveDay: 'Tuesday',
    mostProductiveHour: '9 AM'
  }

  const weeklyData = [
    { day: 'Mon', completed: 8, created: 10 },
    { day: 'Tue', completed: 12, created: 13 },
    { day: 'Wed', completed: 7, created: 9 },
    { day: 'Thu', completed: 10, created: 11 },
    { day: 'Fri', completed: 9, created: 10 },
    { day: 'Sat', completed: 5, created: 6 },
    { day: 'Sun', completed: 4, created: 5 }
  ]

  const topTags = [
    { name: 'work', count: 45, color: 'bg-purple-500' },
    { name: 'personal', count: 32, color: 'bg-blue-500' },
    { name: 'health', count: 18, color: 'bg-green-500' },
    { name: 'family', count: 15, color: 'bg-pink-500' },
    { name: 'urgent', count: 12, color: 'bg-red-500' }
  ]

  const priorityBreakdown = [
    { priority: 'High', count: 34, percentage: 28, color: 'bg-red-500' },
    { priority: 'Medium', count: 67, percentage: 55, color: 'bg-blue-500' },
    { priority: 'Low', count: 21, percentage: 17, color: 'bg-green-500' }
  ]

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

  const maxCount = Math.max(...weeklyData.map(d => Math.max(d.completed, d.created)))

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
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  Analytics & Insights
                </h1>
                <p className="text-gray-600">Track your productivity and see your progress</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTimeRange('week')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    timeRange === 'week'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-white/60 text-gray-700 hover:bg-white/80'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setTimeRange('month')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    timeRange === 'month'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-white/60 text-gray-700 hover:bg-white/80'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setTimeRange('year')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    timeRange === 'year'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-white/60 text-gray-700 hover:bg-white/80'
                  }`}
                >
                  Year
                </button>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Completion Rate */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Completion Rate</h3>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stats.completionRate}%</div>
                <p className="text-sm text-gray-600">{stats.completedReminders} of {stats.totalReminders} completed</p>
              </div>

              {/* Current Streak */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Zap className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Current Streak</h3>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stats.currentStreak} days</div>
                <p className="text-sm text-gray-600">Longest: {stats.longestStreak} days</p>
              </div>

              {/* Avg Completion Time */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Avg Completion</h3>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stats.avgCompletionTime}</div>
                <p className="text-sm text-gray-600">Before due time</p>
              </div>

              {/* Most Productive */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Most Productive</h3>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stats.mostProductiveDay}</div>
                <p className="text-sm text-gray-600">at {stats.mostProductiveHour}</p>
              </div>
            </div>

            {/* Weekly Activity Chart */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 lg:p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Weekly Activity</h2>
              <div className="space-y-4">
                {weeklyData.map((day, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-700 w-12">{day.day}</span>
                      <div className="flex-1 flex gap-2 items-center">
                        {/* Created Bar */}
                        <div className="flex-1">
                          <div className="h-8 bg-gray-200 rounded-lg overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg transition-all"
                              style={{ width: `${(day.created / maxCount) * 100}%` }}
                            />
                          </div>
                        </div>
                        {/* Completed Bar */}
                        <div className="flex-1">
                          <div className="h-8 bg-gray-200 rounded-lg overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-lg transition-all"
                              style={{ width: `${(day.completed / maxCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-4 ml-4 w-24 text-sm">
                        <span className="text-purple-600 font-medium">{day.created}</span>
                        <span className="text-green-600 font-medium">{day.completed}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-purple-400 to-purple-600 rounded"></div>
                  <span className="text-sm text-gray-600">Created</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-green-600 rounded"></div>
                  <span className="text-sm text-gray-600">Completed</span>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Top Tags */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Tag className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Most Used Tags</h2>
                </div>
                <div className="space-y-4">
                  {topTags.map((tag, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-700">#{tag.name}</span>
                        <span className="text-sm text-gray-600">{tag.count} reminders</span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${tag.color} rounded-full transition-all`}
                          style={{ width: `${(tag.count / topTags[0].count) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority Breakdown */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Target className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Priority Breakdown</h2>
                </div>
                <div className="space-y-6">
                  {priorityBreakdown.map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-700">{item.priority} Priority</span>
                        <span className="text-sm text-gray-600">{item.count} ({item.percentage}%)</span>
                      </div>
                      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Donut Chart Visualization */}
                <div className="mt-8 flex items-center justify-center">
                  <div className="relative w-48 h-48">
                    <svg className="w-full h-full transform -rotate-90">
                      {priorityBreakdown.reduce((acc, item, index) => {
                        const start = acc.offset
                        const percentage = item.percentage
                        const dashArray = (percentage / 100) * 283 // Circumference of circle with r=45
                        acc.elements.push(
                          <circle
                            key={index}
                            cx="96"
                            cy="96"
                            r="45"
                            fill="none"
                            className={item.color.replace('bg-', 'stroke-')}
                            strokeWidth="20"
                            strokeDasharray={`${dashArray} 283`}
                            strokeDashoffset={-start}
                          />
                        )
                        acc.offset += dashArray
                        return acc
                      }, { offset: 0, elements: [] as React.ReactNode[] }).elements}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">{stats.totalReminders}</div>
                        <div className="text-sm text-gray-600">Total</div>
                      </div>
                    </div>
                  </div>
                </div>
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
