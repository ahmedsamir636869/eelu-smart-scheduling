import { Edit, Trash2, BookOpen } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface InstructorCardProps {
  id: string
  name: string
  role: string
  weeklyLoad: number
  coursesAssigned: number
  coursesList?: Array<{ id: string, name: string, code: string }>
  freeTimeSlots?: Array<{ day: string, startTime: string, endTime: string }>
  onEdit: (id: string) => void
  onViewProfile: (id: string) => void
  onDelete: (id: string) => void
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
  coursesList = [],
  freeTimeSlots = [],
  onEdit,
  onViewProfile,
  onDelete,
}: InstructorCardProps) {
  const firstLetter = name.charAt(0).toUpperCase()
  const colorIndex = name.charCodeAt(0) % avatarColors.length
  const avatarColor = avatarColors[colorIndex]

  return (
    <Card className="relative">
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => onEdit(id)}
          className="text-gray-400 hover:text-white transition-colors"
          title="Edit"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(id)}
          className="text-gray-400 hover:text-red-400 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col items-center text-center space-y-4">
        <div className={cn('w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold', avatarColor)}>
          {firstLetter}
        </div>

        <div>
          <h3 className="text-white font-bold text-lg mb-1">{name}</h3>
          <p className="text-gray-400 text-sm">{role}</p>
          <p className="text-gray-500 text-xs mt-1 font-mono">ID: {id.slice(0, 12)}...</p>
        </div>

        <div className="w-full space-y-2">
          <div className="space-y-1">
            <span className="text-gray-400 text-sm block text-left mb-2">Free Time:</span>
            {freeTimeSlots.length > 0 ? (
              <div className="space-y-1">
                {freeTimeSlots.map((slot, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs bg-gray-800/50 px-2 py-1 rounded">
                    <span className="text-gray-300 font-medium">{slot.day}</span>
                    <span className="text-white">{slot.startTime} - {slot.endTime}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-gray-500 text-xs">No free time slots</span>
            )}
          </div>
          <div className="pt-2 border-t border-gray-700 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Courses:</span>
              <span className="text-white font-medium">{coursesAssigned} Assigned</span>
            </div>
            {coursesList.length > 0 ? (
              <div className="space-y-1 mt-1">
                {coursesList.map((course) => (
                  <div key={course.id} className="flex items-center gap-2 text-xs bg-gray-800/50 px-2 py-1.5 rounded">
                    <BookOpen className="w-3 h-3 text-teal-400 flex-shrink-0" />
                    <span className="text-teal-300 font-mono font-medium">{course.code}</span>
                    <span className="text-gray-300 truncate">{course.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-gray-500 text-xs block mt-1">No courses assigned</span>
            )}
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

