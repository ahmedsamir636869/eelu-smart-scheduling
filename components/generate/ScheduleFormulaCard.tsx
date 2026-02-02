import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Zap } from 'lucide-react'

interface ScheduleFormulaCardProps {
  branches: { value: string; label: string }[]
  selectedBranch: string
  onBranchChange: (branch: string) => void
  onRunCalculations: () => void
}

export function ScheduleFormulaCard({
  branches,
  selectedBranch,
  onBranchChange,
  onRunCalculations,
}: ScheduleFormulaCardProps) {
  return (
    <Card>
      <h3 className="text-white font-bold text-lg mb-2">SCHEDULE GENERATION FORMULA</h3>
      <p className="text-gray-400 text-sm mb-4">
        Select the branch and run the formula to generate draft schedules for IT and Business faculties.
      </p>
      <div className="space-y-4">
        <Select
          options={branches}
          value={selectedBranch}
          onChange={(e) => onBranchChange(e.target.value)}
        />
        <Button variant="success" icon={<Zap className="w-4 h-4" />} onClick={onRunCalculations}>
          Run Calculations
        </Button>
      </div>
    </Card>
  )
}

