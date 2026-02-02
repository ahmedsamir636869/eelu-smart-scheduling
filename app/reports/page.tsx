'use client'

import { useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ReportListItem } from '@/components/reports/ReportListItem'
import { ReportDetails } from '@/components/reports/ReportDetails'
import { QuickFixActions } from '@/components/reports/QuickFixActions'
import { Card } from '@/components/ui/Card'

interface Report {
  id: string
  reportNumber: string
  userId: string
  branch: string
  branchName: string
  faculty: string
  level: string
  dateReported: string
  scheduleId: string
  description: string
  status: 'new' | 'in_progress' | 'resolved'
  adminNotes: string
}

// Mock reports data
const initialReports: Report[] = [
  {
    id: '101',
    reportNumber: '101',
    userId: '235251',
    branch: '2',
    branchName: 'Assiut',
    faculty: 'IT',
    level: 'L3',
    dateReported: '2025-10-25',
    scheduleId: 's03',
    description: 'Instructor Eng.Sara is assigned to two different courses at the same time.',
    status: 'new',
    adminNotes: '',
  },
  {
    id: '102',
    reportNumber: '102',
    userId: '252524',
    branch: '14',
    branchName: 'Aswan',
    faculty: 'Business',
    level: 'L2',
    dateReported: '2025-10-24',
    scheduleId: 's14',
    description: 'Instructor Eng.Sara is assigned to two different courses at the same time.',
    status: 'resolved',
    adminNotes: 'Resolved by reassigning time slot.',
  },
  {
    id: '103',
    reportNumber: '103',
    userId: '252524',
    branch: '5',
    branchName: 'Beni Suef',
    faculty: 'IT',
    level: 'L1',
    dateReported: '2025-10-23',
    scheduleId: 's05',
    description: 'Instructor Eng.Sara is assigned to two different courses at the same time.',
    status: 'in_progress',
    adminNotes: 'Working on resolution...',
  },
  {
    id: '104',
    reportNumber: '104',
    userId: '252524',
    branch: '1',
    branchName: 'Ain Shams',
    faculty: 'Business',
    level: 'L4',
    dateReported: '2025-10-22',
    scheduleId: 's01',
    description: 'Instructor Eng.Sara is assigned to two different courses at the same time.',
    status: 'resolved',
    adminNotes: 'Resolved by adjusting room capacity.',
  },
  {
    id: '105',
    reportNumber: '105',
    userId: '252524',
    branch: '1',
    branchName: 'Ain Shams',
    faculty: 'IT',
    level: 'L2',
    dateReported: '2025-10-21',
    scheduleId: 's01',
    description: 'Instructor Eng.Sara is assigned to two different courses at the same time.',
    status: 'in_progress',
    adminNotes: 'Reviewing conflict details...',
  },
]

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>(initialReports)
  const [selectedReportId, setSelectedReportId] = useState<string>('101')

  const selectedReport = reports.find(r => r.id === selectedReportId) || reports[0]

  const handleStatusChange = (status: string) => {
    setReports(reports.map(r =>
      r.id === selectedReportId
        ? { ...r, status: status as 'new' | 'in_progress' | 'resolved' }
        : r
    ))
  }

  const handleNotesChange = (notes: string) => {
    setReports(reports.map(r =>
      r.id === selectedReportId
        ? { ...r, adminNotes: notes }
        : r
    ))
  }

  const handleSave = () => {
    console.log('Saving admin notes for report:', selectedReportId)
    // In real app, this would call the API
    // api.put(`/reports/${selectedReportId}`, { status: selectedReport.status, adminNotes: selectedReport.adminNotes })
  }

  const handleReassignTimeSlot = () => {
    console.log('Reassign time slot for report:', selectedReportId)
    // In real app, this would open a modal or navigate to reassignment page
  }

  const handleAdjustRoomCapacity = () => {
    console.log('Adjust room capacity for report:', selectedReportId)
    // In real app, this would open a modal or navigate to capacity adjustment page
  }

  const handleRecalculateSection = () => {
    console.log('Recalculate section for report:', selectedReportId)
    // In real app, this would trigger recalculation
  }

  return (
    <MainLayout title="Reports">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Reports List */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-gray-400" />
              <h3 className="text-white font-bold text-lg">ALL TA ISSUE REPORTS</h3>
            </div>
            <div className="space-y-3">
              {reports.map((report) => (
                <ReportListItem
                  key={report.id}
                  id={report.id}
                  reportNumber={report.reportNumber}
                  userId={report.userId}
                  branch={report.branch}
                  description={report.description}
                  status={report.status}
                  isSelected={report.id === selectedReportId}
                  onClick={() => setSelectedReportId(report.id)}
                />
              ))}
            </div>
          </Card>

          {/* Report Details */}
          <ReportDetails
            report={{
              id: selectedReport.id,
              reportNumber: selectedReport.reportNumber,
              branch: `Branch ${selectedReport.branch} - ${selectedReport.branchName}`,
              faculty: selectedReport.faculty,
              level: selectedReport.level,
              dateReported: selectedReport.dateReported,
              scheduleId: selectedReport.scheduleId,
              description: selectedReport.description,
              status: selectedReport.status,
              adminNotes: selectedReport.adminNotes,
            }}
            onStatusChange={handleStatusChange}
            onNotesChange={handleNotesChange}
            onSave={handleSave}
          />
        </div>

        {/* Right Column - Quick Fix Actions */}
        <div>
          <QuickFixActions
            onReassignTimeSlot={handleReassignTimeSlot}
            onAdjustRoomCapacity={handleAdjustRoomCapacity}
            onRecalculateSection={handleRecalculateSection}
          />
        </div>
      </div>
    </MainLayout>
  )
}

