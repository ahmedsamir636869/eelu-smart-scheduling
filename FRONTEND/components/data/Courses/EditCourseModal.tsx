'use client'

import { useState, useEffect } from 'react'
import { X, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Course } from '@/types/api'

interface EditCourseModalProps {
  course: Course & {
    department?: { name: string; code: string; id: string }
    college?: { name: string; id: string }
    instructor?: { name: string; id: string }
  }
  isOpen: boolean
  onClose: () => void
  onSave: (id: string, data: {
    name: string
    code: string
    type: 'THEORETICAL' | 'PRACTICAL'
    days: number
    hoursPerDay: number
    year: number
    departmentId: string
    collegeId: string
    instructorId?: string
  }) => Promise<void>
  colleges: any[]
  departments: any[]
  instructors: any[]
}

export function EditCourseModal({
  course,
  isOpen,
  onClose,
  onSave,
  colleges,
  departments,
  instructors,
}: EditCourseModalProps) {
  const [name, setName] = useState(course.name || '')
  const [code, setCode] = useState(course.code || '')
  const [type, setType] = useState<'THEORETICAL' | 'PRACTICAL'>(course.type || 'THEORETICAL')
  const [days, setDays] = useState(course.days || 2)
  const [hoursPerDay, setHoursPerDay] = useState(course.hoursPerDay || 2)
  const [year, setYear] = useState(course.year || 1)
  const [collegeId, setCollegeId] = useState(
    typeof course.college === 'object' && course.college ? course.college.id : course.collegeId || ''
  )
  const [departmentId, setDepartmentId] = useState(
    typeof course.department === 'object' && course.department ? course.department.id : course.departmentId || ''
  )
  const [instructorId, setInstructorId] = useState(
    typeof course.instructor === 'object' && course.instructor ? course.instructor.id : course.instructorId || ''
  )
  const [filteredDepartments, setFilteredDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Initialize form when course changes
  useEffect(() => {
    if (course) {
      setName(course.name || '')
      setCode(course.code || '')
      setType(course.type || 'THEORETICAL')
      setDays(course.days || 2)
      setHoursPerDay(course.hoursPerDay || 2)
      setYear(course.year || 1)
      setCollegeId(
        typeof course.college === 'object' && course.college ? course.college.id : course.collegeId || ''
      )
      setDepartmentId(
        typeof course.department === 'object' && course.department ? course.department.id : course.departmentId || ''
      )
      setInstructorId(
        typeof course.instructor === 'object' && course.instructor ? course.instructor.id : course.instructorId || ''
      )
    }
  }, [course])

  // Filter departments when college changes
  useEffect(() => {
    if (collegeId) {
      const filtered = departments.filter((dept: any) => dept.collegeId === collegeId)
      setFilteredDepartments(filtered)
      // Reset department if current selection is not in filtered list
      if (departmentId && !filtered.some((d: any) => d.id === departmentId)) {
        setDepartmentId('')
      }
    } else {
      setFilteredDepartments([])
    }
  }, [collegeId, departments, departmentId])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!name.trim()) {
      setError('Course name is required')
      return
    }
    if (!code.trim()) {
      setError('Course code is required')
      return
    }
    if (!collegeId) {
      setError('College is required')
      return
    }
    if (!departmentId) {
      setError('Department is required')
      return
    }
    if (days < 1 || days > 7) {
      setError('Days per week must be between 1 and 7')
      return
    }
    if (hoursPerDay < 1 || hoursPerDay > 8) {
      setError('Hours per day must be between 1 and 8')
      return
    }
    if (year < 1 || year > 4) {
      setError('Year must be between 1 and 4')
      return
    }

    try {
      setLoading(true)
      await onSave(course.id, {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        type,
        days,
        hoursPerDay,
        year,
        departmentId,
        collegeId,
        instructorId: instructorId || undefined,
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to update course. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 rounded-lg">
              <BookOpen className="w-5 h-5 text-teal-400" />
            </div>
            <h2 className="text-white text-xl font-bold">Edit Course</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Course Name *
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Introduction to Programming"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Course Code *
              </label>
              <Input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g., CS101"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                College *
              </label>
              <Select
                value={collegeId}
                onChange={(e) => setCollegeId(e.target.value)}
                options={colleges.map((college) => ({
                  value: college.id,
                  label: college.name,
                }))}
                placeholder="Select College"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Department *
              </label>
              <Select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                options={filteredDepartments.map((dept) => ({
                  value: dept.id,
                  label: dept.name,
                }))}
                placeholder={collegeId ? "Select Department" : "Select College first"}
                required
                disabled={!collegeId || filteredDepartments.length === 0}
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Course Type *
              </label>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as 'THEORETICAL' | 'PRACTICAL')}
                options={[
                  { value: 'THEORETICAL', label: 'Lecture (Theoretical)' },
                  { value: 'PRACTICAL', label: 'Lab (Practical)' },
                ]}
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Instructor (Optional)
              </label>
              <Select
                value={instructorId}
                onChange={(e) => setInstructorId(e.target.value)}
                options={[
                  { value: '', label: 'Unassigned' },
                  ...instructors.map((instructor) => ({
                    value: instructor.id,
                    label: instructor.name,
                  })),
                ]}
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Year *
              </label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || 1)}
                min={1}
                max={4}
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Days per Week *
              </label>
              <Input
                type="number"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                min={1}
                max={7}
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Hours per Day *
              </label>
              <Input
                type="number"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(parseInt(e.target.value) || 1)}
                min={1}
                max={8}
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Course'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

