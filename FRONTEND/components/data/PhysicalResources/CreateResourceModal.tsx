'use client'

import { useState } from 'react'
import { X, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface CreateResourceModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: { name: string; capacity: number }) => Promise<void>
  resourceType: 'lab' | 'room'
}

export function CreateResourceModal({ isOpen, onClose, onCreate, resourceType }: CreateResourceModalProps) {
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState(25)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      try {
        setIsSubmitting(true)
        await onCreate({
          name: name.trim(),
          capacity,
        })
        setName('')
        setCapacity(25)
        // onClose is called by the parent after success, or we can close it here
        // If the parent handles errors by throwing, we won't close on error
      } catch (error) {
        // Error handling is done by parent (showing message)
        // We just stop loading
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleClose = () => {
    if (isSubmitting) return
    setName('')
    setCapacity(25)
    onClose()
  }

  const resourceLabel = resourceType === 'lab' ? 'Lab' : 'Lecture Room'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700">
          <div className="flex items-center gap-2 sm:gap-3">
            <Monitor className="w-5 h-5 sm:w-6 sm:h-6 text-teal-400 flex-shrink-0" />
            <h2 className="text-white font-bold text-lg sm:text-xl">Create New {resourceLabel}</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0 disabled:opacity-50"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div>
            <label className="text-gray-400 text-sm font-medium mb-2 block">
              {resourceLabel} Name
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={resourceType === 'lab' ? 'e.g., Lab 3' : 'e.g., Room 6'}
              required
              disabled={isSubmitting}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm font-medium mb-2 block">
              Seat Capacity
            </label>
            <Input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
              min="1"
              required
              disabled={isSubmitting}
              className="w-full"
            />
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-700">
            <Button
              variant="secondary"
              onClick={handleClose}
              type="button"
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : `Create ${resourceLabel}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

