'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/MainLayout'
import { FileUploadSection } from '@/components/data/DoctorSchedules/FileUploadSection'
import { ScheduleItem } from '@/components/data/DoctorSchedules/ScheduleItem'
import { campusApi, ApiError } from '@/lib/api'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

interface DoctorSchedulesPageProps {
  params: {
    branchId: string
  }
}

interface Schedule {
  id: string
  fileName: string
  doctorName: string
  branch: string
  date: string
  status: 'processed' | 'error' | 'pending'
}

export default function DoctorSchedulesPage({ params }: DoctorSchedulesPageProps) {
  const [branchName, setBranchName] = useState(`Branch ${params.branchId}`)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCampusInfo()
    // Note: Doctor schedules endpoint doesn't exist yet in backend
    // This is a placeholder for when the endpoint is created
  }, [params.branchId])

  const fetchCampusInfo = async () => {
    try {
      setLoading(true)
      setError('')
      const campus = await campusApi.getById(params.branchId)
      if (campus) {
        const displayName = campus.city 
          ? `${campus.name} - ${campus.city}` 
          : campus.name
        setBranchName(displayName)
      }
      // TODO: Fetch doctor schedules when endpoint is available
      // const schedulesData = await api.get(`/schedule/doctor-schedules?campusId=${params.branchId}`)
      // setSchedules(schedulesData)
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to load campus information.'
      setError(errorMessage)
      console.error('Error fetching campus:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (file: File) => {
    try {
      setError('')
      // TODO: Implement file upload when endpoint is available
      // const formData = new FormData()
      // formData.append('file', file)
      // formData.append('campusId', params.branchId)
      // const result = await api.post('/schedule/upload-doctor-schedule', formData)
      
      // For now, show a message that this feature is not yet implemented
      alert('Doctor schedule upload feature will be available when the backend endpoint is implemented.')
      
      // Placeholder: Add new schedule as pending
      const newSchedule: Schedule = {
        id: Date.now().toString(),
        fileName: file.name,
        doctorName: 'Dr. New Doctor',
        branch: branchName,
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
      }
      setSchedules([...schedules, newSchedule])
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to upload schedule. Please try again.'
      setError(errorMessage)
    }
  }

  const handleDownload = (id: string) => {
    const schedule = schedules.find(s => s.id === id)
    if (schedule) {
      // TODO: Implement download when endpoint is available
      // window.open(`/api/schedule/doctor-schedules/${id}/download`, '_blank')
      alert('Download feature will be available when the backend endpoint is implemented.')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this schedule?')) {
      try {
        setError('')
        // TODO: Implement delete when endpoint is available
        // await api.delete(`/schedule/doctor-schedules/${id}`)
        setSchedules(schedules.filter(s => s.id !== id))
      } catch (err) {
        const errorMessage =
          err instanceof ApiError
            ? err.message
            : 'Failed to delete schedule. Please try again.'
        setError(errorMessage)
      }
    }
  }

  return (
    <ProtectedRoute>
      <MainLayout title="Data: Doctor Schedule Upload Manager">
        <div className="space-y-6">
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <Link
            href={`/data/${params.branchId}`}
            className="text-teal-400 hover:text-teal-300 transition-colors inline-flex items-center gap-2"
          >
            ← Back to Data Management ({branchName})
          </Link>

          <div>
            <h2 className="text-white text-xl font-bold mb-2">Doctor Schedule Upload Manager</h2>
            <p className="text-gray-400 text-sm">
              View and manage all doctor schedule submissions. You can also upload PDF schedules directly here.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : (
            <>
              <FileUploadSection onFileSelect={handleFileSelect} />

              <div>
                <h3 className="text-white font-bold text-lg mb-4">
                  Submitted Schedules ({schedules.length})
                </h3>
                {schedules.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No schedules uploaded yet. Upload a schedule using the form above.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {schedules.map((schedule) => (
                      <ScheduleItem
                        key={schedule.id}
                        id={schedule.id}
                        fileName={schedule.fileName}
                        doctorName={schedule.doctorName}
                        branch={schedule.branch}
                        date={schedule.date}
                        status={schedule.status}
                        onDownload={handleDownload}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}

