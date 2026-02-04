'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ScheduleFormulaCard } from '@/components/generate/ScheduleFormulaCard'
import { CalculationLog } from '@/components/generate/CalculationLog'
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
  const [log, setLog] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [semester, setSemester] = useState('Fall 2024')

  // Fetch campuses on mount
  useEffect(() => {
    const fetchCampuses = async () => {
      try {
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
      }
    }

    fetchCampuses()
  }, [])

  const addLog = (message: string) => {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const handleRunCalculations = async () => {
    if (!selectedBranch) {
      setError('Please select a branch')
      return
    }

    setLoading(true)
    setError('')
    setLog([])
    addLog('Starting schedule generation...')
    addLog(`Selected branch: ${branches.find((b) => b.value === selectedBranch)?.label}`)
    addLog(`Semester: ${semester}`)

    try {
      addLog('Fetching data from database...')
      addLog('Transforming data for AI service...')
      addLog('Calling AI service...')

      const result = await scheduleApi.generate(selectedBranch, semester)

      addLog(`✅ Schedule generated successfully!`)
      addLog(`Total sessions created: ${result.totalSessions || 0}`)
      addLog('Schedule saved to database.')
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to generate schedule. Please try again.'
      setError(errorMessage)
      addLog(`❌ Error: ${errorMessage}`)
    } finally {
      setLoading(false)
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <ScheduleFormulaCard
            branches={branches}
            selectedBranch={selectedBranch}
            onBranchChange={setSelectedBranch}
            onRunCalculations={handleRunCalculations}
            loading={loading}
            semester={semester}
            onSemesterChange={setSemester}
          />
          <ConflictResolutionCard onResolveConflicts={handleResolveConflicts} />
          <CalculationLog log={log} />
          <PerformanceInsightCard metrics={mockMetrics} />
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}

