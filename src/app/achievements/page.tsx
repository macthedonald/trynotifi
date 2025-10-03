'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { Trophy, Lock, CheckCircle2, Zap, Calendar, Users, Star, Target, Crown } from 'lucide-react'

interface Achievement {
  id: string
  name: string
  description: string
  icon: React.ElementType
  requirement: string
  progress: number
  total: number
  unlocked: boolean
  unlockedDate?: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export default function AchievementsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
    }
  }, [user, authLoading, router])

  // Mock achievements data - replace with actual Supabase queries
  const achievements: Achievement[] = [
    {
      id: '1',
      name: 'First Step',
      description: 'Create your very first reminder',
      icon: Star,
      requirement: 'Create 1 reminder',
      progress: 1,
      total: 1,
      unlocked: true,
      unlockedDate: '2025-01-01',
      rarity: 'common'
    },
    {
      id: '2',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: Zap,
      requirement: 'Complete reminders for 7 consecutive days',
      progress: user?.streak_count || 0,
      total: 7,
      unlocked: (user?.streak_count || 0) >= 7,
      unlockedDate: (user?.streak_count || 0) >= 7 ? '2025-01-15' : undefined,
      rarity: 'rare'
    },
    {
      id: '3',
      name: 'Month Master',
      description: 'Maintain a 30-day streak',
      icon: Calendar,
      requirement: 'Complete reminders for 30 consecutive days',
      progress: user?.streak_count || 0,
      total: 30,
      unlocked: false,
      rarity: 'epic'
    },
    {
      id: '4',
      name: 'Century Club',
      description: 'Complete 100 reminders',
      icon: Trophy,
      requirement: 'Mark 100 reminders as complete',
      progress: user?.completed_reminders || 0,
      total: 100,
      unlocked: (user?.completed_reminders || 0) >= 100,
      unlockedDate: (user?.completed_reminders || 0) >= 100 ? '2025-01-20' : undefined,
      rarity: 'epic'
    },
    {
      id: '5',
      name: 'Early Bird',
      description: 'Complete a reminder before 8am',
      icon: CheckCircle2,
      requirement: 'Complete any reminder before 8:00 AM',
      progress: 0,
      total: 1,
      unlocked: false,
      rarity: 'common'
    },
    {
      id: '6',
      name: 'Night Owl',
      description: 'Complete a reminder after 10pm',
      icon: CheckCircle2,
      requirement: 'Complete any reminder after 10:00 PM',
      progress: 1,
      total: 1,
      unlocked: true,
      unlockedDate: '2025-01-10',
      rarity: 'common'
    },
    {
      id: '7',
      name: 'Calendar Pro',
      description: 'Connect 2 or more calendars',
      icon: Calendar,
      requirement: 'Connect Google and Outlook calendars',
      progress: 0,
      total: 2,
      unlocked: false,
      rarity: 'rare'
    },
    {
      id: '8',
      name: 'Power User',
      description: 'Create 50+ reminders',
      icon: Target,
      requirement: 'Create a total of 50 reminders',
      progress: 32,
      total: 50,
      unlocked: false,
      rarity: 'rare'
    },
    {
      id: '9',
      name: 'Team Player',
      description: 'Share a reminder with someone',
      icon: Users,
      requirement: 'Share any reminder with another user',
      progress: 0,
      total: 1,
      unlocked: false,
      rarity: 'common'
    },
    {
      id: '10',
      name: 'Legendary Streak',
      description: 'The ultimate achievement',
      icon: Crown,
      requirement: 'Maintain a 365-day streak',
      progress: user?.streak_count || 0,
      total: 365,
      unlocked: false,
      rarity: 'legendary'
    }
  ]

  const rarityColors = {
    common: { bg: 'from-gray-400 to-gray-500', border: 'border-gray-400', text: 'text-gray-600' },
    rare: { bg: 'from-blue-400 to-blue-600', border: 'border-blue-400', text: 'text-blue-600' },
    epic: { bg: 'from-purple-400 to-purple-600', border: 'border-purple-400', text: 'text-purple-600' },
    legendary: { bg: 'from-yellow-400 to-orange-600', border: 'border-yellow-400', text: 'text-yellow-600' }
  }

  const filteredAchievements = achievements.filter(achievement => {
    if (filter === 'unlocked') return achievement.unlocked
    if (filter === 'locked') return !achievement.unlocked
    return true
  })

  const unlockedCount = achievements.filter(a => a.unlocked).length
  const totalCount = achievements.length
  const completionPercentage = Math.round((unlockedCount / totalCount) * 100)

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
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Achievements
              </h1>
              <p className="text-gray-600">Unlock badges and celebrate your productivity milestones</p>
            </div>

            {/* Progress Overview */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 lg:p-8 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Your Progress</h2>
                  <p className="text-gray-600">{unlockedCount} of {totalCount} achievements unlocked</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {completionPercentage}%
                  </div>
                  <p className="text-sm text-gray-600">Complete</p>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl">
                  <div className="text-2xl font-bold text-gray-900">{achievements.filter(a => a.unlocked && a.rarity === 'common').length}</div>
                  <div className="text-sm text-gray-600">Common</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-white rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">{achievements.filter(a => a.unlocked && a.rarity === 'rare').length}</div>
                  <div className="text-sm text-gray-600">Rare</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-white rounded-xl">
                  <div className="text-2xl font-bold text-purple-600">{achievements.filter(a => a.unlocked && a.rarity === 'epic').length}</div>
                  <div className="text-sm text-gray-600">Epic</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-white rounded-xl">
                  <div className="text-2xl font-bold text-yellow-600">{achievements.filter(a => a.unlocked && a.rarity === 'legendary').length}</div>
                  <div className="text-sm text-gray-600">Legendary</div>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white/60 text-gray-700 hover:bg-white/80'
                }`}
              >
                All ({totalCount})
              </button>
              <button
                onClick={() => setFilter('unlocked')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === 'unlocked'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white/60 text-gray-700 hover:bg-white/80'
                }`}
              >
                Unlocked ({unlockedCount})
              </button>
              <button
                onClick={() => setFilter('locked')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === 'locked'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white/60 text-gray-700 hover:bg-white/80'
                }`}
              >
                Locked ({totalCount - unlockedCount})
              </button>
            </div>

            {/* Achievements Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAchievements.map((achievement) => {
                const Icon = achievement.icon
                const colors = rarityColors[achievement.rarity]
                const progressPercentage = (achievement.progress / achievement.total) * 100

                return (
                  <div
                    key={achievement.id}
                    className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 transition-all hover:scale-105 border-2 ${
                      achievement.unlocked ? colors.border : 'border-gray-200'
                    } ${achievement.unlocked ? '' : 'opacity-75'}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-4 rounded-2xl ${
                        achievement.unlocked
                          ? `bg-gradient-to-r ${colors.bg}`
                          : 'bg-gray-200'
                      } relative`}>
                        {achievement.unlocked ? (
                          <Icon className="w-8 h-8 text-white" />
                        ) : (
                          <Lock className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        achievement.unlocked ? colors.text : 'text-gray-500'
                      } bg-white capitalize`}>
                        {achievement.rarity}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">{achievement.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{achievement.description}</p>

                    {achievement.unlocked ? (
                      <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Unlocked on {new Date(achievement.unlockedDate!).toLocaleDateString()}
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                          <span>{achievement.requirement}</span>
                          <span className="font-medium">{achievement.progress}/{achievement.total}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${colors.bg} rounded-full transition-all`}
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
