'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { InstructorCard } from '@/components/data/Instructors/InstructorCard'
import { InstructorEditModal } from '@/components/data/Instructors/InstructorEditModal'
import { campusApi, instructorApi, ApiError } from '@/lib/api'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

interface InstructorsPageProps {
  params: {
    branchId: string
  }
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
}

export default function InstructorsPage({ params }: InstructorsPageProps) {
  const [branchName, setBranchName] = useState(`Branch ${params.branchId}`)
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCampusAndInstructors()
  }, [params.branchId])

  const fetchCampusAndInstructors = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Fetch campus info
      const campus = await campusApi.getById(params.branchId)
      if (campus) {
        const displayName = campus.city 
          ? `${campus.name} - ${campus.city}` 
          : campus.name
        setBranchName(displayName)
      }

      // Fetch all instructors
      const instructorsData = await instructorApi.getAll()
      
      // Transform backend instructor format to frontend format
      const transformedInstructors: Instructor[] = instructorsData.map((instructor: any) => ({
        id: instructor.id,
        name: instructor.name,
        role: 'INSTRUCTOR', // Backend doesn't have role in instructor model, using default
        weeklyLoad: 0, // Would need to calculate from courses
        coursesAssigned: 0, // Would need to count assigned courses
        availableDays: instructor.day ? [instructor.day] : [],
      }))
      
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
              href={`/data/${params.branchId}`}
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
                  onEdit={handleEdit}
                  onViewProfile={handleViewProfile}
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

