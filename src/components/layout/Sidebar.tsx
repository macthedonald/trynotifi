'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home as HomeIcon, User as UserIcon, History as HistoryIcon, MessageSquare, CalendarDays, Settings as SettingsIcon, HelpCircle, LogOut, BarChart3, Trophy, Link2, CreditCard } from 'lucide-react'

interface SidebarProps {
  className?: string
  onClose?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export const Sidebar = ({ className = '', onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) => {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    try {
      await signOut()
      // Use window.location for hard redirect to ensure clean state
      window.location.href = '/auth/signin'
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  const navigationItems = [
    {
      label: 'Home',
      href: '/dashboard',
      icon: (<HomeIcon className="w-5 h-5" />)
    },
    {
      label: 'My Profile',
      href: '/profile',
      icon: (<UserIcon className="w-5 h-5" />)
    },
    {
      label: 'Schedule',
      href: '/schedule',
      icon: (<CalendarDays className="w-5 h-5" />)
    },
    {
      label: 'History',
      href: '/history',
      icon: (<HistoryIcon className="w-5 h-5" />)
    },
    {
      label: 'Analytics',
      href: '/analytics',
      icon: (<BarChart3 className="w-5 h-5" />)
    },
    {
      label: 'Achievements',
      href: '/achievements',
      icon: (<Trophy className="w-5 h-5" />)
    },
    {
      label: 'Integrations',
      href: '/integrations',
      icon: (<Link2 className="w-5 h-5" />)
    }
  ]

  const bottomItems = [
    {
      label: 'Billing',
      href: '/billing',
      icon: (<CreditCard className="w-5 h-5" />)
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: (<SettingsIcon className="w-5 h-5" />)
    },
    {
      label: 'Help',
      href: '/help',
      icon: (<HelpCircle className="w-5 h-5" />)
    }
  ]

  return (
    <div className={`bg-gray-100 border border-gray-200 rounded-2xl h-full flex flex-col transition-all duration-300 ease-in-out hover:shadow-xl animate-slide-in-left ${
      isCollapsed ? 'p-2 lg:p-3' : 'p-4 lg:p-6'
    } ${className}`}>
      {/* Mobile close button */}
      {onClose && (
        <div className="lg:hidden flex justify-end mb-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {/* Logo */}
      <div className="mb-8 lg:mb-12 transition-all duration-300">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2'}`}>
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className={`text-gray-900 font-semibold transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
            Notifi
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-md group ${
                    isCollapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-3 lg:px-4 py-3'
                  } ${
                    isActive
                      ? 'bg-black text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-200
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className={`transition-all duration-300 group-hover:scale-110 ${
                    isActive ? 'text-white : 'text-gray-500
                  }`}>
                    {item.icon}
                  </span>
                  <span className={`transition-all duration-300 ${
                    isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                  }`}>
                    {item.label}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <div className="mt-8 pt-6 border-t border-gray-200
        <ul className="space-y-2">
          {bottomItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onClose}
                className={`flex items-center rounded-xl text-sm font-medium text-gray-700 transition-all duration-300 transform hover:scale-105 hover:bg-gray-200 hover:shadow-md group ${
                  isCollapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-3 lg:px-4 py-3'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="text-gray-500 transition-all duration-300 group-hover:scale-110">{item.icon}</span>
                <span className={`transition-all duration-300 ${
                  isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                }`}>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Logout */}
        <button
          onClick={() => {
            handleSignOut()
            onClose?.()
          }}
          className={`w-full flex items-center rounded-xl text-sm font-medium text-gray-700 transition-all duration-300 transform hover:scale-105 hover:bg-gray-200 hover:text-red-600 hover:shadow-md group mt-2 ${
            isCollapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-3 lg:px-4 py-3'
          }`}
          title={isCollapsed ? 'Log out' : undefined}
        >
          <LogOut className="w-5 h-5 text-gray-500 transition-all duration-300 group-hover:scale-110 group-hover:text-red-500 />
          <span className={`transition-all duration-300 ${
            isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
          }`}>Log out</span>
        </button>

        {/* Collapse Toggle Button - Only on desktop */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={`hidden lg:flex items-center justify-center mt-4 py-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 hover:shadow-md group ${
              isCollapsed ? 'px-2' : 'px-3'
            }`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className={`w-5 h-5 transition-all duration-300 group-hover:scale-110 ${
                isCollapsed ? 'rotate-180' : ''
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className={`ml-2 text-sm transition-all duration-300 ${
              isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
            }`}>
              Collapse
            </span>
          </button>
        )}
      </div>
    </div>
  )
}