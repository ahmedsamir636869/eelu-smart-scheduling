'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ScheduleFormulaCard } from '@/components/generate/ScheduleFormulaCard'
import { CalculationLog } from '@/components/generate/CalculationLog'
import { ConflictResolutionCard } from '@/components/generate/ConflictResolutionCard'
import { PerformanceInsightCard } from '@/components/generate/PerformanceInsightCard'
import { PerformanceMetrics } from '@/types/api'

// Mock data
const branches = [
  { value: '1', label: 'Branch 1 - Ain Shams' },
  { value: '2', label: 'Branch 2 - Assiut' },
  { value: '3', label: 'Branch 3 - Alexandria' },
]

const mockMetrics: PerformanceMetrics = {
  initialConflictRate: '4.9%',
  avgResolutionTime: '2.5 Days',
  lastSuccessfulRun: 'Bunch 1 - 15/20',
}

export default function GeneratePage() {
  const [selectedBranch, setSelectedBranch] = useState('3')
  const [log, setLog] = useState<string[]>([])

  const handleRunCalculations = () => {
    setLog(['Starting calculations...', 'Processing branch data...', 'Running formula...'])
    // In real app, this would call the API
  }

  const handleResolveConflicts = () => {
    // Navigate to conflict resolution page
    console.log('Navigate to conflict resolution')
  }

  return (
    <MainLayout title="Generate Schedule">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ScheduleFormulaCard
          branches={branches}
          selectedBranch={selectedBranch}
          onBranchChange={setSelectedBranch}
          onRunCalculations={handleRunCalculations}
        />
        <ConflictResolutionCard onResolveConflicts={handleResolveConflicts} />
        <CalculationLog log={log} />
        <PerformanceInsightCard metrics={mockMetrics} />
      </div>
    </MainLayout>
  )
}

