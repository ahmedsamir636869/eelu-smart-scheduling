'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Monitor, CheckCircle, Clock, ArrowRight } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { taApi } from '@/lib/api'

interface Report {
  id: string
  title: string
  content: string
  status: string
  createdAt: string
}

export default function TADashboardPage() {
  const { user } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const data = await taApi.getMyReports().catch(() => [])
      setReports(Array.isArray(data) ? data.slice(0, 3) : [])
    } catch (err) {
      console.error('Error fetching reports:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['TA']}>
      <MainLayout title="Dashboard" subtitle={`Welcome, ${user?.name || 'User'}`}>
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            TA Validation Hub
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Review schedules and maintain system integrity.
          </p>
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
                  Check Schedules
                </h3>
                <p className="text-gray-300/80 text-sm mt-3 max-w-sm leading-relaxed">
                  Browse finalized branch schedules to verify instructor loads and room assignments.
                </p>

                <div className="flex flex-wrap gap-3 mt-8">
                  <Link
                    href="/ta/schedules"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-800/80 border border-gray-600/50 text-white font-medium text-sm hover:bg-gray-700/80 hover:border-teal-500/40 transition-all duration-200"
                  >
                    <Monitor className="w-4 h-4" />
                    Browse Published
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Panel */}
          <div className="lg:w-80 flex flex-col gap-4">
            <div className="rounded-2xl border border-gray-700/50 bg-gray-800/50 p-6">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Recent Activity
              </h4>

              <div className="space-y-3">
                {loading ? (
                  <p className="text-gray-500 text-sm">Loading...</p>
                ) : reports.length === 0 ? (
                  <>
                    {/* Show placeholder activity items when no real reports */}
                    <div className="rounded-xl border border-green-700/30 bg-gray-900/60 p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-white text-sm font-semibold">No recent issues</p>
                          <p className="text-gray-400 text-xs mt-0.5">All clear</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  reports.map((report) => (
                    <div
                      key={report.id}
                      className={`rounded-xl border p-4 ${
                        report.status === 'READ'
                          ? 'border-green-700/30 bg-gray-900/60'
                          : 'border-amber-700/30 bg-gray-900/60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {report.status === 'READ' ? (
                          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                        ) : (
                          <Clock className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <p className="text-white text-sm font-semibold">{report.title}</p>
                          <p className="text-gray-400 text-xs mt-0.5">
                            {report.status === 'READ' ? 'Resolved' : 'Pending'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Link
                href="/ta/issues"
                className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-teal-600/60 to-gray-600/60 text-white font-medium text-sm hover:from-teal-500/70 hover:to-gray-500/70 transition-all duration-300 border border-teal-700/20"
              >
                View My Reports
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}
