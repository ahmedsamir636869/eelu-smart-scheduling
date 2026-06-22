'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Eye, Trash2, FileText } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { scheduleApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface PublishedSchedule {
  id: string
  semester: string
  generatedBy: string
  createdAt: string
}

export default function DoctorPublishedPage() {
  const { user } = useAuth()
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
    <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
      <MainLayout title="Published">
        {/* Back Link */}
        <Link
          href="/doctor"
          className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit to Overview
        </Link>

        {/* Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Published Schedules</h2>
          <p className="text-gray-400 text-sm mt-1">View your uploaded schedules.</p>
        </div>

        {/* Schedule List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading schedules...</div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No published schedules yet.</p>
            </div>
          ) : (
            schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between bg-gray-800/60 border border-gray-700/50 rounded-xl p-5 hover:border-teal-700/30 transition-all duration-200"
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
                    href={`/doctor/published/${schedule.id}`}
                    className="p-2.5 rounded-lg bg-gray-700/50 text-gray-300 hover:bg-teal-600/20 hover:text-teal-400 border border-gray-600/30 hover:border-teal-600/30 transition-all duration-200"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    className="p-2.5 rounded-lg bg-gray-700/50 text-gray-300 hover:bg-blue-600/20 hover:text-blue-400 border border-gray-600/30 hover:border-blue-600/30 transition-all duration-200"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2.5 rounded-lg bg-gray-700/50 text-gray-300 hover:bg-red-600/20 hover:text-red-400 border border-gray-600/30 hover:border-red-600/30 transition-all duration-200"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}
