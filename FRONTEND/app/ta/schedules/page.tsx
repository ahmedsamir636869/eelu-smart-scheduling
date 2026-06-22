'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Eye, AlertTriangle, FileText } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { scheduleApi } from '@/lib/api'

interface PublishedSchedule {
  id: string
  semester: string
  generatedBy: string
  createdAt: string
}

export default function TASchedulesPage() {
  const [schedules, setSchedules] = useState<PublishedSchedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const data = await scheduleApi.getAll().catch(() => [])
      setSchedules(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching schedules:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const getFileName = (schedule: PublishedSchedule) => {
    return `${schedule.semester?.replace(/\s+/g, '_') || 'Schedule'}_${formatDate(schedule.createdAt).replace(/\//g, '-')}.pdf`
  }

  return (
    <ProtectedRoute allowedRoles={['TA']}>
      <MainLayout title="Schedules">
        {/* Schedule List */}
        <div className="space-y-4 mt-2">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading schedules...</div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No published schedules available.</p>
            </div>
          ) : (
            schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between bg-gray-800/60 border border-gray-700/50 rounded-xl p-5 hover:border-gray-600/50 transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-900/30 border border-teal-700/30 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{getFileName(schedule)}</p>
                    <p className="text-gray-400 text-sm mt-0.5">
                      Submitted by {schedule.generatedBy || 'Unknown'} | Date: {formatDate(schedule.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/ta/schedules/${schedule.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600/20 text-teal-400 border border-teal-600/30 hover:bg-teal-600/30 font-medium text-xs transition-all duration-200"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Details
                  </Link>
                  <Link
                    href={`/ta/issues?scheduleId=${schedule.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 font-medium text-xs transition-all duration-200"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Report Issue
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}
