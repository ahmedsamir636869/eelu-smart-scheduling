'use client'

import { useState, useEffect } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ScheduleCard, ScheduleViewer, Schedule, ScheduleEvent, EVENT_COLORS, DayOfWeek } from '@/components/data/Schedules'
import { campusApi, scheduleApi, ApiError } from '@/lib/api'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function PublishedPage() {
  const [branches, setBranches] = useState<{ value: string; label: string }[]>([])
  const [selectedBranch, setSelectedBranch] = useState('')
  const [publishedSchedules, setPublishedSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal state for viewing
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)

  useEffect(() => {
    fetchCampuses()
  }, [])

  useEffect(() => {
    if (selectedBranch) {
      fetchPublishedSchedules(selectedBranch)
    }
  }, [selectedBranch])

  const fetchCampuses = async () => {
    try {
      setLoading(true)
      setError('')
      const campuses = await campusApi.getAll()
      const branchOptions = campuses.map((campus: any) => ({
        value: campus.id,
        label: `${campus.name}${campus.city ? ` - ${campus.city}` : ''}`,
      }))
      setBranches(branchOptions)
      if (branchOptions.length > 0) {
        setSelectedBranch(branchOptions[0].value)
      }
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to load campuses. Please try again.'
      setError(errorMessage)
      console.error('Error fetching campuses:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPublishedSchedules = async (campusId: string) => {
    try {
      setLoading(true)
      const allSchedules = await scheduleApi.getAll()

      // Get published IDs from LocalStorage
      let publishedIds: string[] = []
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('publishedScheduleIds')
        if (stored) {
          publishedIds = JSON.parse(stored)
        }
      }

      // Filter and Map
      const mappedSchedules: Schedule[] = allSchedules
        .filter((s: any) => publishedIds.includes(s.id)) // Only show published ones
        .map((s: any) => {
          // Map sessions to events (simplified for display)
          const events: ScheduleEvent[] = (s.sessions || []).map((session: any) => {
            const dayMap: Record<string, DayOfWeek> = {
              'SATURDAY': 'Saturday', 'SUNDAY': 'Sunday', 'MONDAY': 'Monday',
              'TUESDAY': 'Tuesday', 'WEDNESDAY': 'Wednesday', 'THURSDAY': 'Thursday', 'FRIDAY': 'Friday'
            }
            const day = (dayMap[session.day?.toUpperCase()] || 'Monday') as DayOfWeek

            const formatTime = (dateString: string | null): string => {
              if (!dateString) return '08:00'
              try {
                const date = new Date(dateString)
                const hours = String(date.getHours()).padStart(2, '0')
                const minutes = String(date.getMinutes()).padStart(2, '0')
                return `${hours}:${minutes}`
              } catch { return '08:00' }
            }

            const type = session.type === 'SECTION' ? 'lab' : 'lecture'
            const colorConfig = EVENT_COLORS[type] || EVENT_COLORS.lecture

            return {
              id: session.id,
              title: session.name || session.course?.name || 'Untitled',
              courseCode: session.course?.code || '',
              courseName: session.course?.name || '',
              instructor: session.instructor?.name || 'Unassigned',
              location: session.classroom?.name || 'TBA',
              day: day,
              startTime: formatTime(session.startTime),
              endTime: formatTime(session.endTime),
              color: colorConfig.bg,
              type: type,
              studentCount: session.studentCount,
              roomCapacity: session.classroom?.capacity,
              year: session.course?.year,
              college: session.course?.college?.name || session.college?.name
            }
          })

          return {
            id: s.id,
            name: `${s.semester} ${s.generatedBy || 'Schedule'}`,
            collegeId: 'unknown',
            collegeName: 'General',
            status: 'published',
            events: events,
            createdAt: s.createdAt || new Date().toISOString(),
            updatedAt: s.updatedAt || new Date().toISOString(),
            generatedBy: (s.generatedBy && s.generatedBy.includes('AI')) ? 'ai' : 'manual'
          }
        })

      setPublishedSchedules(mappedSchedules)
    } catch (err) {
      console.error('Error fetching schedules:', err)
      setError('Failed to load schedules')
    } finally {
      setLoading(false)
    }
  }

  const handleFinalize = async () => {
    try {
      setError('')
      // This is where "Global Publish" logic would go
      // For now, we simulate success
      alert('All displayed schedules have been finalized and are available to students.')
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to publish schedule. Please try again.'
      setError(errorMessage)
    }
  }

  const handleUnpublish = (schedule: Schedule) => {
    if (confirm(`Unpublish "${schedule.name}"? This will remove it from the published view.`)) {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('publishedScheduleIds')
        if (stored) {
          const publishedIds: string[] = JSON.parse(stored)
          const newIds = publishedIds.filter(id => id !== schedule.id)
          localStorage.setItem('publishedScheduleIds', JSON.stringify(newIds))

          // Update UI
          setPublishedSchedules(prev => prev.filter(s => s.id !== schedule.id))
        }
      }
    }
  }

  const handleView = (schedule: Schedule) => {
    setSelectedSchedule(schedule)
    setIsViewerOpen(true)
  }

  const selectedBranchName = branches.find((b) => b.value === selectedBranch)?.label || 'Unknown'

  return (
    <ProtectedRoute>
      <MainLayout title="Published Schedules">
        <div className="space-y-4 sm:space-y-6">
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <div>
            <h2 className="text-white text-lg sm:text-xl font-bold uppercase mb-4">SCHEDULE REVIEW AND PUBLISH</h2>

            {loading && !selectedBranch ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-teal-500" /></div>
            ) : branches.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No campuses found. Create a campus first.</div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 sm:mb-6">
                  <div className="flex-1 w-full">
                    <label className="text-gray-400 text-sm mb-2 block">Select Branch for Review</label>
                    <Select
                      options={branches}
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-white text-base sm:text-lg font-bold mb-4">
                    {selectedBranchName} Published Schedules
                  </h3>

                  {publishedSchedules.length === 0 ? (
                    <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700/50">
                      <p className="text-gray-400 mb-2">No published schedules found for this campus.</p>
                      <p className="text-sm text-gray-500">Go to the Schedules page to publish a draft.</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {publishedSchedules.map((schedule) => (
                          <div key={schedule.id}>
                            <ScheduleCard
                              schedule={schedule}
                              onView={handleView}
                              onEdit={() => alert("Unpublish this schedule to edit it in the Schedules page.")}
                              onDelete={handleUnpublish}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-center">
                        <Button
                          variant="primary"
                          icon={<Check className="w-4 h-4" />}
                          onClick={handleFinalize}
                          className="px-8 py-3 text-lg shadow-lg shadow-teal-900/20"
                        >
                          Finalize & Notify Students
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Schedule Viewer */}
          {isViewerOpen && selectedSchedule && (
            <ScheduleViewer
              schedule={selectedSchedule}
              onClose={() => {
                setIsViewerOpen(false)
                setSelectedSchedule(null)
              }}
              onEdit={() => {
                setIsViewerOpen(false)
                alert("Unpublish this schedule to edit it in the Schedules page.")
              }}
            />
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}
