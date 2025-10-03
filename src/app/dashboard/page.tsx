'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useReminders, useUpcomingReminders, useOverdueReminders } from '@/hooks/useReminders'
import { ReminderForm } from '@/components/reminders/ReminderForm'
import { ReminderList } from '@/components/reminders/ReminderList'
import { useDashboardItems, DashboardFilter } from '@/hooks/useDashboardItems'
import { ReminderCard } from '@/components/dashboard/ReminderCard'
import { EventCard } from '@/components/dashboard/EventCard'
import { EventNotificationModal } from '@/components/modals/EventNotificationModal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Sidebar } from '@/components/layout/Sidebar'
import { CalendarWidget } from '@/components/calendar/CalendarWidget'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<DashboardFilter>('all')
  // Mobile header removed; rely on MobileBottomNav for mobile navigation
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  // Function to get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  // Function to get first name from email or user data
  const getFirstName = () => {
    if (user?.email) {
      // Extract name from email (e.g., "john.doe@example.com" -> "John")
      const emailName = user.email.split('@')[0].split('.')[0]
      return emailName.charAt(0).toUpperCase() + emailName.slice(1)
    }
    return 'there'
  }

  const {
    reminders: allReminders,
    loading: allLoading,
    addReminder,
    editReminder,
    removeReminder,
    markCompleted,
    search,
    refetch: refetchAll,
  } = useReminders()

  const {
    reminders: upcomingReminders,
    loading: upcomingLoading,
    refetch: refetchUpcoming,
  } = useUpcomingReminders(10)

  const {
    reminders: overdueReminders,
    loading: overdueLoading,
    refetch: refetchOverdue,
  } = useOverdueReminders()

  const [filteredReminders, setFilteredReminders] = useState(allReminders)
  const [searchLoading, setSearchLoading] = useState(false)

  // Unified dashboard items for selected date with filter
  const { items: dashboardItems, loading: dashboardLoading, reload: reloadDashboard } = useDashboardItems({
    selectedDate,
    filter: activeFilter
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (searchQuery.trim()) {
      const performSearch = async () => {
        setSearchLoading(true)
        try {
          const results = await search(searchQuery)
          setFilteredReminders(results)
        } catch (error) {
          console.error('Search failed:', error)
        } finally {
          setSearchLoading(false)
        }
      }
      performSearch()
    } else {
      setFilteredReminders(allReminders)
    }
  }, [searchQuery, allReminders, search])

  const handleCreateReminder = async (data: any) => {
    await addReminder(data)
    setShowCreateForm(false)
    refetchAll()
    refetchUpcoming()
    refetchOverdue()
  }

  const handleEditReminder = async (id: string, updates: any) => {
    await editReminder(id, updates)
    refetchAll()
    refetchUpcoming()
    refetchOverdue()
  }

  const handleDeleteReminder = async (id: string) => {
    await removeReminder(id)
    refetchAll()
    refetchUpcoming()
    refetchOverdue()
  }

  const handleCompleteReminder = async (id: string) => {
    await markCompleted(id)
    refetchAll()
    refetchUpcoming()
    refetchOverdue()
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      // Use window.location for hard redirect to ensure clean state
      window.location.href = '/auth/signin'
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  const getHeaderCounts = () => {
    // For header subtitle we use unified dashboard count on selected date
    if (dashboardLoading) return { loading: true, count: 0, overdue: overdueReminders.length }
    return { loading: false, count: dashboardItems.length, overdue: overdueReminders.length }
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
    <div className="min-h-screen bg-white transition-colors duration-300">
      <div className="flex h-screen flex-col lg:flex-row">
        {/* Sidebar - Hidden on mobile; use MobileBottomNav for mobile navigation */}
        <div className={`hidden lg:block lg:relative lg:z-auto transition-all duration-300 ease-in-out p-6 lg:p-6 ${
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
        }`}>
          <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden flex-col xl:flex-row">
          {/* Work Content Area */}
          <div className="flex-1 p-4 lg:p-6 lg:pr-0 transition-all duration-300">
            <div className="h-full bg-gray-50 rounded-2xl p-4 lg:p-8 transition-all duration-300 border border-gray-200
              {/* Header with Dynamic Greeting */}
              <div className="mb-6 lg:mb-8 animate-fade-in-up">
                <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-2">
                  {getGreeting()}, {getFirstName()}!
                </h1>
                <p className="text-sm lg:text-base text-gray-600
                  {(() => {
                    const { loading, count, overdue } = getHeaderCounts()
                    if (loading) return 'Loading your schedule...'
                    if (overdue > 0) return (
                      <span className="text-orange-600 font-medium">{overdue} overdue item{overdue !== 1 ? 's' : ''} need{overdue === 1 ? 's' : ''} your attention</span>
                    )
                    if (count > 0) return `You have ${count} item${count !== 1 ? 's' : ''} today`
                    return 'All clear for today! Enjoy your free time'
                  })()}
                </p>
              </div>

              {/* Date Header */}
              <div className="mb-6 lg:mb-8 animate-slide-in-right">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg lg:text-xl font-semibold text-gray-800
                    {selectedDate.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const prevDay = new Date(selectedDate)
                        prevDay.setDate(prevDay.getDate() - 1)
                        setSelectedDate(prevDay)
                      }}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      aria-label="Previous day"
                    >
                      <svg className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600 fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setSelectedDate(new Date())}
                      className="px-3 py-1 text-xs lg:text-sm hover:bg-gray-200 rounded-lg transition-colors font-medium text-gray-600 hover:text-gray-800
                      aria-label="Go to today"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => {
                        const nextDay = new Date(selectedDate)
                        nextDay.setDate(nextDay.getDate() + 1)
                        setSelectedDate(nextDay)
                      }}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      aria-label="Next day"
                    >
                      <svg className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600 fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Filter chips */}
                <div className="flex items-center gap-2 mt-4 lg:mt-6 flex-wrap">
                  {([
                    { key: 'all' as const, label: 'All' },
                    { key: 'reminders' as const, label: 'Reminders Only' },
                    { key: 'events' as const, label: 'Events Only' },
                    { key: 'with-notifications' as const, label: 'With Notifications' },
                  ]).map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setActiveFilter(opt.key)}
                      className={`px-3 py-1.5 rounded-full text-xs lg:text-sm transition-all duration-300 border ${
                        activeFilter === opt.key
                          ? 'bg-black border-transparent text-white shadow-lg font-medium'
                          : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Unified Timeline Items */}
              <div className="space-y-3 lg:space-y-4 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                {dashboardLoading ? (
                  <div className="flex flex-col gap-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white rounded-2xl shadow-lg p-4 lg:p-6 animate-pulse border border-gray-200
                        <div className="flex items-start gap-4">
                          <div className="w-6 h-6 bg-gray-200 rounded-full" />
                          <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                          <div className="flex-1 space-y-3">
                            <div className="h-5 bg-gray-200 rounded w-3/4" />
                            <div className="h-4 bg-gray-200 rounded w-1/2" />
                          </div>
                          <div className="h-4 bg-gray-200 rounded w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : dashboardItems.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200
                    <div className="text-6xl mb-4">📅</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {activeFilter === 'all' && 'No items for this day'}
                      {activeFilter === 'reminders' && 'No reminders for this day'}
                      {activeFilter === 'events' && 'No calendar events for this day'}
                      {activeFilter === 'with-notifications' && 'No items with notifications'}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {activeFilter === 'all' && "You're all caught up! Enjoy your free time"}
                      {activeFilter === 'reminders' && "Create a reminder to get started"}
                      {activeFilter === 'events' && "Connect your calendar to see events"}
                      {activeFilter === 'with-notifications' && "Set notifications on your reminders or events"}
                    </p>
                    {activeFilter !== 'events' && (
                      <button
                        onClick={() => setShowCreateForm(true)}
                        className="px-6 py-3 bg-black text-white rounded-xl font-medium hover:shadow-lg transition-all"
                      >
                        + Add Reminder
                      </button>
                    )}
                  </div>
                ) : (
                  dashboardItems.map(item => (
                    item.type === 'reminder' ? (
                      <ReminderCard
                        key={`reminder-${item.id}`}
                        reminder={item}
                        onUpdate={() => {
                          reloadDashboard()
                          refetchAll()
                          refetchUpcoming()
                          refetchOverdue()
                        }}
                      />
                    ) : (
                      <EventCard
                        key={`event-${item.id}`}
                        event={item}
                        onSetNotifications={(eventId) => {
                          setSelectedEventId(eventId)
                          setShowNotificationModal(true)
                        }}
                      />
                    )
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Calendar Widget - Hidden on mobile, shown on large screens */}
          <div className="hidden xl:flex w-96 px-8 py-6">
            <CalendarWidget
              className="flex-1"
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Mobile spacing for bottom nav */}
      <div className="lg:hidden h-20"></div>

      {/* Event Notification Modal */}
      {showNotificationModal && selectedEventId && (() => {
        const selectedEvent = dashboardItems.find(item => item.id === selectedEventId && item.type === 'event')
        if (!selectedEvent || selectedEvent.type !== 'event') return null

        return (
          <EventNotificationModal
            isOpen={showNotificationModal}
            onClose={() => {
              setShowNotificationModal(false)
              setSelectedEventId(null)
            }}
            eventId={selectedEventId}
            eventTitle={selectedEvent.title}
            eventDateTime={selectedEvent.datetime}
            onSave={() => {
              setShowNotificationModal(false)
              setSelectedEventId(null)
              reloadDashboard()
            }}
          />
        )
      })()}
    </div>
  )
}