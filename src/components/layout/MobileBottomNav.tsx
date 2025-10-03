'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

interface MobileBottomNavProps {
  className?: string
}

export const MobileBottomNav = ({ className = '' }: MobileBottomNavProps) => {
  const pathname = usePathname()
  const { user } = useAuth()

  if (!user) return null

  const navigationItems = [
    {
      label: 'Today',
      href: '/dashboard',
      icon: (isActive: boolean) => (
        <svg className={`w-6 h-6 ${isActive ? 'text-purple-600' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      )
    },
    {
      label: 'Schedule',
      href: '/dashboard/schedule',
      icon: (isActive: boolean) => (
        <svg className={`w-6 h-6 ${isActive ? 'text-purple-600' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
          <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
        </svg>
      )
    },
    {
      label: 'Create',
      href: '/create',
      icon: (isActive: boolean) => (
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isActive ? 'bg-purple-600' : 'bg-purple-500'} shadow-lg`}>
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
      ),
      isFloating: true
    },
    {
      label: 'History',
      href: '/dashboard/history',
      icon: (isActive: boolean) => (
        <svg className={`w-6 h-6 ${isActive ? 'text-purple-600' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      label: 'Profile',
      href: '/dashboard/profile',
      icon: (isActive: boolean) => (
        <svg className={`w-6 h-6 ${isActive ? 'text-purple-600' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      )
    }
  ]

  return (
    <div className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-50 transition-all duration-300 hover:bg-white/98 hover:shadow-2xl ${className}`}>
      <div className="flex items-center justify-around py-2 px-4 relative">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href

          if (item.isFloating) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="absolute left-1/2 transform -translate-x-1/2 -translate-y-6 z-10 transition-all duration-300 hover:scale-110 hover:-translate-y-7"
              >
                {item.icon(isActive)}
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-300 transform hover:scale-110 hover:shadow-md ${
                isActive ? 'bg-purple-50 scale-105 shadow-sm' : 'hover:bg-gray-50'
              }`}
            >
              {item.icon(isActive)}
              <span className={`text-xs mt-1 ${isActive ? 'text-purple-600 font-medium' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}