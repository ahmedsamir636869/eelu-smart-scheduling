import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

interface SectionCardProps {
  sectionNumber: number
  numberOfStudents: number
  assignedGroup: string
  onStudentsChange: (sectionNumber: number, value: number) => void
  onGroupChange: (sectionNumber: number, value: string) => void
}

const groups = ['Group A', 'Group B', 'Group C', 'Group D']

export function SectionCard({
  sectionNumber,
  numberOfStudents,
  assignedGroup,
  onStudentsChange,
  onGroupChange,
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
    <Card>
      <h3 className="text-white font-bold text-lg mb-4">Section {sectionNumber}</h3>
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

