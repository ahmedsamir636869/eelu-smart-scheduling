'use client'

import { useState, useEffect } from 'react'
import { BarChart3 } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ReportListItem } from '@/components/reports/ReportListItem'
import { ReportDetails } from '@/components/reports/ReportDetails'
import { Card } from '@/components/ui/Card'
import { taApi } from '@/lib/api'

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

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReportId, setSelectedReportId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true)
        const data = await taApi.getAllReports()
        const mappedReports = data.map((r: any) => ({
          id: r.id,
          reportNumber: r.id.substring(r.id.length - 6),
          userId: r.ta?.name || 'Unknown User',
          branch: 'N/A',
          branchName: 'System',
          faculty: 'General',
          level: 'N/A',
          dateReported: new Date(r.createdAt).toISOString().split('T')[0],
          scheduleId: 'N/A',
          description: `${r.title}\n\n${r.content}`,
          status: (r.status === 'READ' ? 'resolved' : 'new') as Report['status'],
          adminNotes: '',
        }))
        setReports(mappedReports)
        if (mappedReports.length > 0) {
          setSelectedReportId(mappedReports[0].id)
        }
      } catch (err) {
        console.error('Failed to fetch TA reports:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

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

  const handleSave = async () => {
    if (!selectedReportId) return
    console.log('Saving admin notes for report:', selectedReportId)
    
    // If the status is resolved, call the API to mark it as read/resolved
    const currentReport = reports.find(r => r.id === selectedReportId)
    if (currentReport?.status === 'resolved') {
      try {
        await taApi.markReportRead(selectedReportId)
      } catch (err) {
        console.error('Failed to mark report as read:', err)
      }
    }
  }

  return (
    <MainLayout title="Reports">
      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="flex justify-center items-center h-[50vh] text-gray-400">
          No TA issue reports found.
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6 max-w-5xl">
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
      )}
    </MainLayout>
  )
}

