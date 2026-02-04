'use client'

import { useState } from 'react'
import { X, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

interface CreateSectionModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: {
    sectionNumber: number
    numberOfStudents: number
    assignedGroup: string
    level: number
    college: string
  }) => Promise<void>
  selectedCollege: 'IT' | 'Business'
  selectedLevel: number
}

const groups = ['Group A', 'Group B', 'Group C', 'Group D', 'Group E', 'Group F']

export function CreateSectionModal({
  isOpen,
  onClose,
  onCreate,
  selectedCollege,
  selectedLevel,
}: CreateSectionModalProps) {
  const [sectionNumber, setSectionNumber] = useState(1)
  const [numberOfStudents, setNumberOfStudents] = useState(25)
  const [assignedGroup, setAssignedGroup] = useState('Group A')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleGroupIncrement = () => {
    const currentIndex = groups.indexOf(assignedGroup)
    const nextIndex = (currentIndex + 1) % groups.length
    setAssignedGroup(groups[nextIndex])
  }

  const handleGroupDecrement = () => {
    const currentIndex = groups.indexOf(assignedGroup)
    const prevIndex = currentIndex <= 0 ? groups.length - 1 : currentIndex - 1
    setAssignedGroup(groups[prevIndex])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (sectionNumber < 1) {
      setError('Section number must be at least 1')
      return
    }

    if (numberOfStudents < 1) {
      setError('Number of students must be at least 1')
      return
    }

    try {
      setLoading(true)
      await onCreate({
        sectionNumber,
        numberOfStudents,
        assignedGroup,
        level: selectedLevel,
        college: selectedCollege,
      })
      // Reset form
      setSectionNumber(1)
      setNumberOfStudents(25)
      setAssignedGroup('Group A')
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create section. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSectionNumber(1)
    setNumberOfStudents(25)
    setAssignedGroup('Group A')
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700">
          <div className="flex items-center gap-2 sm:gap-3">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400 flex-shrink-0" />
            <h2 className="text-white font-bold text-lg sm:text-xl">Create New Section</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-xs mb-1">College & Level</p>
            <p className="text-white font-medium">
              {selectedCollege} - Level {selectedLevel}
            </p>
          </div>

          <div>
            <label className="text-gray-400 text-sm font-medium mb-2 block">
              Section Number
            </label>
            <Input
              type="number"
              value={sectionNumber}
              onChange={(e) => setSectionNumber(parseInt(e.target.value) || 1)}
              min={1}
              required
              className="w-full"
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm font-medium mb-2 block">
              Number of Students
            </label>
            <Input
              type="number"
              value={numberOfStudents}
              onChange={(e) => setNumberOfStudents(parseInt(e.target.value) || 0)}
              onIncrement={() => setNumberOfStudents(numberOfStudents + 1)}
              onDecrement={() => setNumberOfStudents(Math.max(1, numberOfStudents - 1))}
              min={1}
              required
              className="w-full"
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm font-medium mb-2 block">
              Assigned Group
            </label>
            <Input
              type="text"
              value={assignedGroup}
              readOnly
              onIncrement={handleGroupIncrement}
              onDecrement={handleGroupDecrement}
              className="w-full cursor-pointer"
              disabled={loading}
            />
            <p className="text-gray-500 text-xs mt-1">
              Use arrows to change group
            </p>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-700">
            <Button variant="secondary" onClick={handleClose} type="button" className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="w-full sm:w-auto" disabled={loading}>
              {loading ? 'Creating...' : 'Create Section'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

