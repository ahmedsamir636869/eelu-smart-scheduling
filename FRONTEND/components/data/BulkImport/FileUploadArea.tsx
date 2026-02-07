'use client'

import { useState, useRef, DragEvent } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface FileUploadAreaProps {
  onFileSelect: (file: File) => void
  acceptedTypes?: string[]
  disabled?: boolean
}

export function FileUploadArea({ onFileSelect, acceptedTypes = ['.xlsx', '.csv', '.json'], disabled = false }: FileUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      onFileSelect(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onFileSelect(files[0])
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'border-2 border-dashed rounded-lg p-6 sm:p-12 text-center transition-colors',
        isDragging ? 'border-teal-500 bg-teal-500/10' : 'border-gray-700 bg-gray-800/50'
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
      />
      <div className="flex flex-col items-center gap-4">
        <div className="text-teal-400">
          <Upload className="w-12 h-12 sm:w-16 sm:h-16" />
        </div>
        <div>
          <p className="text-white text-base sm:text-lg font-medium mb-2">Upload Data File</p>
          <p className="text-gray-400 text-xs sm:text-sm mb-4">Drag and drop your data file here.</p>
          <Button variant="primary" onClick={handleBrowseClick} className="w-full sm:w-auto" disabled={disabled}>
            {disabled ? 'Processing...' : 'Browse Files'}
          </Button>
        </div>
      </div>
    </div>
  )
}

