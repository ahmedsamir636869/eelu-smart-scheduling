'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Search, Plus, BookOpen } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { CourseCard } from '@/components/data/Courses/CourseCard'
import { CreateCourseModal } from '@/components/data/Courses/CreateCourseModal'
import { EditCourseModal } from '@/components/data/Courses/EditCourseModal'
import { Button } from '@/components/ui/Button'
import { campusApi, courseApi, collegeApi, departmentApi, instructorApi, ApiError } from '@/lib/api'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Course } from '@/types/api'

interface CoursesPageProps {
  params: Promise<{
    branchId: string
  }>
}

export default function CoursesPage({ params }: CoursesPageProps) {
  const { branchId } = use(params)
  const [branchName, setBranchName] = useState(`Branch ${branchId}`)
  const [courses, setCourses] = useState<Course[]>([])
  const [colleges, setColleges] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (branchId) {
      fetchCampusAndCourses()
    }
  }, [branchId])

  const fetchCampusAndCourses = async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch campus info
      const campus = await campusApi.getById(branchId)
      let campusColleges: any[] = []

      if (campus) {
        const displayName = campus.city
          ? `${campus.name} - ${campus.city}`
          : campus.name
        setBranchName(displayName)

        // Fetch colleges for this campus
        if (campus.colleges && campus.colleges.length > 0) {
          campusColleges = campus.colleges
          setColleges(campus.colleges)

          // Fetch departments for all colleges
          const allDepartments: any[] = []
          for (const college of campus.colleges) {
            try {
              const depts = await departmentApi.getAll(college.id)
              allDepartments.push(...depts)
            } catch (err) {
              console.warn(`Failed to fetch departments for college ${college.id}:`, err)
            }
          }
          setDepartments(allDepartments)
        }
      }

      // Fetch all instructors for this campus's departments
      try {
        const instructorsData = await instructorApi.getAll()
        // Filter instructors by campus departments
        if (campusColleges.length > 0) {
          const collegeIds = campusColleges.map(c => c.id)
          // We need to fetch department data to filter properly
          const allDepts: any[] = []
          for (const college of campusColleges) {
            try {
              const depts = await departmentApi.getAll(college.id)
              allDepts.push(...depts)
            } catch (err) {
              // Silently handle
            }
          }
          const deptIds = allDepts.map(d => d.id)
          const filteredInstructors = instructorsData.filter((i: any) =>
            deptIds.includes(i.departmentId)
          )
          setInstructors(filteredInstructors)
        } else {
          setInstructors([])
        }
      } catch (err) {
        console.warn('Failed to fetch instructors:', err)
      }

      // Fetch courses filtered by campus colleges
      const coursesData = await courseApi.getAll()
      console.log('DEBUG: All courses fetched:', coursesData.length)
      console.log('DEBUG: Sample course:', coursesData[0])

      // Filter courses by campus colleges
      let filteredCourses = []
      if (campusColleges.length > 0) {
        const collegeIds = campusColleges.map(c => c.id)
        console.log('DEBUG: Campus college IDs:', collegeIds)
        console.log('DEBUG: Sample course collegeId:', coursesData[0]?.collegeId)

        filteredCourses = coursesData.filter((course: any) =>
          collegeIds.includes(course.collegeId)
        )
        console.log('DEBUG: Filtered courses count:', filteredCourses.length)
      } else {
        console.log('DEBUG: No campus colleges found!')
      }

      setCourses(filteredCourses)
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to load courses. Please try again.'
      setError(errorMessage)
      console.error('Error fetching courses:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredCourses = courses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.department && typeof course.department === 'object' && course.department.name && course.department.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleCreate = () => {
    setIsCreateModalOpen(true)
  }

  const handleEdit = (course: Course) => {
    setSelectedCourse(course)
    setIsEditModalOpen(true)
  }

  const handleCreateSave = async (data: any) => {
    try {
      setError('')
      const newCourse = await courseApi.create(data)
      await fetchCampusAndCourses() // Refresh the list
      setIsCreateModalOpen(false)
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to create course. Please try again.'
      setError(errorMessage)
      throw err
    }
  }

  const handleEditSave = async (id: string, data: any) => {
    try {
      setError('')
      await courseApi.update(id, data)
      await fetchCampusAndCourses() // Refresh the list
      setIsEditModalOpen(false)
      setSelectedCourse(null)
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to update course. Please try again.'
      setError(errorMessage)
      throw err
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return
    }

    try {
      setError('')
      await courseApi.delete(id)
      await fetchCampusAndCourses() // Refresh the list
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to delete course. Please try again.'
      setError(errorMessage)
    }
  }

  return (
    <ProtectedRoute>
      <MainLayout title="Courses Management">
        <div className="space-y-6">
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <div>
            <h1 className="text-white text-2xl font-bold mb-2">Data: Courses Management - {branchName}</h1>
            <Link
              href={`/data/${branchId}`}
              className="text-teal-400 hover:text-teal-300 transition-colors inline-flex items-center gap-2"
            >
              ← Back to Data Management ({branchName})
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-white text-lg sm:text-xl font-bold uppercase">COURSES DIRECTORY</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, code, or department"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 w-full sm:w-64"
                />
              </div>
              <Button
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={handleCreate}
              >
                Add Course
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading courses...</div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">
                {searchQuery ? 'No courses found matching your search.' : 'No courses found.'}
              </p>
              <Button
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={handleCreate}
              >
                Create First Course
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onEdit={() => handleEdit(course)}
                  onDelete={() => handleDelete(course.id)}
                />
              ))}
            </div>
          )}
        </div>

        {isCreateModalOpen && (
          <CreateCourseModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSave={handleCreateSave}
            colleges={colleges}
            departments={departments}
            instructors={instructors}
          />
        )}

        {isEditModalOpen && selectedCourse && (
          <EditCourseModal
            course={selectedCourse}
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false)
              setSelectedCourse(null)
            }}
            onSave={handleEditSave}
            colleges={colleges}
            departments={departments}
            instructors={instructors}
          />
        )}
      </MainLayout>
    </ProtectedRoute>
  )
}

