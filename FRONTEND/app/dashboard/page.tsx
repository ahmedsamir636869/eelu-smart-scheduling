'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, AlertTriangle, Users } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { ReportsList } from '@/components/dashboard/ReportsList'
import { TAReport } from '@/types/api'
import { scheduleApi, campusApi, taApi, instructorApi, ApiError } from '@/lib/api'
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
  const router = useRouter()

  // Role-based redirect: non-admin users go to their own dashboard
  useEffect(() => {
    if (user) {
      if (user.role === 'INSTRUCTOR') {
        router.replace('/doctor')
        return
      }
      if (user.role === 'TA') {
        router.replace('/ta')
        return
      }
    }
  }, [user, router])

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Fetch schedules to count total (assuming all are pending review until action taken)
      const schedulesRes = await scheduleApi.getAll().catch(() => ({ schedules: [] }))
      const schedules = Array.isArray(schedulesRes) ? schedulesRes : (schedulesRes.schedules || [])
      setPendingSchedules(schedules.length)

      // Fetch instructors to calculate doctor schedules ratio (Part-time instructors)
      const instructors = await instructorApi.getAll().catch(() => [])
      const partTimeInstructors = instructors.filter((i: any) => i.employmentType === 'PART_TIME')
      const totalPartTime = partTimeInstructors.length
      const uploadedPartTime = partTimeInstructors.filter((i: any) => i.availability && i.availability.length > 0).length
      setDoctorSchedules(`${uploadedPartTime}/${totalPartTime}`)

      // Fetch TA reports for open conflicts and latest reports list
      const taReports = await taApi.getAllReports().catch(() => [])
      const unreadReports = taReports.filter((r: any) => r.status === 'UNREAD')
      setOpenConflicts(unreadReports.length)
      
      // Sort by newest first and take top 5 for the list
      const sortedReports = [...taReports].sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      
      // Map to expected frontend interface
      const mappedReports = sortedReports.slice(0, 5).map((r: any) => ({
        id: r.id.substring(r.id.length - 6),
        userId: r.ta?.name || 'Unknown',
        branch: 'N/A',
        description: `${r.title}\n\n${r.content}`,
        status: (r.status === 'READ' ? 'resolved' : 'new') as TAReport['status']
      }))
      setReports(mappedReports)
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

  // Don't render admin dashboard for non-admin users
  if (user && user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
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
