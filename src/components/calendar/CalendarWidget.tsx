'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns'

interface CalendarWidgetProps {
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  className?: string
}

export const CalendarWidget = ({
  selectedDate = new Date(),
  onDateSelect,
  className = ''
}: CalendarWidgetProps) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [today, setToday] = useState(new Date())

  // Update today's date every minute to keep it current
  useEffect(() => {
    const updateToday = () => {
      setToday(new Date())
    }

    // Update immediately
    updateToday()

    // Update every minute
    const interval = setInterval(updateToday, 60000)

    return () => clearInterval(interval)
  }, [])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const handleDateClick = (date: Date) => {
    onDateSelect?.(date)
  }

  // Add padding days for proper grid layout
  const startPadding = monthStart.getDay()
  const paddingDays = Array.from({ length: startPadding }, (_, i) => {
    const paddingDate = new Date(monthStart)
    paddingDate.setDate(paddingDate.getDate() - (startPadding - i))
    return paddingDate
  })

  const endPadding = 6 - monthEnd.getDay()
  const endPaddingDays = Array.from({ length: endPadding }, (_, i) => {
    const paddingDate = new Date(monthEnd)
    paddingDate.setDate(paddingDate.getDate() + (i + 1))
    return paddingDate
  })

  const allDays = [...paddingDays, ...monthDays, ...endPaddingDays]

  return (
    <div className={`bg-white/10 backdrop-blur-sm rounded-2xl p-6 transition-all duration-300 hover:bg-white/20 hover:shadow-xl hover:scale-[1.02] group ${className}`}>
      {/* Calendar Header with 3D Calendar Icon */}
      <div className="flex items-center justify-center mb-12">
        <div className="relative">
          <div className="w-64 h-64 bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl shadow-2xl transform rotate-12 flex items-center justify-center transition-all duration-500 group-hover:rotate-6 group-hover:shadow-3xl group-hover:scale-105">
            <div className="bg-white rounded-2xl p-6 transform -rotate-12 transition-all duration-500 group-hover:-rotate-6">
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600 mb-2 transition-colors duration-300 group-hover:text-purple-700">{format(today, 'MMMM')}</div>
                <div className="text-6xl font-bold text-gray-800 transition-colors duration-300 group-hover:text-gray-900">{format(today, 'd')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Month Navigation Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={goToPreviousMonth}
          className="p-3 hover:bg-white/20 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-110"
        >
          <svg className="w-6 h-6 text-gray-600 transition-colors duration-300 hover:text-gray-800" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800 transition-all duration-300 group-hover:text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
        </div>

        <button
          onClick={goToNextMonth}
          className="p-3 hover:bg-white/20 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-110"
        >
          <svg className="w-6 h-6 text-gray-600 transition-colors duration-300 hover:text-gray-800" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-base font-semibold text-gray-500 py-3 transition-colors duration-300 group-hover:text-gray-600">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {allDays.map((date, index) => {
          const isCurrentMonth = isSameMonth(date, currentDate)
          const isTodayDate = isToday(date)
          const isSelected = selectedDate && isSameDay(date, selectedDate)

          return (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              className={`
                relative w-14 h-14 text-base rounded-xl transition-all duration-300 hover:bg-white/30 hover:shadow-lg hover:scale-110 flex items-center justify-center font-semibold transform hover:rotate-1
                ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-700 hover:text-gray-900'}
                ${isTodayDate ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold shadow-lg hover:shadow-xl hover:from-purple-600 hover:to-pink-600' : ''}
                ${isSelected && !isTodayDate ? 'bg-white/30 text-gray-900 font-bold shadow-md' : ''}
              `}
              disabled={!isCurrentMonth}
            >
              {format(date, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}