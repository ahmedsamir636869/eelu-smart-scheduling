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
      // Lectures schedule is tagged AI-CP-Lectures and scoped to campus + semester
      const schedules = await scheduleApi.getAll(selectedBranch, semester)
      const exists = Array.isArray(schedules)
        && schedules.some((s: any) => s.generatedBy === 'AI-CP-Lectures')
      setHasLecturesSchedule(exists)
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

    try {
      await scheduleApi.generate(selectedBranch, semester, scheduleType)

      if (scheduleType === 'lectures') {
        setHasLecturesSchedule(true)
      }

      // Lectures and sections are stored as separate records; rebuild the
      // merged view (and refresh the lectures-first guard) from the backend.
      await checkLecturesSchedule()
      await fetchCurrentSchedule()
    } catch (err) {
      // 422 = sections requested before a lectures schedule exists
      if (err instanceof ApiError && err.status === 422) {
        setHasLecturesSchedule(false)
        setError(err.message || 'Generate the lectures schedule first before generating sections.')
      } else {
        const typeLabel = scheduleType === 'lectures' ? 'Lectures' : 'Sections'
        setError(
          err instanceof ApiError
            ? err.message
            : `Failed to generate ${typeLabel.toLowerCase()} schedule. Please try again.`
        )
      }
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

  // Merge the lectures and sections records into a single schedule object so
  // GeneratedScheduleView can show a combined timetable (it filters by type).
  const buildMergedSchedule = (lectures: any, sections: any) => {
    const base = lectures || sections
    if (!base) return null
    return {
      ...base,
      sessions: [
        ...(lectures?.sessions || []),
        ...(sections?.sessions || []),
      ],
    }
  }

  const fetchCurrentSchedule = async () => {
    try {
      const schedules = await scheduleApi.getAll(selectedBranch, semester)
      const list = Array.isArray(schedules) ? schedules : []
      const lecturesMeta = list.find((s: any) => s.generatedBy === 'AI-CP-Lectures')
      const sectionsMeta = list.find((s: any) => s.generatedBy === 'AI-CP-Sections')

      const [lectures, sections] = await Promise.all([
        lecturesMeta?.id
          ? scheduleApi.getById(lecturesMeta.id).catch(() => lecturesMeta)
          : Promise.resolve(null),
        sectionsMeta?.id
          ? scheduleApi.getById(sectionsMeta.id).catch(() => sectionsMeta)
          : Promise.resolve(null),
      ])

      setGeneratedSchedule(buildMergedSchedule(lectures, sections))
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
