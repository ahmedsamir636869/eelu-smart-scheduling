import { Edit, Trash2, BookOpen, Users, Clock, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Course } from '@/types/api'
import { cn } from '@/lib/utils'

interface CourseCardProps {
  course: Course & {
    department?: { name: string; code: string }
    college?: { name: string }
    instructor?: { name: string }
  }
  onEdit: () => void
  onDelete: () => void
}

export function CourseCard({ course, onEdit, onDelete }: CourseCardProps) {
  const courseTypeColor = course.type === 'THEORETICAL' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-green-500/20 text-green-300 border-green-500/30'
  
  const departmentName = typeof course.department === 'object' && course.department 
    ? course.department.name 
    : 'Unknown Department'
  
  const collegeName = typeof course.college === 'object' && course.college
    ? course.college.name
    : 'Unknown College'

  const instructorName = typeof course.instructor === 'object' && course.instructor
    ? course.instructor.name
    : 'Unassigned'

  return (
    <Card className="relative hover:border-teal-500/50 transition-colors">
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={onEdit}
          className="text-gray-400 hover:text-white transition-colors"
          title="Edit"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="text-gray-400 hover:text-red-400 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-teal-500/20 rounded-lg">
            <BookOpen className="w-5 h-5 text-teal-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-lg mb-1 truncate">{course.name}</h3>
            <p className="text-gray-400 text-sm font-mono">{course.code}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Department:</span>
            <span className="text-white">{departmentName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">College:</span>
            <span className="text-white">{collegeName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Instructor:</span>
            <span className={cn(
              "text-white",
              instructorName === 'Unassigned' && "text-gray-500 italic"
            )}>
              {instructorName}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge className={courseTypeColor}>
            {course.type === 'THEORETICAL' ? 'Lecture' : 'Lab'}
          </Badge>
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
            Year {course.year}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-gray-400 text-xs">Days/Week</p>
              <p className="text-white font-medium">{course.days}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-gray-400 text-xs">Hours/Day</p>
              <p className="text-white font-medium">{course.hoursPerDay}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

