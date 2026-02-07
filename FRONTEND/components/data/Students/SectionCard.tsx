import { Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

interface SectionCardProps {
  sectionNumber: number
  numberOfStudents: number
  assignedGroup: string
  college?: string
  level?: number
  department?: string
  onStudentsChange: (sectionNumber: number, value: number) => void
  onGroupChange: (sectionNumber: number, value: string) => void
  onDelete?: (sectionNumber: number) => void
}

const groups = ['Group A', 'Group B', 'Group C', 'Group D']

export function SectionCard({
  sectionNumber,
  numberOfStudents,
  assignedGroup,
  college,
  level,
  department,
  onStudentsChange,
  onGroupChange,
  onDelete,
}: SectionCardProps) {
  const handleStudentsIncrement = () => {
    onStudentsChange(sectionNumber, numberOfStudents + 1)
  }

  const handleStudentsDecrement = () => {
    if (numberOfStudents > 0) {
      onStudentsChange(sectionNumber, numberOfStudents - 1)
    }
  }

  const handleStudentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0
    onStudentsChange(sectionNumber, value)
  }

  const currentGroupIndex = groups.indexOf(assignedGroup)
  const handleGroupIncrement = () => {
    const nextIndex = (currentGroupIndex + 1) % groups.length
    onGroupChange(sectionNumber, groups[nextIndex])
  }

  const handleGroupDecrement = () => {
    const prevIndex = currentGroupIndex <= 0 ? groups.length - 1 : currentGroupIndex - 1
    onGroupChange(sectionNumber, groups[prevIndex])
  }

  return (
    <Card className="relative">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-white font-bold text-lg">Section {sectionNumber}</h3>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {college && level && (
            <Badge variant="published" className="text-xs">
              {college} Lvl {level}
            </Badge>
          )}
          {department && (
            <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 text-xs">
              {department}
            </Badge>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(sectionNumber)}
              className="text-gray-400 hover:text-red-400 transition-colors"
              title="Delete section"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-gray-400 text-sm mb-2 block">Number of Students</label>
          <Input
            type="number"
            value={numberOfStudents}
            onChange={handleStudentsChange}
            onIncrement={handleStudentsIncrement}
            onDecrement={handleStudentsDecrement}
          />
        </div>
        <div>
          <label className="text-gray-400 text-sm mb-2 block">Assigned Group</label>
          <Input
            type="text"
            value={assignedGroup}
            readOnly
            onIncrement={handleGroupIncrement}
            onDecrement={handleGroupDecrement}
            className="cursor-pointer"
          />
        </div>
      </div>
    </Card>
  )
}

