'use client'

import { useState } from 'react'
import { X, Clock, Building2, Save } from 'lucide-react'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface InstructorEditModalProps {
  instructor: {
    id: string
    name: string
    staffId: string
    role: string
    weeklyLoad: number
    coursesAssigned: string[]
    availableDays: string[]
  }
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    id: string
    role: string
    weeklyLoad: number
    coursesAssigned: string[]
    availableDays: string[]
  }) => void
}

const roles = [
  { value: 'Teaching Assistant', label: 'Teaching Assistant' },
  { value: 'Assistant Lecturer', label: 'Assistant Lecturer' },
  { value: 'Lecturer', label: 'Lecturer' },
  { value: 'Senior Lecturer', label: 'Senior Lecturer' },
]

const daysOfWeek = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']

export function InstructorEditModal({
  instructor,
  isOpen,
  onClose,
  onSave,
}: InstructorEditModalProps) {
  const [role, setRole] = useState(instructor.role)
  const [weeklyLoad, setWeeklyLoad] = useState(instructor.weeklyLoad)
  const [coursesAssigned, setCoursesAssigned] = useState<string[]>(instructor.coursesAssigned)
  const [availableDays, setAvailableDays] = useState<string[]>(instructor.availableDays)

  if (!isOpen) return null

  const handleToggleDay = (day: string) => {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter(d => d !== day))
    } else {
      setAvailableDays([...availableDays, day])
    }
  }

  const handleRemoveCourse = (course: string) => {
    setCoursesAssigned(coursesAssigned.filter(c => c !== course))
  }

  const handleSave = () => {
    onSave({
      id: instructor.id,
      role,
      weeklyLoad,
      coursesAssigned,
      availableDays,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-gray-400" />
            <div>
              <h2 className="text-white font-bold text-xl">{instructor.name}</h2>
              <p className="text-gray-400 text-sm">STAFF ID: {instructor.staffId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Professional Role and Weekly Work Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="text-gray-400 text-sm font-medium mb-2 block">
                PROFESSIONAL ROLE
              </label>
              <Select
                options={roles}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm font-medium mb-2 block">
                WEEKLY WORK HOURS
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="number"
                  value={weeklyLoad}
                  onChange={(e) => setWeeklyLoad(parseInt(e.target.value) || 0)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Assigned Courses */}
          <div>
            <label className="text-gray-400 text-sm font-medium mb-2 block">
              ASSIGNED COURSES
            </label>
            <div className="flex flex-wrap gap-2">
              {coursesAssigned.map((course) => (
                <Badge
                  key={course}
                  variant="published"
                  className="flex items-center gap-2 pr-2"
                >
                  <span>{course}</span>
                  <button
                    onClick={() => handleRemoveCourse(course)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Weekly Schedule */}
          <div>
            <label className="text-gray-400 text-sm font-medium mb-2 block">
              WEEKLY SCHEDULE
            </label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map((day) => (
                <button
                  key={day}
                  onClick={() => handleToggleDay(day)}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-colors',
                    availableDays.includes(day)
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 p-4 sm:p-6 border-t border-gray-700">
          <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button variant="primary" icon={<Save className="w-4 h-4" />} onClick={handleSave} className="w-full sm:w-auto">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}

