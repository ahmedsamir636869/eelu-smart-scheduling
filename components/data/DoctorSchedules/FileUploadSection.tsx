'use client'

import { useRef } from 'react'
import { Upload } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface FileUploadSectionProps {
  onFileSelect: (file: File) => void
}

export function FileUploadSection({ onFileSelect }: FileUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onFileSelect(files[0])
    }
  }

  const handleChooseFile = () => {
    fileInputRef.current?.click()
  }

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="p-3 bg-green-500/20 rounded-lg flex-shrink-0">
            <Upload className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-base sm:text-lg mb-2">Direct System File Upload</h3>
            <p className="text-gray-400 text-xs sm:text-sm">
              Upload a Doctor's PDF schedule directly from your system file for parsing.
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          className="hidden"
        />
        <Button variant="success" onClick={handleChooseFile} className="w-full sm:w-auto">
          Choose PDF File
        </Button>
      </div>
    </Card>
  )
}

