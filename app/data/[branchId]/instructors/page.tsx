'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { InstructorCard } from '@/components/data/Instructors/InstructorCard'
import { InstructorEditModal } from '@/components/data/Instructors/InstructorEditModal'

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

// Mock branch data
const branchNames: Record<string, string> = {
  '1': 'Ain Shams',
  '2': 'Assiut',
  '3': 'Alexandria',
}

// Mock initial instructors data
const initialInstructors: Instructor[] = [
  { 
    id: '1', 
    name: 'Mohamed Ismail', 
    role: 'Teaching Assistant', 
    weeklyLoad: 24, 
    coursesAssigned: 1,
    staffId: 'TA001',
    courses: ['Advanced Networks'],
    availableDays: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
  },
  { 
    id: '2', 
    name: 'Habiba Ahmed', 
    role: 'Teaching Assistant', 
    weeklyLoad: 23, 
    coursesAssigned: 1,
    staffId: 'TA002',
    courses: ['Software Engineering'],
    availableDays: ['Sat', 'Sun', 'Mon', 'Tue'],
  },
  { 
    id: '3', 
    name: 'Amira Ali', 
    role: 'Assistant Lecturer', 
    weeklyLoad: 16, 
    coursesAssigned: 4,
    staffId: 'AL001',
    courses: ['OOP', 'Data Structures', 'Algorithms', 'Database Systems'],
    availableDays: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed'],
  },
  { 
    id: '4', 
    name: 'Bassem Ahmed', 
    role: 'Teaching Assistant', 
    weeklyLoad: 24, 
    coursesAssigned: 1,
    staffId: 'TA003',
    courses: ['Web Development'],
    availableDays: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
  },
  { 
    id: '5', 
    name: 'Mai Ahmed', 
    role: 'Assistant Lecturer', 
    weeklyLoad: 15, 
    coursesAssigned: 1,
    staffId: 'AL002',
    courses: ['Computer Networks'],
    availableDays: ['Sat', 'Sun', 'Mon'],
  },
  { 
    id: '6', 
    name: 'Alya Mohamed', 
    role: 'Teaching Assistant', 
    weeklyLoad: 24, 
    coursesAssigned: 3,
    staffId: 'TA004',
    courses: ['Mobile Development', 'UI/UX Design', 'Project Management'],
    availableDays: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
  },
]

export default function InstructorsPage({ params }: InstructorsPageProps) {
  const branchName = branchNames[params.branchId] || `Branch ${params.branchId}`
  const [instructors, setInstructors] = useState<Instructor[]>(initialInstructors)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  const handleSave = (data: {
    id: string
    role: string
    weeklyLoad: number
    coursesAssigned: string[]
    availableDays: string[]
  }) => {
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
    // In real app, this would call the API
    // api.put(`/branches/${params.branchId}/instructors/${data.id}`, data)
  }

  return (
    <MainLayout title="Instructor Assignment">
      <div className="space-y-6">
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

        {filteredInstructors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No instructors found matching your search.</p>
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
  )
}

