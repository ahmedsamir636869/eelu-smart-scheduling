'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ScheduleFormulaCard } from '@/components/generate/ScheduleFormulaCard'
import { GeneratedScheduleView } from '@/components/generate/GeneratedScheduleView'
import { ConflictResolutionCard } from '@/components/generate/ConflictResolutionCard'
import { PerformanceInsightCard } from '@/components/generate/PerformanceInsightCard'
import { PerformanceMetrics } from '@/types/api'
import { campusApi, scheduleApi, ApiError } from '@/lib/api'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

const mockMetrics: PerformanceMetrics = {
  initialConflictRate: '4.9%',
  avgResolutionTime: '2.5 Days',
  lastSuccessfulRun: 'Bunch 1 - 15/20',
}

export default function GeneratePage() {
  const [branches, setBranches] = useState<{ value: string; label: string }[]>([])
  const [selectedBranch, setSelectedBranch] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingType, setLoadingType] = useState<'lectures' | 'sections' | null>(null)
  const [error, setError] = useState('')
  const [semester, setSemester] = useState('Fall 2024')
  const [hasLecturesSchedule, setHasLecturesSchedule] = useState(false)
  const [generatedSchedule, setGeneratedSchedule] = useState<any>(null)

  // Fetch campuses on mount
  useEffect(() => {
    const fetchCampuses = async () => {
      try {
        setInitialLoading(true)
        const campuses = await campusApi.getAll()
        const branchOptions = campuses.map((campus: any) => ({
          value: campus.id,
          label: `${campus.name}${campus.city ? ` - ${campus.city}` : ''}`,
        }))
        setBranches(branchOptions)
        if (branchOptions.length > 0 && !selectedBranch) {
          setSelectedBranch(branchOptions[0].value)
        }
      } catch (err) {
        console.error('Failed to fetch campuses:', err)
        setError('Failed to load campuses. Please refresh the page.')
      } finally {
        setInitialLoading(false)
      }
    }

    fetchCampuses()
  }, [])

  // Check if lectures schedule exists when branch or semester changes
  useEffect(() => {
    if (selectedBranch && semester) {
      checkLecturesSchedule()
    }
  }, [selectedBranch, semester])

  const checkLecturesSchedule = async () => {
    try {
      // Check if lectures schedule exists by fetching schedules
      const schedules = await scheduleApi.getAll()
      const lecturesSchedule = Array.isArray(schedules)
        ? schedules.find((s: any) =>
          s.semester === semester && s.generatedBy === 'AI-GA-Lectures'
        )
        : null
      setHasLecturesSchedule(!!lecturesSchedule)
    } catch (err) {
      // If check fails, assume no lectures schedule
      console.warn('Failed to check lectures schedule:', err)
      setHasLecturesSchedule(false)
    }
  }

  const handleRunCalculations = async (scheduleType: 'lectures' | 'sections') => {
    if (!selectedBranch) {
      setError('Please select a branch')
      return
    }

    setLoading(true)
    setLoadingType(scheduleType)
    setError('')
    setGeneratedSchedule(null)

    try {
      const result = await scheduleApi.generate(selectedBranch, semester, scheduleType)

      // The result should already contain sessions, but fetch full details if needed
      if (result && result.id) {
        try {
          const fullSchedule = await scheduleApi.getById(result.id)
          setGeneratedSchedule(fullSchedule)
        } catch (fetchErr) {
          // If fetching fails, use the result we got (it should have sessions)
          setGeneratedSchedule(result)
        }
      } else if (result && result.schedule) {
        // Handle case where response wraps schedule in 'schedule' property
        setGeneratedSchedule(result.schedule)
      } else {
        setGeneratedSchedule(result)
      }

      // Refresh lectures schedule check
      if (scheduleType === 'lectures') {
        setHasLecturesSchedule(true)
      } else {
        await checkLecturesSchedule()
        // If sections were generated, refresh the schedule to show both lectures and sections
        if (result && result.id) {
          try {
            const fullSchedule = await scheduleApi.getById(result.id)
            setGeneratedSchedule(fullSchedule)
          } catch (fetchErr) {
            console.warn('Failed to refresh schedule:', fetchErr)
          }
        }
      }
    } catch (err) {
      const typeLabel = scheduleType === 'lectures' ? 'Lectures' : 'Sections'
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : `Failed to generate ${typeLabel.toLowerCase()} schedule. Please try again.`
      setError(errorMessage)
    } finally {
      setLoading(false)
      setLoadingType(null)
    }
  }

  // Fetch schedule when branch or semester changes
  useEffect(() => {
    if (selectedBranch && semester) {
      fetchCurrentSchedule()
    }
  }, [selectedBranch, semester])

  const fetchCurrentSchedule = async () => {
    try {
      const schedules = await scheduleApi.getAll()
      const currentSchedule = Array.isArray(schedules)
        ? schedules.find((s: any) =>
          s.semester === semester &&
          (s.generatedBy === 'AI-GA-Lectures' || s.generatedBy === 'AI-GA' || s.generatedBy === 'AI-GA-Sections')
        )
        : null

      if (currentSchedule && currentSchedule.id) {
        try {
          const fullSchedule = await scheduleApi.getById(currentSchedule.id)
          setGeneratedSchedule(fullSchedule)
        } catch (fetchErr) {
          // Use the schedule from list if getById fails
          setGeneratedSchedule(currentSchedule)
        }
      } else {
        setGeneratedSchedule(null)
      }
    } catch (err) {
      console.warn('Failed to fetch current schedule:', err)
      setGeneratedSchedule(null)
    }
  }

  const handleResolveConflicts = () => {
    // Navigate to conflict resolution page
    console.log('Navigate to conflict resolution')
  }

  return (
    <ProtectedRoute>
      <MainLayout title="Generate Schedule">
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        {initialLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">Loading configuration...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <ScheduleFormulaCard
                branches={branches}
                selectedBranch={selectedBranch}
                onBranchChange={setSelectedBranch}
                onRunCalculations={handleRunCalculations}
                loading={loading}
                loadingType={loadingType}
                semester={semester}
                onSemesterChange={setSemester}
                hasLecturesSchedule={hasLecturesSchedule}
              />
              <ConflictResolutionCard onResolveConflicts={handleResolveConflicts} />
              <PerformanceInsightCard metrics={mockMetrics} />
            </div>

            {/* Generated Schedule View */}
            <GeneratedScheduleView schedule={generatedSchedule} loading={loading} />
          </div>
        )}
      </MainLayout>
    </ProtectedRoute>
  )
}
