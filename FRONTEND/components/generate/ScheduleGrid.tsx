'use client'

import { useMemo } from 'react'
import { Clock, MapPin, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ScheduleSession {
  id: string
  courseCode: string
  courseName: string
  instructor: string
  location: string
  day: string
  startTime: string // HH:MM format
  endTime: string   // HH:MM format
  type: 'lecture' | 'lab'
  year?: number // Year/Level (1, 2, 3, 4, etc.)
  studentCount?: number
  roomCapacity?: number
  group?: string
}

interface ScheduleGridProps {
  sessions: ScheduleSession[]
}

// Time slots from 8:00 to 17:00
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00'
]

const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']

export function ScheduleGrid({ sessions }: ScheduleGridProps) {
  // Organize sessions by day and time slot
  const organizedSessions = useMemo(() => {
    const grid: Record<string, Record<string, ScheduleSession[]>> = {}

    // Initialize grid
    DAYS.forEach(day => {
      grid[day] = {}
      TIME_SLOTS.forEach(slot => {
        grid[day][slot] = []
      })
    })

    // Place each session in its correct slot
    sessions.forEach(session => {
      const day = session.day
      const startTime = session.startTime

      // Find the time slot this session belongs to
      // Session belongs to slot if it starts at that time
      if (grid[day] && grid[day][startTime]) {
        grid[day][startTime].push(session)
      }
    })

    return grid
  }, [sessions])

  return (
    <div className="w-full overflow-auto">
      <div className="min-w-[1000px] inline-block">
        {/* Header with time slots */}
        <div className="sticky top-0 z-20 bg-gray-900 border-b-2 border-gray-700">
          <div className="grid" style={{ gridTemplateColumns: '140px repeat(9, 1fr)' }}>
            {/* Empty corner */}
            <div className="p-4 border-r border-gray-700 flex items-center justify-center sticky left-0 z-30 bg-gray-900">
              <Clock className="w-5 h-5 text-gray-400" />
            </div>

            {/* Time slot headers */}
            {TIME_SLOTS.map((slot, idx) => {
              const endHour = String(parseInt(slot.split(':')[0]) + 1).padStart(2, '0')
              const endTime = `${endHour}:00`

              return (
                <div
                  key={slot}
                  className="p-3 border-r border-gray-700 text-center bg-gray-900"
                >
                  <div className="text-teal-400 font-bold text-sm">
                    {slot}
                  </div>
                  <div className="text-gray-500 text-xs mt-1">
                    {endTime}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Day rows */}
        <div className="bg-gray-800">
          {DAYS.map((day, dayIdx) => (
            <div
              key={day}
              className="grid border-b border-gray-700 last:border-b-0"
              style={{ gridTemplateColumns: '140px repeat(9, 1fr)' }}
            >
              {/* Day label */}
              <div
                className={cn(
                  'p-4 border-r border-gray-700 flex items-center justify-center sticky left-0 z-10 font-semibold text-white',
                  dayIdx % 2 === 0 ? 'bg-gray-800' : 'bg-gray-850'
                )}
              >
                {day}
              </div>

              {/* Time slots for this day */}
              {TIME_SLOTS.map((slot, slotIdx) => {
                const sessionsInSlot = organizedSessions[day]?.[slot] || []

                return (
                  <div
                    key={`${day}-${slot}`}
                    className={cn(
                      'min-h-[140px] p-2 border-r border-gray-700 last:border-r-0',
                      dayIdx % 2 === 0 ? 'bg-gray-800' : 'bg-gray-850'
                    )}
                    style={{
                      minHeight: sessionsInSlot.length > 0
                        ? `${Math.max(140, sessionsInSlot.length * 150)}px`
                        : '140px'
                    }}
                  >
                    <div className="flex flex-col gap-2">
                      {sessionsInSlot.map((session) => (
                        <SessionCard key={session.id} session={session} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Color mapping based on year/level
const getYearColors = (year?: number, type: 'lecture' | 'lab' = 'lecture') => {
  // Default colors if year is not available or is 0
  if (!year || year === 0) {
    return type === 'lecture'
      ? { bg: 'bg-blue-600/30', border: 'border-blue-500', text: 'text-blue-300', badge: 'bg-blue-500/30 text-blue-300' }
      : { bg: 'bg-purple-600/30', border: 'border-purple-500', text: 'text-purple-300', badge: 'bg-purple-500/30 text-purple-300' }
  }

  // Year-based color schemes
  const yearColors: Record<number, { lecture: any, lab: any }> = {
    1: {
      lecture: { bg: 'bg-green-600/30', border: 'border-green-500', text: 'text-green-300', badge: 'bg-green-500/30 text-green-300' },
      lab: { bg: 'bg-emerald-600/30', border: 'border-emerald-500', text: 'text-emerald-300', badge: 'bg-emerald-500/30 text-emerald-300' }
    },
    2: {
      lecture: { bg: 'bg-blue-600/30', border: 'border-blue-500', text: 'text-blue-300', badge: 'bg-blue-500/30 text-blue-300' },
      lab: { bg: 'bg-cyan-600/30', border: 'border-cyan-500', text: 'text-cyan-300', badge: 'bg-cyan-500/30 text-cyan-300' }
    },
    3: {
      lecture: { bg: 'bg-purple-600/30', border: 'border-purple-500', text: 'text-purple-300', badge: 'bg-purple-500/30 text-purple-300' },
      lab: { bg: 'bg-violet-600/30', border: 'border-violet-500', text: 'text-violet-300', badge: 'bg-violet-500/30 text-violet-300' }
    },
    4: {
      lecture: { bg: 'bg-orange-600/30', border: 'border-orange-500', text: 'text-orange-300', badge: 'bg-orange-500/30 text-orange-300' },
      lab: { bg: 'bg-amber-600/30', border: 'border-amber-500', text: 'text-amber-300', badge: 'bg-amber-500/30 text-amber-300' }
    },
    5: {
      lecture: { bg: 'bg-red-600/30', border: 'border-red-500', text: 'text-red-300', badge: 'bg-red-500/30 text-red-300' },
      lab: { bg: 'bg-rose-600/30', border: 'border-rose-500', text: 'text-rose-300', badge: 'bg-rose-500/30 text-rose-300' }
    }
  }

  // Default to year 1 if year is out of range
  const yearKey = year >= 1 && year <= 5 ? year : 1
  return yearColors[yearKey][type]
}

function SessionCard({ session }: { session: ScheduleSession }) {
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('SessionCard - session:', {
      id: session.id,
      courseCode: session.courseCode,
      year: session.year,
      type: session.type
    })
  }

  const colors = getYearColors(session.year, session.type)

  // Debug logging for colors
  if (process.env.NODE_ENV === 'development') {
    console.log('SessionCard - colors:', colors, 'for year:', session.year)
  }

  return (
    <div
      className={cn(
        'rounded-lg p-3 border-2 transition-all hover:scale-[1.02]',
        colors.bg,
        colors.border
      )}
    >
      <div className="space-y-2">
        {/* Course code */}
        <div className={cn('font-bold text-sm', colors.text)}>
          {session.courseCode}
        </div>

        {/* Course name */}
        <div className="text-white text-sm font-medium line-clamp-2">
          {session.courseName}
        </div>

        {/* Instructor */}
        <div className="flex items-center gap-1 text-gray-300 text-xs">
          <User className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{session.instructor}</span>
        </div>

        {/* Location and Capacity */}
        {/* Location and Capacity */}
        <div className="flex flex-col gap-1 text-gray-300 text-xs">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{session.location}</span>
          </div>
          {session.roomCapacity !== undefined && (
            <div className="flex items-center gap-1 text-gray-400 ml-1">
              <span className="truncate">
                Capacity: {session.roomCapacity}
              </span>
            </div>
          )}
          {session.studentCount !== undefined && (
            <div className="flex items-center gap-1 text-gray-400 ml-1">
              <span className="truncate">
                Students: {session.studentCount}
              </span>
            </div>
          )}
        </div>

        {/* Group Info */}
        {session.group && (
          <div className="flex items-center gap-1 text-gray-300 text-xs">
            <span className="font-semibold text-gray-400">Group:</span>
            <span className="truncate">{session.group}</span>
          </div>
        )}

        {/* Time */}
        <div className="text-gray-400 text-xs font-medium mt-1">
          {session.startTime} - {session.endTime}
        </div>

        {/* Type and Year badges */}
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {/* Always show year if it exists */}
          {(session.year !== undefined && session.year !== null) && (
            <span
              className={cn(
                'px-2 py-1 rounded text-xs font-medium',
                colors.badge
              )}
            >
              Year {session.year}
            </span>
          )}
          <span
            className={cn(
              'px-2 py-1 rounded text-xs font-medium',
              colors.badge
            )}
          >
            {session.type === 'lecture' ? 'Lecture' : 'Lab'}
          </span>
        </div>
      </div>
    </div>
  )
}

