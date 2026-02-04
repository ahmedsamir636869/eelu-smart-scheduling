'use client'

import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { FacultyScheduleCard } from '@/components/published/FacultyScheduleCard'
import { campusApi, scheduleApi, ApiError } from '@/lib/api'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function PublishedPage() {
  const [branches, setBranches] = useState<{ value: string; label: string }[]>([])
  const [selectedBranch, setSelectedBranch] = useState('')
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCampuses()
  }, [])

  useEffect(() => {
    if (selectedBranch) {
      fetchSchedulesForBranch(selectedBranch)
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

  const fetchSchedulesForBranch = async (campusId: string) => {
    try {
      const allSchedules = await scheduleApi.getAll()
      // Filter schedules by campus (this would need campusId in schedule model)
      // For now, just show all schedules
      setSchedules(allSchedules)
    } catch (err) {
      console.error('Error fetching schedules:', err)
    }
  }

  const handleFinalize = async () => {
    try {
      setError('')
      // This would need a publish endpoint
      // await api.post(`/schedule/${selectedBranch}/publish`, {})
      alert('Publish functionality will be implemented with backend endpoint')
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to publish schedule. Please try again.'
      setError(errorMessage)
    }
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
            
            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading campuses...</div>
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
                    {selectedBranchName} Schedules
                  </h3>

                  {schedules.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      No schedules found for this campus. Generate a schedule first.
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                        <FacultyScheduleCard
                          faculty="IT"
                          status="draft"
                          keyMetric={`${schedules.length} schedule(s) found`}
                        />
                        <FacultyScheduleCard
                          faculty="Business"
                          status="draft"
                          keyMetric={`${schedules.length} schedule(s) found`}
                        />
                      </div>

                      <div className="flex justify-center">
                        <Button
                          variant="primary"
                          icon={<Check className="w-4 h-4" />}
                          onClick={handleFinalize}
                          className="px-8 py-3 text-lg"
                        >
                          Finalize & Publish
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}

