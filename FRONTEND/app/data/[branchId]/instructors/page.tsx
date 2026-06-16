'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { InstructorCard } from '@/components/data/Instructors/InstructorCard'
import { InstructorEditModal } from '@/components/data/Instructors/InstructorEditModal'
import { campusApi, instructorApi, ApiError } from '@/lib/api'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

interface InstructorsPageProps {
  params: Promise<{
    branchId: string
  }>
}

interface Instructor {
  id: string
  name: string
  role: string
  weeklyLoad: number
  coursesAssigned: number
  staffId?: string
  courses?: string[]
  availableDays?: string[]
  freeTimeSlots?: Array<{ day: string, startTime: string, endTime: string }>
}

export default function InstructorsPage({ params }: InstructorsPageProps) {
  const { branchId } = use(params)
  const [branchName, setBranchName] = useState(`Branch ${branchId}`)
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (branchId) {
      fetchCampusAndInstructors()
    }
  }, [branchId])

  const fetchCampusAndInstructors = async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch campus info
      const campus = await campusApi.getById(branchId)
      let campusDepartmentIds: string[] = []

      if (campus) {
        const displayName = campus.city
          ? `${campus.name} - ${campus.city}`
          : campus.name
        setBranchName(displayName)

        // Get all department IDs for this campus's colleges
        if (campus.colleges && campus.colleges.length > 0) {
          for (const college of campus.colleges) {
            try {
              const depts = await import('@/lib/api').then(m => m.departmentApi.getAll(college.id))
              campusDepartmentIds.push(...depts.map((d: any) => d.id))
            } catch (err) {
              console.warn(`Failed to fetch departments for college ${college.id}:`, err)
            }
          }
        }
      }

      // Fetch all instructors
      const allInstructorsData = await instructorApi.getAll()

      // Filter instructors by campus departments
      const instructorsData = campusDepartmentIds.length > 0
        ? allInstructorsData.filter((instructor: any) => campusDepartmentIds.includes(instructor.departmentId))
        : []

      // Debug: Log instructor data structure
      console.log('Filtered instructors count:', instructorsData.length)
      console.log('Instructors data sample:', instructorsData.slice(0, 2))
      if (instructorsData[0]) {
        console.log('First instructor full data:', instructorsData[0])
      }

      // Group instructors by name (since each time slot creates a separate record)
      const instructorMap = new Map<string, {
        id: string
        name: string
        days: string[]
        departmentId: string
        allIds: string[] // Store all IDs for this instructor
        timeSlots: Array<{ day: string, startTime: string | Date | null, endTime: string | Date | null }> // Store all time slots with day
        courses: Array<{ id: string, name: string, code: string }> // Store all assigned courses
      }>()

      // Map day enum to short format
      const dayMap: Record<string, string> = {
        'SATURDAY': 'Sat',
        'SUNDAY': 'Sun',
        'MONDAY': 'Mon',
        'TUESDAY': 'Tue',
        'WEDNESDAY': 'Wed',
        'THURSDAY': 'Thu',
        'FRIDAY': 'Fri'
      }

      // Helper function to calculate hours between two times
      const calculateHours = (startTime: string | Date | null, endTime: string | Date | null): number => {
        if (!startTime || !endTime) return 0

        const start = new Date(startTime)
        const end = new Date(endTime)

        if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0

        const diffMs = end.getTime() - start.getTime()
        const diffHours = diffMs / (1000 * 60 * 60) // Convert milliseconds to hours

        return Math.max(0, diffHours) // Ensure non-negative
      }

      // Group instructors by name and aggregate days and time slots
      instructorsData.forEach((instructor: any) => {
        const name = instructor.name.trim()
        if (!instructorMap.has(name)) {
          instructorMap.set(name, {
            id: instructor.id, // Use first record's ID
            name: name,
            days: [],
            departmentId: instructor.departmentId,
            allIds: [instructor.id], // Initialize with first ID
            timeSlots: [],
            courses: [] // Initialize courses array
          })
        } else {
          // Add this ID to the list
          const existing = instructorMap.get(name)!
          if (!existing.allIds.includes(instructor.id)) {
            existing.allIds.push(instructor.id)
          }
        }

        const existing = instructorMap.get(name)!

        // Add day if it exists and not already added
        if (instructor.day) {
          const dayShort = dayMap[instructor.day] || instructor.day
          if (!existing.days.includes(dayShort)) {
            existing.days.push(dayShort)
          }
        }

        // Add time slot with day information for free time display
        if (instructor.startTime && instructor.endTime && instructor.day) {
          const dayShort = dayMap[instructor.day] || instructor.day
          existing.timeSlots.push({
            day: dayShort,
            startTime: instructor.startTime,
            endTime: instructor.endTime
          })
          console.log(`Added time slot for ${name}: ${dayShort} ${instructor.startTime} - ${instructor.endTime}`)
        } else {
          console.warn(`Missing time data for ${name}:`, {
            hasStartTime: !!instructor.startTime,
            hasEndTime: !!instructor.endTime,
            hasDay: !!instructor.day,
            startTime: instructor.startTime,
            endTime: instructor.endTime,
            day: instructor.day
          })
        }

        // Add assigned courses if they exist (avoid duplicates)
        if (instructor.assignedCourses && Array.isArray(instructor.assignedCourses)) {
          instructor.assignedCourses.forEach((course: { id: string, name: string, code: string }) => {
            // Check if course already exists (by ID)
            if (!existing.courses.find(c => c.id === course.id)) {
              existing.courses.push(course)
            }
          })
        }
      })

      // Helper function to format time for display
      const formatTime = (time: string | Date | null | undefined): string => {
        if (!time) {
          return ''
        }

        // Handle string time format like "8:00" or "08:00"
        if (typeof time === 'string' && time.match(/^\d{1,2}:\d{2}$/)) {
          const [hours, minutes] = time.split(':').map(Number)
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
        }

        try {
          const date = new Date(time)
          if (isNaN(date.getTime())) {
            return ''
          }
          const hours = date.getHours()
          const minutes = date.getMinutes()
          const formattedHours = hours.toString().padStart(2, '0')
          const formattedMinutes = minutes.toString().padStart(2, '0')
          return `${formattedHours}:${formattedMinutes}`
        } catch (error) {
          console.error('formatTime error:', error, time)
          return ''
        }
      }

      // Transform grouped instructors to frontend format
      const transformedInstructors: Instructor[] = Array.from(instructorMap.values()).map((instructor) => {
        // Calculate total weekly hours from all time slots
        const weeklyHours = instructor.timeSlots.reduce((total, slot) => {
          return total + calculateHours(slot.startTime, slot.endTime)
        }, 0)

        // Format free time slots for display
        const freeTimeSlots = instructor.timeSlots.map(slot => {
          let formattedStart = formatTime(slot.startTime)
          let formattedEnd = formatTime(slot.endTime)

          // Fallback: if formatting fails, try to extract time from string
          if (!formattedStart && slot.startTime) {
            const timeStr = String(slot.startTime)
            // Try to extract time from ISO string like "2024-01-01T08:00:00.000Z"
            const timeMatch = timeStr.match(/T(\d{2}):(\d{2})/)
            if (timeMatch) {
              formattedStart = `${timeMatch[1]}:${timeMatch[2]}`
            } else if (timeStr.match(/^\d{1,2}:\d{2}/)) {
              // Already in HH:MM format
              formattedStart = timeStr.substring(0, 5)
            }
          }

          if (!formattedEnd && slot.endTime) {
            const timeStr = String(slot.endTime)
            const timeMatch = timeStr.match(/T(\d{2}):(\d{2})/)
            if (timeMatch) {
              formattedEnd = `${timeMatch[1]}:${timeMatch[2]}`
            } else if (timeStr.match(/^\d{1,2}:\d{2}/)) {
              formattedEnd = timeStr.substring(0, 5)
            }
          }

          console.log(`Formatting slot for ${instructor.name}: ${slot.day} ${slot.startTime} (${typeof slot.startTime}) -> ${formattedStart}, ${slot.endTime} (${typeof slot.endTime}) -> ${formattedEnd}`)

          return {
            day: slot.day,
            startTime: formattedStart || 'N/A',
            endTime: formattedEnd || 'N/A'
          }
        }).filter(slot => slot.startTime !== 'N/A' && slot.endTime !== 'N/A') // Filter out invalid slots
          .sort((a, b) => {
            // Sort by day order
            const dayOrder = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']
            return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
          })

        console.log(`Free time slots for ${instructor.name}:`, freeTimeSlots)

        // Extract course names/codes for display
        const courseNames = instructor.courses.map(c => c.name || c.code)

        return {
          id: instructor.id,
          name: instructor.name,
          role: 'INSTRUCTOR',
          weeklyLoad: Math.round(weeklyHours * 10) / 10, // Keep for backward compatibility
          coursesAssigned: instructor.courses.length, // Count of assigned courses
          courses: courseNames, // Store course names for modal display
          availableDays: instructor.days.sort(), // Sort days for consistency
          freeTimeSlots: freeTimeSlots, // Store formatted free time slots
          // Store all IDs and name for deletion
          _allIds: instructor.allIds,
          _originalName: instructor.name,
          _timeSlots: instructor.timeSlots, // Store for recalculation
          _courseObjects: instructor.courses // Store full course objects for reference
        } as Instructor & { _allIds?: string[], _originalName?: string, _timeSlots?: Array<any>, _courseObjects?: Array<any> }
      })

      setInstructors(transformedInstructors)
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to load instructors. Please try again.'
      setError(errorMessage)
      console.error('Error fetching instructors:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredInstructors = instructors.filter(
    (instructor) =>
      instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.id.includes(searchQuery)
  )

  const handleEdit = (id: string) => {
    const instructor = instructors.find(i => i.id === id)
    if (instructor) {
      setSelectedInstructor({
        ...instructor,
        staffId: instructor.staffId || `TA${id.padStart(3, '0')}`,
        courses: instructor.courses || [],
        availableDays: instructor.availableDays || [],
      })
      setIsModalOpen(true)
    }
  }

  const handleViewProfile = (id: string) => {
    // Same as edit for now - opens the modal
    handleEdit(id)
  }

  const handleDelete = async (id: string) => {
    const instructor = instructors.find(i => i.id === id)
    if (!instructor) return

    if (!confirm(`Are you sure you want to delete ${instructor.name} and all their time slot assignments?`)) {
      return
    }

    try {
      setError('')
      // Delete all Instructor records for this instructor (all time slots)
      const instructorWithIds = instructor as Instructor & { _allIds?: string[] }
      const idsToDelete = instructorWithIds._allIds || [id]

      // Delete all records
      await Promise.all(idsToDelete.map(instructorId => instructorApi.delete(instructorId)))

      // Refresh the list
      await fetchCampusAndInstructors()
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to delete instructor. Please try again.'
      setError(errorMessage)
    }
  }

  const handleSave = async (data: {
    id: string
    role: string
    weeklyLoad: number
    coursesAssigned: string[]
    availableDays: string[]
  }) => {
    try {
      setError('')
      // Update instructor via API
      await instructorApi.update(data.id, {
        day: data.availableDays[0] || undefined,
        // Note: Backend instructor model doesn't have all these fields
        // You may need to update the backend schema or use a different approach
      })

      setInstructors(instructors.map(instructor =>
        instructor.id === data.id
          ? {
            ...instructor,
            role: data.role,
            weeklyLoad: data.weeklyLoad,
            coursesAssigned: data.coursesAssigned.length,
            courses: data.coursesAssigned,
            availableDays: data.availableDays,
          }
          : instructor
      ))
      setIsModalOpen(false)
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to update instructor. Please try again.'
      setError(errorMessage)
      throw err
    }
  }

  return (
    <ProtectedRoute>
      <MainLayout title="Instructor Assignment">
        <div className="space-y-6">
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <div>
            <h1 className="text-white text-2xl font-bold mb-2">Data: Instructor Assignment - {branchName}</h1>
            <Link
              href={`/data/${branchId}`}
              className="text-teal-400 hover:text-teal-300 transition-colors inline-flex items-center gap-2"
            >
              ← Back to Data Management ({branchName})
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-white text-lg sm:text-xl font-bold uppercase">INSTRUCTOR ASSIGNMENT DIRECTORY</h2>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 w-full sm:w-64"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading instructors...</div>
          ) : filteredInstructors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">
                {searchQuery ? 'No instructors found matching your search.' : 'No instructors found.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredInstructors.map((instructor) => (
                <InstructorCard
                  key={instructor.id}
                  id={instructor.id}
                  name={instructor.name}
                  role={instructor.role}
                  weeklyLoad={instructor.weeklyLoad}
                  coursesAssigned={instructor.coursesAssigned}
                  coursesList={(instructor as any)._courseObjects || []}
                  freeTimeSlots={instructor.freeTimeSlots}
                  onEdit={handleEdit}
                  onViewProfile={handleViewProfile}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {selectedInstructor && (
          <InstructorEditModal
            instructor={{
              id: selectedInstructor.id,
              name: selectedInstructor.name,
              staffId: selectedInstructor.staffId || `TA${selectedInstructor.id.padStart(3, '0')}`,
              role: selectedInstructor.role,
              weeklyLoad: selectedInstructor.weeklyLoad,
              coursesAssigned: selectedInstructor.courses || [],
              availableDays: selectedInstructor.availableDays || [],
              freeTimeSlots: selectedInstructor.freeTimeSlots || [],
            }}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false)
              setSelectedInstructor(null)
            }}
            onSave={handleSave}
          />
        )}
      </MainLayout>
    </ProtectedRoute>
  )
}

