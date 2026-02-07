'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Save, Plus } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ToggleButton } from '@/components/data/Students/ToggleButton'
import { SectionCard } from '@/components/data/Students/SectionCard'
import { CreateSectionModal } from '@/components/data/Students/CreateSectionModal'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { campusApi, studentGroupApi, collegeApi, departmentApi, ApiError } from '@/lib/api'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

interface StudentsPageProps {
  params: Promise<{
    branchId: string
  }>
}

interface Section {
  id: number
  numberOfStudents: number
  assignedGroup: string
  studentGroupId?: string // Add student group ID for deletion
  department?: {
    id: string
    name: string
    code?: string
  }
  college?: {
    id: string
    name: string
  }
}

export default function StudentsPage({ params }: StudentsPageProps) {
  const { branchId } = use(params)
  const [branchName, setBranchName] = useState(`Branch ${branchId}`)
  const [selectedCollege, setSelectedCollege] = useState<'IT' | 'Business'>('IT')
  const [selectedLevel, setSelectedLevel] = useState<number>(1)
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [colleges, setColleges] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [selectedCollegeObj, setSelectedCollegeObj] = useState<any>(null)
  const [campusData, setCampusData] = useState<any>(null)

  useEffect(() => {
    if (branchId) {
      fetchCampusAndStudentGroups()
    }
  }, [branchId, selectedLevel])

  // Update selected college when colleges change or selection changes
  useEffect(() => {
    if (colleges.length > 0) {
      findAndSetSelectedCollege(colleges)
    }
  }, [colleges, selectedCollege])

  const findAndSetSelectedCollege = async (campusColleges: any[]) => {
    // Find college by name (IT or Business) - try multiple matching strategies
    let college = campusColleges.find((c: any) => 
      c.name.toLowerCase() === selectedCollege.toLowerCase()
    )
    
    // If exact match fails, try partial match
    if (!college) {
      college = campusColleges.find((c: any) => 
        c.name.toLowerCase().includes(selectedCollege.toLowerCase()) ||
        selectedCollege.toLowerCase().includes(c.name.toLowerCase())
      )
    }
    
    // If still not found, try matching common variations
    if (!college) {
      const collegeVariations: Record<string, string[]> = {
        'IT': ['information technology', 'it', 'computer science', 'cs'],
        'Business': ['business', 'commerce', 'management', 'ba']
      }
      
      const variations = collegeVariations[selectedCollege] || []
      college = campusColleges.find((c: any) => 
        variations.some(v => c.name.toLowerCase().includes(v))
      )
    }
    
    setSelectedCollegeObj(college)

    if (college) {
      try {
        // Fetch departments for the college
        const collegeDepartments = await departmentApi.getAll(college.id)
        setDepartments(collegeDepartments)
      } catch (err) {
        console.error('Error fetching departments:', err)
        setDepartments([])
      }
    } else {
      setDepartments([])
      console.warn(`College "${selectedCollege}" not found. Available colleges:`, campusColleges.map((c: any) => c.name))
    }
  }

  const fetchCampusAndStudentGroups = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Fetch campus info (includes colleges)
      const campus = await campusApi.getById(branchId)
      if (campus) {
        const displayName = campus.city 
          ? `${campus.name} - ${campus.city}` 
          : campus.name
        setBranchName(displayName)
        setCampusData(campus)
        
        // If campus has colleges, use them
        if (campus.colleges && campus.colleges.length > 0) {
          setColleges(campus.colleges)
        }
      }

      // Fetch student groups
      const studentGroups = await studentGroupApi.getAll()
      
      // Filter by level and transform to sections
      const filteredGroups = studentGroups.filter((group: any) => group.year === selectedLevel)
      
      const transformedSections: Section[] = filteredGroups.map((group: any, index: number) => ({
        id: index + 1,
        numberOfStudents: group.studentCount || 0,
        assignedGroup: group.name || `Group ${index + 1}`,
        studentGroupId: group.id, // Store the actual student group ID
        department: group.department ? {
          id: group.department.id,
          name: group.department.name,
          code: group.department.code
        } : undefined,
        college: group.department?.college ? {
          id: group.department.college.id,
          name: group.department.college.name
        } : undefined
      }))
      
      setSections(transformedSections)
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to load student groups. Please try again.'
      setError(errorMessage)
      console.error('Error fetching student groups:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStudentsChange = async (sectionNumber: number, value: number) => {
    // Update local state immediately for UI responsiveness
    setSections(sections.map(s => s.id === sectionNumber ? { ...s, numberOfStudents: value } : s))
    
    // Find the corresponding student group and update via API
    // Note: This is a simplified implementation - you may need to map sections to student groups differently
    try {
      const studentGroups = await studentGroupApi.getAll()
      const filteredGroups = studentGroups.filter((group: any) => group.year === selectedLevel)
      const groupToUpdate = filteredGroups[sectionNumber - 1]
      
      if (groupToUpdate) {
        await studentGroupApi.update(groupToUpdate.id, {
          studentCount: value,
        })
      }
    } catch (err) {
      console.error('Error updating student count:', err)
      setError('Failed to update student count')
    }
  }

  const handleGroupChange = async (sectionNumber: number, value: string) => {
    setSections(sections.map(s => s.id === sectionNumber ? { ...s, assignedGroup: value } : s))
    
    // Update student group name via API
    try {
      const studentGroups = await studentGroupApi.getAll()
      const filteredGroups = studentGroups.filter((group: any) => group.year === selectedLevel)
      const groupToUpdate = filteredGroups[sectionNumber - 1]
      
      if (groupToUpdate) {
        await studentGroupApi.update(groupToUpdate.id, {
          name: value,
        })
      }
    } catch (err) {
      console.error('Error updating group name:', err)
      setError('Failed to update group name')
    }
  }

  const handleDelete = async (sectionNumber: number) => {
    const section = sections.find(s => s.id === sectionNumber)
    if (!section) {
      return
    }

    if (!confirm(`Are you sure you want to delete section "${section.assignedGroup}"? This will permanently remove the student group.`)) {
      return
    }

    try {
      setError('')
      
      // If we have the student group ID, use it; otherwise find it
      let studentGroupId = section.studentGroupId
      
      if (!studentGroupId) {
        // Fetch student groups and find the matching one
        const studentGroups = await studentGroupApi.getAll()
        const filteredGroups = studentGroups.filter((group: any) => group.year === selectedLevel)
        const groupToDelete = filteredGroups[sectionNumber - 1]
        
        if (!groupToDelete) {
          throw new Error('Student group not found')
        }
        
        studentGroupId = groupToDelete.id
      }

      // Delete the student group
      await studentGroupApi.delete(studentGroupId)
      
      // Refresh the sections list
      await fetchCampusAndStudentGroups()
      
      // Recalculate total enrollment after deleting a section
      const allStudentGroups = await studentGroupApi.getAll()
      if (campusData?.colleges && campusData.colleges.length > 0) {
        const collegeIds = campusData.colleges.map((c: any) => c.id)
        const filteredGroups = allStudentGroups.filter((group: any) => 
          group.department?.college && collegeIds.includes(group.department.college.id)
        )
        const total = filteredGroups.reduce((sum: number, group: any) => 
          sum + (group.studentCount || 0), 0
        )
        setTotalBranchEnrollment(total)
      }
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to delete section. Please try again.'
      setError(errorMessage)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      // Changes are already saved individually, so this is just a confirmation
      console.log('All changes saved')
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to save changes. Please try again.'
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleCreateSection = async (data: {
    sectionNumber: number
    numberOfStudents: number
    assignedGroup: string
    level: number
    college: string
  }) => {
    try {
      setError('')
      
      // Use the already selected college object if available, otherwise search
      let collegeObj = selectedCollegeObj
      
      // If we don't have the selected college or it doesn't match, search for it
      if (!collegeObj || collegeObj.name.toLowerCase() !== data.college.toLowerCase()) {
        // Refresh colleges list to ensure we have the latest data
        const campusColleges = await collegeApi.getAll(branchId)
        
        // Find college by name - try multiple matching strategies
        collegeObj = campusColleges.find((c: any) => 
          c.name.toLowerCase() === data.college.toLowerCase()
        )
        
        // If exact match fails, try partial match
        if (!collegeObj) {
          collegeObj = campusColleges.find((c: any) => 
            c.name.toLowerCase().includes(data.college.toLowerCase()) ||
            data.college.toLowerCase().includes(c.name.toLowerCase())
          )
        }
        
        // If still not found, try matching common variations
        if (!collegeObj) {
          const collegeVariations: Record<string, string[]> = {
            'IT': ['information technology', 'it', 'computer science', 'cs'],
            'Business': ['business', 'commerce', 'management', 'ba']
          }
          
          const variations = collegeVariations[data.college] || []
          collegeObj = campusColleges.find((c: any) => 
            variations.some(v => c.name.toLowerCase().includes(v))
          )
        }
      }
      
      if (!collegeObj) {
        const campusColleges = await collegeApi.getAll(branchId)
        const availableColleges = campusColleges.map((c: any) => c.name).join(', ') || 'None'
        throw new Error(
          `College "${data.college}" not found. Available colleges: ${availableColleges}. Please create the college first or select a different one.`
        )
      }

      // Get departments for the college
      console.log(`Fetching departments for college: ${collegeObj.name} (${collegeObj.id})`)
      const collegeDepartments = await departmentApi.getAll(collegeObj.id)
      console.log(`Found ${collegeDepartments.length} departments:`, collegeDepartments)
      
      if (collegeDepartments.length === 0) {
        throw new Error(
          `No departments found for "${collegeObj.name}" college. Please go back to the data management page and create a department for this college, or create a new branch with departments included.`
        )
      }

      // Use the first department (or you could let user select)
      const departmentId = collegeDepartments[0].id

      // Create student group
      const newGroup = await studentGroupApi.create({
        name: data.assignedGroup,
        year: data.level,
        studentCount: data.numberOfStudents,
        departmentId: departmentId,
      })

      // Refresh the sections list
      await fetchCampusAndStudentGroups()
      
      // Recalculate total enrollment after creating a new section
      const allStudentGroups = await studentGroupApi.getAll()
      if (campusData?.colleges && campusData.colleges.length > 0) {
        const collegeIds = campusData.colleges.map((c: any) => c.id)
        const filteredGroups = allStudentGroups.filter((group: any) => 
          group.department?.college && collegeIds.includes(group.department.college.id)
        )
        const total = filteredGroups.reduce((sum: number, group: any) => 
          sum + (group.studentCount || 0), 0
        )
        setTotalBranchEnrollment(total)
      }
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Failed to create section. Please try again.'
      setError(errorMessage)
      console.error('Error creating section:', err)
      throw err
    }
  }

  // Calculate total enrollment for ALL students across ALL colleges and levels for this branch
  const [totalBranchEnrollment, setTotalBranchEnrollment] = useState<number>(0)

  useEffect(() => {
    const calculateTotalEnrollment = async () => {
      try {
        // Fetch ALL student groups (not filtered by college/level)
        const allStudentGroups = await studentGroupApi.getAll()
        
        // Filter by campus colleges if available
        let filteredGroups = allStudentGroups
        if (campusData?.colleges && campusData.colleges.length > 0) {
          const collegeIds = campusData.colleges.map((c: any) => c.id)
          filteredGroups = allStudentGroups.filter((group: any) => 
            group.department?.college && collegeIds.includes(group.department.college.id)
          )
        }
        
        // Sum all student counts
        const total = filteredGroups.reduce((sum: number, group: any) => 
          sum + (group.studentCount || 0), 0
        )
        setTotalBranchEnrollment(total)
      } catch (err) {
        console.error('Error calculating total enrollment:', err)
        // Fallback to current sections total
        setTotalBranchEnrollment(sections.reduce((sum, section) => sum + section.numberOfStudents, 0))
      }
    }

    if (branchId && campusData) {
      calculateTotalEnrollment()
    } else if (branchId) {
      // If campusData is not loaded yet, calculate from current sections as fallback
      setTotalBranchEnrollment(sections.reduce((sum, section) => sum + section.numberOfStudents, 0))
    }
  }, [branchId, campusData])

  // Current filtered enrollment (for display purposes)
  const currentEnrollment = sections.reduce((sum, section) => sum + section.numberOfStudents, 0)

  return (
    <ProtectedRoute>
      <MainLayout title={`Data: Students' Data - ${branchName}`}>
        <div className="space-y-4 sm:space-y-6">
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <Link
            href={`/data/${branchId}`}
            className="text-teal-400 hover:text-teal-300 transition-colors inline-flex items-center gap-2 text-sm sm:text-base"
          >
            ← Back to Data Management ({branchName})
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h2 className="text-white text-lg sm:text-xl font-bold mb-2">Students' Data</h2>
            </div>
            <Card className="bg-gray-800 w-full sm:w-auto">
              <p className="text-gray-400 text-xs sm:text-sm mb-1">TOTAL BRANCH ENROLLMENT</p>
              <p className="text-blue-400 text-xl sm:text-2xl font-bold">{totalBranchEnrollment} Students</p>
            </Card>
          </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-white font-medium mb-3 text-sm sm:text-base">SELECT COLLEGE</h3>
            <div className="flex flex-wrap gap-2">
              <ToggleButton
                label="IT"
                isSelected={selectedCollege === 'IT'}
                onClick={() => setSelectedCollege('IT')}
              />
              <ToggleButton
                label="Business"
                isSelected={selectedCollege === 'Business'}
                onClick={() => setSelectedCollege('Business')}
              />
            </div>
          </div>

          <div>
            <h3 className="text-white font-medium mb-3 text-sm sm:text-base">ACADEMIC LEVEL</h3>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((level) => (
                <ToggleButton
                  key={level}
                  label={`Level ${level}`}
                  isSelected={selectedLevel === level}
                  onClick={() => setSelectedLevel(level)}
                />
              ))}
            </div>
          </div>
        </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading student groups...</div>
          ) : (
            <>
              {!selectedCollegeObj && colleges.length > 0 && (
                <div className="p-3 bg-yellow-900/50 border border-yellow-700 rounded-lg text-yellow-200 text-sm mb-4">
                  <p className="font-medium mb-1">College "{selectedCollege}" not found</p>
                  <p className="text-xs">
                    Available colleges: {colleges.map((c: any) => c.name).join(', ') || 'None'}
                  </p>
                  <p className="text-xs mt-1">
                    Please create a college named "{selectedCollege}" or select a different college.
                  </p>
                </div>
              )}
              
              {colleges.length === 0 && (
                <div className="p-3 bg-yellow-900/50 border border-yellow-700 rounded-lg text-yellow-200 text-sm mb-4">
                  <p className="font-medium mb-1">No colleges found for this campus</p>
                  <p className="text-xs">
                    Please create a new campus with colleges selected, or contact an administrator to add colleges to this campus.
                  </p>
                  <Link 
                    href="/data"
                    className="text-yellow-300 hover:text-yellow-100 text-xs underline mt-2 inline-block"
                  >
                    ← Go to Data Management
                  </Link>
                </div>
              )}

              {selectedCollegeObj && departments.length === 0 && (
                <div className="p-3 bg-yellow-900/50 border border-yellow-700 rounded-lg text-yellow-200 text-sm mb-4">
                  <p className="font-medium mb-1">No departments found for "{selectedCollegeObj.name}" college</p>
                  <p className="text-xs">
                    To add sections, you need to create at least one department for this college first.
                  </p>
                  <p className="text-xs mt-1">
                    Go to the Data Management page and create a new branch with departments, or contact an administrator to add departments to this college.
                  </p>
                  <Link 
                    href="/data"
                    className="text-yellow-300 hover:text-yellow-100 text-xs underline mt-2 inline-block"
                  >
                    ← Go to Data Management
                  </Link>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium text-sm sm:text-base">
                  Sections ({sections.length})
                </h3>
                <Button
                  variant="success"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    if (!selectedCollegeObj) {
                      setError(`College "${selectedCollege}" not found. Please create it first in the data management section.`)
                      return
                    }
                    if (departments.length === 0) {
                      setError(`No departments found for "${selectedCollegeObj.name}" college. Please create a department first.`)
                      return
                    }
                    setIsModalOpen(true)
                  }}
                >
                  Add Section
                </Button>
              </div>

              {sections.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No sections found for {selectedCollege} Level {selectedLevel}. Click "Add Section" to create one.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sections.map((section) => (
                      <SectionCard
                        key={section.id}
                        sectionNumber={section.id}
                        numberOfStudents={section.numberOfStudents}
                        assignedGroup={section.assignedGroup}
                        college={section.college?.name || selectedCollege}
                        level={selectedLevel}
                        department={section.department?.name}
                        onStudentsChange={handleStudentsChange}
                        onGroupChange={handleGroupChange}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      variant="primary" 
                      icon={<Save className="w-4 h-4" />} 
                      onClick={handleSave} 
                      className="w-full sm:w-auto"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </>
              )}
            </>
          )}

          <CreateSectionModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onCreate={handleCreateSection}
            selectedCollege={selectedCollege}
            selectedLevel={selectedLevel}
          />
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}

