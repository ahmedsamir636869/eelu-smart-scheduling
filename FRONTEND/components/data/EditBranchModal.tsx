'use client'

import { useState, useEffect } from 'react'
import { X, MapPin, Plus, GraduationCap, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { campusApi, collegeApi, departmentApi } from '@/lib/api'
import { Branch } from '@/types/api'

interface CollegeWithDepartments {
  id?: string
  name: string
  departments: { id?: string; name: string; code: string }[]
}

interface EditBranchModalProps {
  isOpen: boolean
  onClose: () => void
  branch: Branch | null
  onUpdate: (data: { 
    id: string
    name: string
    city: string
    colleges?: CollegeWithDepartments[]
  }) => Promise<void>
}

const commonColleges = ['IT', 'Business', 'Engineering', 'Medicine', 'Arts', 'Science']

export function EditBranchModal({ isOpen, onClose, branch, onUpdate }: EditBranchModalProps) {
  const [branchName, setBranchName] = useState('')
  const [city, setCity] = useState('')
  const [colleges, setColleges] = useState<CollegeWithDepartments[]>([])
  const [collegeInput, setCollegeInput] = useState('')
  const [expandedCollege, setExpandedCollege] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState('')

  // Load branch data when modal opens
  useEffect(() => {
    if (isOpen && branch) {
      loadBranchData()
    }
  }, [isOpen, branch])

  const loadBranchData = async () => {
    if (!branch) return

    try {
      setFetching(true)
      setError('')
      
      // Set basic info
      setBranchName(branch.name.split(' - ')[0] || branch.name)
      setCity(branch.city || '')

      // Fetch full campus data with colleges
      const campus = await campusApi.getById(branch.id)
      
      if (campus && campus.colleges) {
        // Load departments for each college
        const collegesWithDepts: CollegeWithDepartments[] = await Promise.all(
          campus.colleges.map(async (college: any) => {
            try {
              if (!college.id) {
                console.warn(`College ${college.name} has no ID`)
                return {
                  id: college.id,
                  name: college.name,
                  departments: []
                }
              }
              
              console.log(`Loading departments for college: ${college.name} (${college.id})`)
              const departments = await departmentApi.getAll(college.id)
              console.log(`Found ${departments?.length || 0} departments for ${college.name}`)
              
              // Ensure departments is an array
              const deptArray = Array.isArray(departments) ? departments : []
              
              return {
                id: college.id,
                name: college.name,
                departments: deptArray.map((dept: any) => ({
                  id: dept.id,
                  name: dept.name,
                  code: dept.code || '',
                }))
              }
            } catch (err: any) {
              console.error(`Error loading departments for ${college.name} (${college.id}):`, err)
              // If it's a 404, validation error, or "not found" message, that's okay - just return empty array
              // This happens when a college has no departments yet
              if (
                err?.status === 404 || 
                err?.status === 400 ||
                err?.message?.toLowerCase().includes('not found') ||
                err?.message?.toLowerCase().includes('failed to find')
              ) {
                console.log(`No departments found for ${college.name} - this is normal if none exist yet`)
                return {
                  id: college.id,
                  name: college.name,
                  departments: []
                }
              }
              // For other errors, still return the college but log the error
              console.warn(`Could not load departments for ${college.name}, continuing with empty list`)
              return {
                id: college.id,
                name: college.name,
                departments: []
              }
            }
          })
        )
        
        setColleges(collegesWithDepts)
      } else {
        setColleges([])
      }
    } catch (err) {
      console.error('Error loading branch data:', err)
      setError('Failed to load branch data. Please try again.')
    } finally {
      setFetching(false)
    }
  }

  if (!isOpen) return null

  const handleAddCollege = () => {
    const college = collegeInput.trim()
    if (college && !colleges.find(c => c.name === college)) {
      setColleges([...colleges, { name: college, departments: [] }])
      setCollegeInput('')
      setExpandedCollege(college)
    }
  }

  const handleRemoveCollege = (collegeToRemove: string) => {
    setColleges(colleges.filter(c => c.name !== collegeToRemove))
    if (expandedCollege === collegeToRemove) {
      setExpandedCollege(null)
    }
  }

  const handleAddCommonCollege = (college: string) => {
    if (!colleges.find(c => c.name === college)) {
      setColleges([...colleges, { name: college, departments: [] }])
      setExpandedCollege(college)
    }
  }

  const handleAddDepartment = (collegeName: string, deptName: string, deptCode: string) => {
    if (!deptName.trim() || !deptCode.trim()) return
    
    setColleges(colleges.map(college => 
      college.name === collegeName
        ? {
            ...college,
            departments: [
              ...college.departments,
              { name: deptName.trim(), code: deptCode.trim() }
            ]
          }
        : college
    ))
  }

  const handleRemoveDepartment = (collegeName: string, deptIndex: number) => {
    setColleges(colleges.map(college => 
      college.name === collegeName
        ? {
            ...college,
            departments: college.departments.filter((_, i) => i !== deptIndex)
          }
        : college
    ))
  }

  const toggleCollegeExpansion = (collegeName: string) => {
    setExpandedCollege(expandedCollege === collegeName ? null : collegeName)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!branch) return
    
    if (!branchName.trim() || !city.trim()) {
      setError('Branch name and city are required')
      return
    }

    try {
      setLoading(true)
      await onUpdate({
        id: branch.id,
        name: branchName.trim(),
        city: city.trim(),
        colleges: colleges.length > 0 ? colleges : undefined,
      })
      // Reset form
      setBranchName('')
      setCity('')
      setColleges([])
      setCollegeInput('')
      setExpandedCollege(null)
      onClose()
    } catch (err) {
      // Error is handled by parent component
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setBranchName('')
    setCity('')
    setColleges([])
    setCollegeInput('')
    setExpandedCollege(null)
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700">
          <div className="flex items-center gap-2 sm:gap-3">
            <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400 flex-shrink-0" />
            <h2 className="text-white font-bold text-lg sm:text-xl">Edit Branch</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        {fetching ? (
          <div className="p-8 text-center text-gray-400">Loading branch data...</div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {error && (
              <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="text-gray-400 text-sm font-medium mb-2 block">
                Branch Name
              </label>
              <Input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="e.g., Branch 15"
                required
                className="w-full"
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm font-medium mb-2 block">
                City
              </label>
              <Input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Cairo"
                required
                className="w-full"
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm font-medium mb-2 block flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Colleges
              </label>
              
              {/* Quick add common colleges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {commonColleges.map((college) => (
                  <button
                    key={college}
                    type="button"
                    onClick={() => handleAddCommonCollege(college)}
                    disabled={colleges.find(c => c.name === college) !== undefined}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                      colleges.find(c => c.name === college)
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
                    )}
                  >
                    {college}
                  </button>
                ))}
              </div>

              {/* Add custom college */}
              <div className="flex gap-2 mb-3">
                <Input
                  type="text"
                  value={collegeInput}
                  onChange={(e) => setCollegeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCollege()
                    }
                  }}
                  placeholder="Type college name and press Enter"
                  className="flex-1"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="secondary"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={handleAddCollege}
                  disabled={!collegeInput.trim() || colleges.find(c => c.name === collegeInput.trim()) !== undefined || loading}
                >
                  Add
                </Button>
              </div>

              {/* Display selected colleges with departments */}
              {colleges.length > 0 ? (
                <div className="space-y-3">
                  {colleges.map((college) => (
                    <CollegeDepartmentCard
                      key={college.id || college.name}
                      college={college}
                      isExpanded={expandedCollege === college.name}
                      onToggle={() => toggleCollegeExpansion(college.name)}
                      onAddDepartment={handleAddDepartment}
                      onRemoveDepartment={handleRemoveDepartment}
                      onRemoveCollege={handleRemoveCollege}
                      disabled={loading}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 min-h-[60px] flex items-center">
                  <p className="text-gray-500 text-sm">No colleges added yet</p>
                </div>
              )}
              
              {colleges.length === 0 && (
                <p className="text-gray-500 text-xs mt-1">Colleges are optional and can be added later</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-700">
              <Button variant="secondary" onClick={handleClose} type="button" className="w-full sm:w-auto" disabled={loading}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" className="w-full sm:w-auto" disabled={loading || fetching}>
                {loading ? 'Updating...' : 'Update Branch'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

interface CollegeDepartmentCardProps {
  college: CollegeWithDepartments
  isExpanded: boolean
  onToggle: () => void
  onAddDepartment: (collegeName: string, deptName: string, deptCode: string) => void
  onRemoveDepartment: (collegeName: string, deptIndex: number) => void
  onRemoveCollege: (collegeName: string) => void
  disabled?: boolean
}

function CollegeDepartmentCard({
  college,
  isExpanded,
  onToggle,
  onAddDepartment,
  onRemoveDepartment,
  onRemoveCollege,
  disabled,
}: CollegeDepartmentCardProps) {
  const [deptName, setDeptName] = useState('')
  const [deptCode, setDeptCode] = useState('')

  const handleAddDept = () => {
    if (deptName.trim() && deptCode.trim()) {
      onAddDepartment(college.name, deptName, deptCode)
      setDeptName('')
      setDeptCode('')
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* College Header */}
      <div className="flex items-center justify-between p-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2 flex-1 text-left hover:text-teal-400 transition-colors"
          disabled={disabled}
        >
          <GraduationCap className="w-4 h-4 text-teal-400" />
          <span className="font-medium text-white">{college.name}</span>
          <span className="text-gray-400 text-xs">
            ({college.departments.length} {college.departments.length === 1 ? 'department' : 'departments'})
          </span>
          <span className="ml-auto text-gray-400">
            {isExpanded ? '▼' : '▶'}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onRemoveCollege(college.name)}
          className="text-gray-400 hover:text-red-400 transition-colors ml-2"
          disabled={disabled}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Expanded Departments Section */}
      {isExpanded && (
        <div className="border-t border-gray-700 p-3 space-y-3">
          {/* Add Department Form */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400 text-xs font-medium">Add Department</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="text"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                placeholder="Department name"
                className="text-sm"
                disabled={disabled}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddDept()
                  }
                }}
              />
              <Input
                type="text"
                value={deptCode}
                onChange={(e) => setDeptCode(e.target.value)}
                placeholder="Code (e.g., CS)"
                className="text-sm"
                disabled={disabled}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddDept()
                  }
                }}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              icon={<Plus className="w-3 h-3" />}
              onClick={handleAddDept}
              disabled={!deptName.trim() || !deptCode.trim() || disabled}
              className="w-full text-xs"
            >
              Add Department
            </Button>
          </div>

          {/* Departments List */}
          {college.departments.length > 0 ? (
            <div className="space-y-2">
              <span className="text-gray-400 text-xs font-medium">Departments:</span>
              <div className="flex flex-wrap gap-2">
                {college.departments.map((dept, index) => (
                  <Badge
                    key={dept.id || index}
                    variant="published"
                    className="flex items-center gap-2 pr-2"
                  >
                    <span className="text-xs">{dept.name} ({dept.code})</span>
                    <button
                      type="button"
                      onClick={() => onRemoveDepartment(college.name, index)}
                      className="hover:text-red-400 transition-colors"
                      disabled={disabled}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-xs">No departments added yet</p>
          )}
        </div>
      )}
    </div>
  )
}

