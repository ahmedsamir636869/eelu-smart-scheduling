'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { scheduleApi } from '@/lib/api'

const DAYS = ['SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'] as const
const TIME_SLOTS = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
  '04:00 PM', '05:00 PM',
] as const

interface Session {
  id: string
  name: string
  type: 'LECTURE' | 'SECTION'
  day?: string
  startTime?: string
  courseId: string
  instructorId?: string
  classroomId?: string
  course?: { code: string; name: string }
  instructor?: { name: string }
  classroom?: { name: string }
}

interface Schedule {
  id: string
  semester: string
  sessions?: Session[]
}

function getSessionHour(timeStr?: string): number | null {
  if (!timeStr) return null
  try {
    const date = new Date(timeStr)
    return date.getUTCHours()
  } catch {
    return null
  }
}

function getTimeSlotIndex(hour: number): number {
  return hour - 8 // 8AM = index 0
}

function getDayIndex(day?: string): number {
  if (!day) return -1
  return DAYS.indexOf(day as any)
}

// Color palette for sessions
const LECTURE_COLORS = [
  'bg-amber-900/40 border-amber-700/50 text-amber-200',
  'bg-teal-900/40 border-teal-700/50 text-teal-200',
  'bg-indigo-900/40 border-indigo-700/50 text-indigo-200',
  'bg-rose-900/40 border-rose-700/50 text-rose-200',
]

const SECTION_COLORS = [
  'bg-purple-900/40 border-purple-700/50 text-purple-200',
  'bg-emerald-900/40 border-emerald-700/50 text-emerald-200',
  'bg-cyan-900/40 border-cyan-700/50 text-cyan-200',
]

export default function DoctorPublishedViewPage() {
  const params = useParams()
  const id = params.id as string
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) fetchSchedule()
  }, [id])

  const fetchSchedule = async () => {
    try {
      setLoading(true)
      const data = await scheduleApi.getById(id)
      setSchedule(data)
    } catch (err) {
      console.error('Error fetching schedule:', err)
    } finally {
      setLoading(false)
    }
  }

  const getSessionAt = (dayIndex: number, timeIndex: number): Session | undefined => {
    if (!schedule?.sessions) return undefined
    return schedule.sessions.find((s) => {
      const sDayIndex = getDayIndex(s.day)
      const sHour = getSessionHour(s.startTime)
      if (sHour === null) return false
      const sTimeIndex = getTimeSlotIndex(sHour)
      return sDayIndex === dayIndex && sTimeIndex === timeIndex
    })
  }

  const getSessionColor = (session: Session, index: number): string => {
    if (session.type === 'SECTION') {
      return SECTION_COLORS[index % SECTION_COLORS.length]
    }
    return LECTURE_COLORS[index % LECTURE_COLORS.length]
  }

  return (
    <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
      <MainLayout title="Published Schedules">
        {/* Back Link */}
        <Link
          href="/doctor/published"
          className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Published
        </Link>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading schedule...</div>
        ) : !schedule ? (
          <div className="text-center py-12 text-gray-400">Schedule not found.</div>
        ) : (
          <>
            {/* Schedule Title */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-200">
                {schedule.semester || 'Schedule'}
              </h2>
              <p className="text-yellow-400/80 text-sm mt-1 flex items-center gap-1.5">
                <span>💡</span>
                You can drag and drop Lectures to move and edit around the table.
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mb-4 justify-end">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500/60" />
                <span className="text-gray-400 text-xs">Sections</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <span className="text-gray-400 text-xs">Lectures</span>
              </div>
            </div>

            {/* Timetable Grid */}
            <div className="overflow-x-auto rounded-xl border border-gray-700/50">
              <table className="w-full border-collapse min-w-[900px]">
                <thead>
                  <tr>
                    <th className="bg-gray-800/80 border border-gray-700/40 px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-20 text-left">
                      Time
                    </th>
                    {DAYS.map((day) => (
                      <th
                        key={day}
                        className="bg-gray-800/80 border border-gray-700/40 px-3 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider text-center"
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((time, timeIndex) => (
                    <tr key={time}>
                      <td className="bg-gray-900/40 border border-gray-700/40 px-3 py-2 text-xs text-gray-400 font-medium whitespace-nowrap">
                        {time}
                      </td>
                      {DAYS.map((_, dayIndex) => {
                        const session = getSessionAt(dayIndex, timeIndex)
                        return (
                          <td
                            key={dayIndex}
                            className="border border-gray-700/40 p-1.5 h-[72px] align-top"
                          >
                            {session ? (
                              <div
                                className={`h-full rounded-lg border p-2 text-xs ${getSessionColor(
                                  session,
                                  timeIndex + dayIndex
                                )} cursor-pointer hover:opacity-90 transition-opacity`}
                              >
                                <div className="flex items-start justify-between mb-0.5">
                                  <span className="font-semibold truncate">
                                    {session.course?.code || session.name}
                                  </span>
                                  <span className="text-[10px] opacity-70 ml-1 shrink-0">
                                    {session.classroom?.name || ''}
                                  </span>
                                </div>
                                <p className="opacity-80 truncate text-[11px]">
                                  {session.course?.name || session.name}
                                </p>
                                {session.instructor?.name && (
                                  <p className="opacity-60 truncate text-[10px] mt-0.5 flex items-center gap-1">
                                    <span>👤</span>
                                    {session.instructor.name}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="h-full rounded-lg bg-gray-800/30 border border-gray-700/20" />
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </MainLayout>
    </ProtectedRoute>
  )
}
