import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Zap } from 'lucide-react'

interface ScheduleFormulaCardProps {
  branches: { value: string; label: string }[]
  selectedBranch: string
  onBranchChange: (branch: string) => void
  onRunCalculations: () => void
  loading?: boolean
  semester?: string
  onSemesterChange?: (semester: string) => void
}

export function ScheduleFormulaCard({
  branches,
  selectedBranch,
  onBranchChange,
  onRunCalculations,
  loading = false,
  semester = 'Fall 2024',
  onSemesterChange,
}: ScheduleFormulaCardProps) {
  return (
    <Card>
      <h3 className="text-white font-bold text-lg mb-2">SCHEDULE GENERATION FORMULA</h3>
      <p className="text-gray-400 text-sm mb-4">
        Select the branch and run the formula to generate draft schedules for IT and Business faculties.
      </p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Branch
          </label>
          <Select
            options={branches}
            value={selectedBranch}
            onChange={(e) => onBranchChange(e.target.value)}
            disabled={loading}
          />
        </div>
        {onSemesterChange && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Semester
            </label>
            <Input
              type="text"
              value={semester}
              onChange={(e) => onSemesterChange(e.target.value)}
              placeholder="e.g., Fall 2024"
              disabled={loading}
            />
          </div>
        )}
        <Button
          variant="success"
          icon={<Zap className="w-4 h-4" />}
          onClick={onRunCalculations}
          disabled={loading || !selectedBranch}
        >
          {loading ? 'Generating...' : 'Run Calculations'}
        </Button>
      </div>
    </Card>
  )
}

