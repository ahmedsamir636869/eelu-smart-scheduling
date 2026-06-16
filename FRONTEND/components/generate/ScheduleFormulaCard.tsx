import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Zap, BookOpen, Users } from 'lucide-react'

interface ScheduleFormulaCardProps {
  branches: { value: string; label: string }[]
  selectedBranch: string
  onBranchChange: (branch: string) => void
  onRunCalculations: (scheduleType: 'lectures' | 'sections') => void
  loading?: boolean
  loadingType?: 'lectures' | 'sections' | null
  semester?: string
  onSemesterChange?: (semester: string) => void
  hasLecturesSchedule?: boolean
}

export function ScheduleFormulaCard({
  branches,
  selectedBranch,
  onBranchChange,
  onRunCalculations,
  loading = false,
  loadingType = null,
  semester = 'Fall 2024',
  onSemesterChange,
  hasLecturesSchedule = false,
}: ScheduleFormulaCardProps) {
  const isGeneratingLectures = loading && loadingType === 'lectures'
  const isGeneratingSections = loading && loadingType === 'sections'
  const canGenerateSections = hasLecturesSchedule && !isGeneratingLectures

  return (
    <Card>
      <h3 className="text-white font-bold text-lg mb-2">SCHEDULE GENERATION FORMULA</h3>
      <p className="text-gray-400 text-sm mb-4">
        Generate schedules in two steps: First lectures, then sections. Sections can only be generated after lectures are created.
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
        
        <div className="space-y-3 pt-2 border-t border-gray-700">
          <div>
            <h4 className="text-white font-medium text-sm mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-teal-400" />
              Step 1: Generate Lecture Schedule (AI-Powered)
            </h4>
            <p className="text-gray-400 text-xs mb-3">
              Generate schedule for theoretical courses (lectures) using AI algorithm. 
              Uses data from the selected branch including courses, instructors, classrooms, and student groups.
              This must be done first before generating sections.
            </p>
            <Button
              variant="success"
              icon={<BookOpen className="w-4 h-4" />}
              onClick={() => onRunCalculations('lectures')}
              disabled={isGeneratingLectures || isGeneratingSections || !selectedBranch}
              className="w-full"
            >
              {isGeneratingLectures ? 'Generating Lectures with AI...' : 'Generate Lecture Schedule (AI)'}
            </Button>
            {!selectedBranch && (
              <p className="text-yellow-400 text-xs mt-2">
                ⚠️ Please select a branch first
              </p>
            )}
          </div>

          <div>
            <h4 className="text-white font-medium text-sm mb-2">Step 2: Generate Sections</h4>
            <p className="text-gray-400 text-xs mb-3">
              Generate schedule for practical courses (sections/labs). Requires lectures to be generated first.
            </p>
            {!hasLecturesSchedule && (
              <p className="text-yellow-400 text-xs mb-2">
                ⚠️ Please generate lectures schedule first
              </p>
            )}
            <Button
              variant="success"
              icon={<Users className="w-4 h-4" />}
              onClick={() => onRunCalculations('sections')}
              disabled={!canGenerateSections || isGeneratingLectures || isGeneratingSections || !selectedBranch}
              className="w-full"
            >
              {isGeneratingSections ? 'Generating Sections...' : 'Generate Sections Schedule'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

