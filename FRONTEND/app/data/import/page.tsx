'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GraduationCap, Monitor, UserCog, Users } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { CategoryCard } from '@/components/data/BulkImport/CategoryCard'
import { FileUploadArea } from '@/components/data/BulkImport/FileUploadArea'
import { ImportGuidelines } from '@/components/data/BulkImport/ImportGuidelines'

type DataCategory = 'students' | 'physical' | 'doctors' | 'instructors'

const categories = [
  { id: 'students' as DataCategory, label: 'Students List', icon: GraduationCap },
  { id: 'physical' as DataCategory, label: 'Physical Resources', icon: Monitor },
  { id: 'doctors' as DataCategory, label: 'Doctor Records', icon: UserCog },
  { id: 'instructors' as DataCategory, label: 'Instructor Data', icon: Users },
]

export default function BulkImportPage() {
  const [selectedCategory, setSelectedCategory] = useState<DataCategory>('students')

  const handleFileSelect = (file: File) => {
    console.log('File selected:', file.name, 'Category:', selectedCategory)
    // In real app, this would upload the file via API
    // api.post(`/data/import/${selectedCategory}`, formData)
  }

  return (
    <MainLayout title="Data: Bulk System Import">
      <div className="space-y-4 sm:space-y-6">
        <Link
          href="/data"
          className="text-teal-400 hover:text-teal-300 transition-colors inline-flex items-center gap-2 text-sm sm:text-base"
        >
          ← Back to Data
        </Link>

        <div>
          <h2 className="text-white text-lg sm:text-xl font-bold uppercase mb-2">BULK SYSTEM IMPORT</h2>
          <p className="text-gray-400 text-xs sm:text-sm">
            Upload EXCEL, CSV, or JSON files to update branch records instantly.
          </p>
        </div>

        <div>
          <h3 className="text-white font-medium mb-4 text-sm sm:text-base">1. SELECT DATA CATEGORY</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <CategoryCard
                  key={category.id}
                  title={category.label}
                  icon={<Icon className="w-8 h-8" />}
                  isSelected={selectedCategory === category.id}
                  onClick={() => setSelectedCategory(category.id)}
                />
              )
            })}
          </div>
        </div>

        <FileUploadArea onFileSelect={handleFileSelect} />

        <ImportGuidelines />
      </div>
    </MainLayout>
  )
}

