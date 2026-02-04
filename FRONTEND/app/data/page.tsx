'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { BranchCard } from '@/components/data/BranchCard'
import { ImportDataCard } from '@/components/data/ImportDataCard'
import { SystemConfigCard } from '@/components/data/SystemConfigCard'
import { CreateBranchModal } from '@/components/data/CreateBranchModal'
import { EditBranchModal } from '@/components/data/EditBranchModal'
import { Button } from '@/components/ui/Button'
import { Branch } from '@/types/api'
import { campusApi, collegeApi, departmentApi, ApiError } from '@/lib/api'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function DataPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCampuses()
  }, [])

  const fetchCampuses = async () => {
    try {
      setLoading(true)
      setError('')
      console.log('Fetching campuses from API...')
      let campuses = await campusApi.getAll()
      console.log('Fetched campuses (raw):', campuses)
      
      // Handle different response formats
      if (!Array.isArray(campuses)) {
        // If it's an object with a campuses property
        if (campuses && typeof campuses === 'object' && 'campuses' in campuses) {
          campuses = (campuses as any).campuses
        }
        // If it's still not an array, try to extract from data property
        else if (campuses && typeof campuses === 'object' && 'data' in campuses) {
          campuses = (campuses as any).data
        }
        // If still not an array, log and throw error
        if (!Array.isArray(campuses)) {
          console.error('Campuses is not an array:', campuses)
          throw new Error(`Invalid response format: expected an array, got ${typeof campuses}`)
        }
      }
      
      // Transform backend campus format to frontend Branch format
      // Colleges are now included in the campus response from backend
      const transformedBranches: Branch[] = campuses.map((campus: any) => ({
        id: campus.id,
        name: campus.city ? `${campus.name} - ${campus.city}` : campus.name,
        city: campus.city || '',
        colleges: campus.colleges || [],
        collegeCount: campus.colleges?.length || 0,
      }))
      
      setBranches(transformedBranches)
    } catch (err) {
      console.error('Error fetching campuses:', err)
      let errorMessage = 'Failed to load campuses. Please try again.'
      
      if (err instanceof ApiError) {
        errorMessage = err.message
        // Add more context for network errors
        if (err.status === 0) {
          errorMessage = `${err.message}. Make sure the backend server is running.`
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBranch = async (data: { 
    name: string
    city: string
    colleges?: Array<{ name: string; departments: Array<{ name: string; code: string }> }>
  }) => {
    try {
      setError('')
      
      // First create the campus
      const newCampus = await campusApi.create({
        name: data.name,
        city: data.city,
        colleges: data.colleges?.map(c => c.name), // Send college names for campus creation
      })
      
      console.log('Campus created successfully:', newCampus)
      
      // Then create departments for each college
      if (data.colleges && data.colleges.length > 0) {
        for (const collegeData of data.colleges) {
          // Wait a bit for colleges to be available
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Find the created college by name
          const colleges = await collegeApi.getAll(newCampus.id)
          console.log('Available colleges:', colleges.map((c: any) => ({ id: c.id, name: c.name })))
          const college = colleges.find((c: any) => c.name === collegeData.name)
          
          if (!college) {
            console.warn(`College "${collegeData.name}" not found after creation`)
            continue
          }
          
          if (collegeData.departments.length > 0) {
            // Create departments for this college
            for (const dept of collegeData.departments) {
              try {
                console.log(`Creating department ${dept.name} for college ${college.name} (${college.id})`)
                const createdDept = await departmentApi.create({
                  name: dept.name,
                  code: dept.code,
                  collegeId: college.id,
                })
                console.log(`Department created successfully:`, createdDept)
              } catch (deptErr) {
                console.error(`Error creating department ${dept.name}:`, deptErr)
                // Continue with other departments even if one fails
              }
            }
          } else {
            console.log(`No departments to create for college ${collegeData.name}`)
          }
        }
      }
      
      // Close modal first
      setIsModalOpen(false)
      
      // Then refresh the campuses list
      await fetchCampuses()
    } catch (err) {
      console.error('Error creating campus:', err)
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to create campus. Please try again.'
      setError(errorMessage)
      throw err // Re-throw to let modal handle it
    }
  }

  const handleUpdateBranch = async (data: { 
    id: string
    name: string
    city: string
    colleges?: Array<{ id?: string; name: string; departments: Array<{ id?: string; name: string; code: string }> }>
  }) => {
    try {
      setError('')
      
      // Update campus basic info
      await campusApi.update(data.id, {
        name: data.name,
        city: data.city,
      })
      
      console.log('Campus updated successfully')
      
      // Handle colleges and departments
      if (data.colleges && data.colleges.length > 0) {
        // Get current colleges
        const currentColleges = await collegeApi.getAll(data.id)
        
        // Process each college in the update
        for (const collegeData of data.colleges) {
          // Check if college already exists
          let college = currentColleges.find((c: any) => c.id === collegeData.id)
          
          if (!college) {
            // Create new college if it doesn't exist
            const newCollege = await collegeApi.create({
              name: collegeData.name,
              campusId: data.id,
            })
            college = newCollege
          }
          
          // Get current departments for this college
          const currentDepartments = await departmentApi.getAll(college.id)
          
          // Process departments
          for (const dept of collegeData.departments) {
            // Check if department already exists
            const existingDept = currentDepartments.find((d: any) => d.id === dept.id)
            
            if (!existingDept) {
              // Create new department
              try {
                await departmentApi.create({
                  name: dept.name,
                  code: dept.code,
                  collegeId: college.id,
                })
              } catch (deptErr) {
                console.error(`Error creating department ${dept.name}:`, deptErr)
              }
            } else {
              // Update existing department if needed
              if (existingDept.name !== dept.name || existingDept.code !== dept.code) {
                try {
                  await departmentApi.update(existingDept.id, {
                    name: dept.name,
                    code: dept.code,
                  })
                } catch (deptErr) {
                  console.error(`Error updating department ${dept.name}:`, deptErr)
                }
              }
            }
          }
          
          // Remove departments that are no longer in the list
          const deptIdsToKeep = collegeData.departments
            .map(d => d.id)
            .filter((id): id is string => id !== undefined)
          
          for (const currentDept of currentDepartments) {
            if (!deptIdsToKeep.includes(currentDept.id)) {
              try {
                await departmentApi.delete(currentDept.id)
              } catch (deptErr) {
                console.error(`Error deleting department ${currentDept.name}:`, deptErr)
              }
            }
          }
        }
        
        // Remove colleges that are no longer in the list
        const collegeIdsToKeep = data.colleges
          .map(c => c.id)
          .filter((id): id is string => id !== undefined)
        
        for (const currentCollege of currentColleges) {
          if (!collegeIdsToKeep.includes(currentCollege.id)) {
            try {
              await collegeApi.delete(currentCollege.id)
            } catch (collegeErr) {
              console.error(`Error deleting college ${currentCollege.name}:`, collegeErr)
            }
          }
        }
      }
      
      // Close modal first
      setIsEditModalOpen(false)
      setEditingBranch(null)
      
      // Then refresh the campuses list
      await fetchCampuses()
    } catch (err) {
      console.error('Error updating campus:', err)
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to update campus. Please try again.'
      setError(errorMessage)
      throw err // Re-throw to let modal handle it
    }
  }

  return (
    <ProtectedRoute>
      <MainLayout title="Data">
        <div className="space-y-4 sm:space-y-6">
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-white text-lg sm:text-xl font-bold mb-2">SELECT BRANCH FOR DATA MANAGEMENT</h2>
              <p className="text-gray-400 text-xs sm:text-sm">
                Select a campus below to manage its specific data inputs (Physical Data, Instruction, Uploads).
              </p>
            </div>
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsModalOpen(true)}
              className="flex-shrink-0"
            >
              Create Branch
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading campuses...</div>
          ) : branches.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No campuses found. Create your first campus above.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {branches.map((branch) => (
                <BranchCard 
                  key={branch.id} 
                  branch={branch}
                  onEdit={(branch) => {
                    setEditingBranch(branch)
                    setIsEditModalOpen(true)
                  }}
                />
              ))}
            </div>
          )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
          <ImportDataCard />
          <SystemConfigCard />
        </div>
      </div>

      <CreateBranchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateBranch}
      />

      <EditBranchModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingBranch(null)
        }}
        branch={editingBranch}
        onUpdate={handleUpdateBranch}
      />
    </MainLayout>
    </ProtectedRoute>
  )
}

