'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/MainLayout'
import { FileUploadSection } from '@/components/data/DoctorSchedules/FileUploadSection'
import { ScheduleItem } from '@/components/data/DoctorSchedules/ScheduleItem'

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

// Mock branch data
const branchNames: Record<string, string> = {
  '1': 'Ain Shams',
  '2': 'Assiut',
  '3': 'Alexandria',
}

// Mock initial schedules
const initialSchedules: Schedule[] = [
  {
    id: '1',
    fileName: 'DT_Lectures_Fall2025.pdf',
    doctorName: 'Dr. Kamal Hamza',
    branch: 'Ain Shams',
    date: '2024-08-18',
    status: 'processed',
  },
  {
    id: '2',
    fileName: 'Business_Lectures_Fall2027.pdf',
    doctorName: 'Dr. Kamal Hamza',
    branch: 'Ain Shams',
    date: '2023-09-01',
    status: 'error',
  },
  {
    id: '3',
    fileName: 'DT_Lectures_Fall2025.pdf',
    doctorName: 'Dr. Kamal Hamza',
    branch: 'Ain Shams',
    date: '2023-09-25',
    status: 'pending',
  },
]

export default function DoctorSchedulesPage({ params }: DoctorSchedulesPageProps) {
  const branchName = branchNames[params.branchId] || `Branch ${params.branchId}`
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules)

  const handleFileSelect = (file: File) => {
    console.log('File selected:', file.name)
    // In real app, this would upload the file via API
    // const formData = new FormData()
    // formData.append('file', file)
    // api.post(`/branches/${params.branchId}/doctor-schedules/upload`, formData)
    
    // Mock: Add new schedule as pending
    const newSchedule: Schedule = {
      id: Date.now().toString(),
      fileName: file.name,
      doctorName: 'Dr. New Doctor',
      branch: branchName,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
    }
    setSchedules([...schedules, newSchedule])
  }

  const handleDownload = (id: string) => {
    const schedule = schedules.find(s => s.id === id)
    if (schedule) {
      console.log('Downloading:', schedule.fileName)
      // In real app, this would download the file
      // window.open(`/api/schedules/${id}/download`, '_blank')
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this schedule?')) {
      setSchedules(schedules.filter(s => s.id !== id))
      // In real app, this would call the API
      // api.delete(`/branches/${params.branchId}/doctor-schedules/${id}`)
    }
  }

  return (
    <MainLayout title="Data: Doctor Schedule Upload Manager">
      <div className="space-y-6">
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

        <FileUploadSection onFileSelect={handleFileSelect} />

        <div>
          <h3 className="text-white font-bold text-lg mb-4">
            Submitted Schedules ({schedules.length})
          </h3>
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
        </div>
      </div>
    </MainLayout>
  )
}

