import { Edit } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface InstructorCardProps {
  id: string
  name: string
  role: string
  weeklyLoad: number
  coursesAssigned: number
  onEdit: (id: string) => void
  onViewProfile: (id: string) => void
}

const avatarColors = [
  'bg-orange-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-blue-500',
  'bg-pink-500',
]

export function InstructorCard({
  id,
  name,
  role,
  weeklyLoad,
  coursesAssigned,
  onEdit,
  onViewProfile,
}: InstructorCardProps) {
  const firstLetter = name.charAt(0).toUpperCase()
  const colorIndex = name.charCodeAt(0) % avatarColors.length
  const avatarColor = avatarColors[colorIndex]

  return (
    <Card className="relative">
      <button
        onClick={() => onEdit(id)}
        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
      </button>

      <div className="flex flex-col items-center text-center space-y-4">
        <div className={cn('w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold', avatarColor)}>
          {firstLetter}
        </div>

        <div>
          <h3 className="text-white font-bold text-lg mb-1">{name}</h3>
          <p className="text-gray-400 text-sm">{role}</p>
        </div>

        <div className="w-full space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Weekly Load:</span>
            <span className="text-white font-medium">{weeklyLoad} hrs</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Courses:</span>
            <span className="text-white font-medium">{coursesAssigned} Assigned</span>
          </div>
        </div>

        <Button
          variant="secondary"
          className="w-full"
          onClick={() => onViewProfile(id)}
        >
          View Profile
        </Button>
      </div>
    </Card>
  )
}

