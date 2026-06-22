'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Eye, Plus } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { instructorAvailabilityApi, scheduleApi } from '@/lib/api'

export default function DoctorDashboardPage() {
  const { user } = useAuth()
  const [submittedDays, setSubmittedDays] = useState(0)
  const [totalPublished, setTotalPublished] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDoctorStats()
  }, [])

  const fetchDoctorStats = async () => {
    try {
      setLoading(true)
      const availability = await instructorAvailabilityApi.getMyAvailability().catch(() => [])
      setSubmittedDays(Array.isArray(availability) ? availability.length : 0)

      const schedules = await scheduleApi.getAll().catch(() => [])
      setTotalPublished(Array.isArray(schedules) ? schedules.length : 0)
    } catch (err) {
      console.error('Error fetching doctor stats:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
      <MainLayout title="Dashboard" subtitle={`Welcome, Dr. ${user?.name || 'User'}`}>
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-black text-white tracking-tight">
            Doctor Control Center
          </h2>
          <p className="text-gray-400 text-sm mt-1">Manage, Edit and Upload.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Hero Card */}
          <div className="flex-1">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-900/80 via-teal-800/60 to-gray-900/80 border border-teal-700/30 p-8 min-h-[280px]">
              {/* Calendar Illustration */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 lg:opacity-30">
                <svg width="180" height="160" viewBox="0 0 180 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="10" y="20" width="160" height="130" rx="12" stroke="currentColor" strokeWidth="2" className="text-teal-300" />
                  <line x1="10" y1="55" x2="170" y2="55" stroke="currentColor" strokeWidth="2" className="text-teal-300" />
                  <rect x="40" y="10" width="3" height="20" rx="1.5" fill="currentColor" className="text-teal-300" />
                  <rect x="137" y="10" width="3" height="20" rx="1.5" fill="currentColor" className="text-teal-300" />
                  {[0, 1, 2, 3].map((row) =>
                    [0, 1, 2, 3].map((col) => (
                      <circle
                        key={`${row}-${col}`}
                        cx={45 + col * 35}
                        cy={80 + row * 25}
                        r="6"
                        fill="currentColor"
                        className="text-teal-400/40"
                      />
                    ))
                  )}
                </svg>
              </div>

              <div className="relative z-10">
                <h3 className="text-2xl lg:text-3xl font-bold text-white mb-2 leading-tight max-w-md">
                  Plan your Lectures for this semester.
                </h3>
                <p className="text-gray-300/80 text-sm mt-3 max-w-sm leading-relaxed">
                  Access the Lectures Days to define your availability or review existing published schedules.
                </p>

                <div className="flex flex-wrap gap-3 mt-8">
                  <Link
                    href="/doctor/lecture-days"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-800/80 border border-gray-600/50 text-white font-medium text-sm hover:bg-gray-700/80 hover:border-teal-500/40 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    Lecture Days
                  </Link>
                  <Link
                    href="/doctor/published"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-800/80 border border-gray-600/50 text-white font-medium text-sm hover:bg-gray-700/80 hover:border-teal-500/40 transition-all duration-200"
                  >
                    <Eye className="w-4 h-4" />
                    View Published
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Panel */}
          <div className="lg:w-72 flex flex-col gap-4">
            <div className="rounded-2xl border border-gray-700/50 bg-gray-800/50 p-6">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                My Stats
              </h4>
              
              <div className="space-y-4">
                <div className="rounded-xl border border-teal-700/30 bg-gray-900/60 p-4">
                  <p className="text-xs font-semibold text-teal-400/80 uppercase tracking-wider">
                    Submitted Days
                  </p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {loading ? '—' : submittedDays}
                  </p>
                </div>

                <div className="rounded-xl border border-teal-700/30 bg-gray-900/60 p-4">
                  <p className="text-xs font-semibold text-teal-400/80 uppercase tracking-wider">
                    Total Published
                  </p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {loading ? '—' : totalPublished}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}
