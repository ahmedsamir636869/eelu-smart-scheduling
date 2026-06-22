'use client'

import { useState, useEffect } from 'react'
import { Plus, CheckCircle, Clock, MessageSquare, X } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { taApi } from '@/lib/api'

interface Report {
  id: string
  title: string
  content: string
  status: string
  createdAt: string
  adminResponse?: string
  priority?: string
}

export default function TAIssuesPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewReport, setShowNewReport] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const data = await taApi.getMyReports().catch(() => [])
      setReports(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching reports:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReport = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      setError('Please fill in both title and description.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await taApi.submitReport({ title: newTitle.trim(), content: newContent.trim() })
      setSuccess('Report submitted successfully!')
      setNewTitle('')
      setNewContent('')
      setShowNewReport(false)
      fetchReports()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to submit report.')
    } finally {
      setSubmitting(false)
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

  const getReportId = (report: Report, index: number) => {
    return `REP-${(800 + index + 1).toString()}`
  }

  const getPriorityBadge = (report: Report) => {
    // Derive priority from content keywords or default
    const content = (report.title + ' ' + report.content).toLowerCase()
    if (content.includes('conflict') || content.includes('critical') || content.includes('urgent')) {
      return { label: 'High Priority', color: 'bg-red-600 text-white' }
    }
    return { label: 'Medium Priority', color: 'bg-yellow-600/80 text-white' }
  }

  return (
    <ProtectedRoute allowedRoles={['TA']}>
      <MainLayout title="Issue Tracking" subtitle="Monitor your reports and admin responses.">
        {/* Header Actions */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowNewReport(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-red-600/20"
          >
            <Plus className="w-4 h-4" />
            New Report
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-3 bg-green-900/50 border border-green-700 rounded-lg text-green-200 text-sm">
            {success}
          </div>
        )}

        {/* New Report Modal */}
        {showNewReport && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold text-lg">Submit New Report</h3>
                <button
                  onClick={() => setShowNewReport(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Issue Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Room Conflict: Lab 3"
                    className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Describe the issue in detail..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowNewReport(false)}
                    className="flex-1 px-4 py-3 rounded-xl bg-gray-700 text-gray-300 hover:bg-gray-600 font-medium text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReport}
                    disabled={submitting}
                    className="flex-1 px-4 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports List */}
        <div className="space-y-5">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="w-14 h-14 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg font-medium">No reports yet</p>
              <p className="text-gray-500 text-sm mt-1">
                Click &quot;+ New Report&quot; to submit your first issue.
              </p>
            </div>
          ) : (
            reports.map((report, index) => {
              const priority = getPriorityBadge(report)
              const isResolved = report.status === 'READ'

              return (
                <div
                  key={report.id}
                  className="bg-gray-800/60 border border-gray-700/50 rounded-2xl p-6 transition-all duration-200 hover:border-gray-600/50"
                >
                  {/* Report Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${isResolved ? 'text-green-400' : 'text-amber-400'}`}>
                        {isResolved ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <Clock className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-bold text-white">{report.title}</h3>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${priority.color}`}
                          >
                            {priority.label}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mt-1">
                          {getReportId(report, index)} • Submitted {formatDate(report.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                        isResolved
                          ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                          : 'bg-amber-600/20 text-amber-400 border border-amber-600/30'
                      }`}
                    >
                      {isResolved ? 'Resolved' : 'Pending'}
                    </span>
                  </div>

                  {/* Admin Response or Awaiting */}
                  {isResolved ? (
                    <div className="mt-4 ml-9">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-600 text-white text-xs font-semibold mb-2">
                        <MessageSquare className="w-3 h-3" />
                        ADMIN RESPONSE
                      </div>
                      <div className="bg-gray-900/60 border border-gray-700/40 rounded-xl p-4">
                        <p className="text-gray-300 text-sm italic">
                          &quot;{report.content}&quot;
                        </p>
                        <p className="text-teal-400 text-xs mt-2 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center text-[10px] font-bold text-white">
                            AD
                          </span>
                          System Admin • Recently
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 ml-9">
                      <div className="border-2 border-dashed border-gray-700/50 rounded-xl p-4 flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-500" />
                        <p className="text-gray-500 text-sm italic">
                          Awaiting administrator review...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}
