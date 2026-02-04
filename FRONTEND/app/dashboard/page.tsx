'use client'

import { useState, useEffect } from 'react'
import { BookOpen, AlertTriangle, Users } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { ReportsList } from '@/components/dashboard/ReportsList'
import { TAReport } from '@/types/api'
import { scheduleApi, campusApi, ApiError } from '@/lib/api'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'

export default function DashboardPage() {
  const [pendingSchedules, setPendingSchedules] = useState(0)
  const [openConflicts, setOpenConflicts] = useState(0)
  const [doctorSchedules, setDoctorSchedules] = useState('0/0')
  const [reports, setReports] = useState<TAReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Fetch schedules to count pending reviews
      const schedules = await scheduleApi.getAll().catch(() => [])
      setPendingSchedules(schedules.length || 0)

      // Fetch campuses to calculate doctor schedules ratio
      const campuses = await campusApi.getAll().catch(() => [])
      const totalCampuses = campuses.length
      // This is a placeholder - in a real app, you'd have a specific endpoint for this
      setDoctorSchedules(`${Math.min(totalCampuses, 4)}/${totalCampuses}`)

      // Mock reports for now - would need a reports API endpoint
      setReports([])
      setOpenConflicts(0)
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to load dashboard data. Please try again.'
      setError(errorMessage)
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <MainLayout title="Dashboard" subtitle={`Welcome, ${user?.name || 'User'}`}>
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}
        <div className="space-y-4 sm:space-y-6">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading dashboard...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <MetricCard
                  title="SCHEDULES PENDING REVIEWS"
                  value={pendingSchedules}
                  icon={<BookOpen className="w-8 h-8" />}
                />
                <MetricCard
                  title="OPEN CONFLICTS REPORTS"
                  value={openConflicts}
                  icon={<AlertTriangle className="w-8 h-8 text-red-400" />}
                  valueColor="text-red-400"
                />
                <MetricCard
                  title="DOCTOR SCHEDULES UPLOADED"
                  value={doctorSchedules}
                  icon={<Users className="w-8 h-8 text-green-400" />}
                  valueColor="text-green-400"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-2">
                  <ReportsList reports={reports} />
                </div>
                <div>
                  <QuickActions />
                </div>
              </div>
            </>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}

