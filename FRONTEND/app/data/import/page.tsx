'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { GraduationCap, Monitor, UserCog, Users, BookOpen, Database } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { CategoryCard } from '@/components/data/BulkImport/CategoryCard'
import { FileUploadArea } from '@/components/data/BulkImport/FileUploadArea'
import { ImportGuidelines } from '@/components/data/BulkImport/ImportGuidelines'
import { importApi, ApiError } from '@/lib/api'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

type DataCategory = 'students' | 'physical' | 'doctors' | 'instructors' | 'courses' | 'all'

const categories = [
  { id: 'all' as DataCategory, label: 'All Data', icon: Database, description: 'Import all data types from one file' },
  { id: 'students' as DataCategory, label: 'Students List', icon: GraduationCap },
  { id: 'physical' as DataCategory, label: 'Physical Resources', icon: Monitor },
  { id: 'doctors' as DataCategory, label: 'Doctor Records', icon: UserCog },
  { id: 'instructors' as DataCategory, label: 'Instructor Data', icon: Users },
  { id: 'courses' as DataCategory, label: 'Courses', icon: BookOpen },
]

function BulkImportContent() {
  const searchParams = useSearchParams()
  const campusId = searchParams.get('campusId') || ''
  const [selectedCategory, setSelectedCategory] = useState<DataCategory>('students')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; details?: any } | null>(null)
  const [error, setError] = useState('')

  const handleFileSelect = async (file: File) => {
    try {
      setUploading(true)
      setError('')
      setResult(null)

      const formData = new FormData()
      formData.append('file', file)
      if (campusId) {
        formData.append('campusId', campusId)
      } else {
        // Try to get campusId from URL or use first available
        console.warn('No campusId provided. Physical resources import may fail without a campus ID.')
      }

      const response = await importApi.import(selectedCategory, formData)
      
      setResult({
        success: true,
        message: response.message || 'Import completed successfully',
        details: response.data
      })
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to import file. Please try again.'
      setError(errorMessage)
      setResult({
        success: false,
        message: errorMessage
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <ProtectedRoute>
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
            {campusId && (
              <p className="text-teal-400 text-xs sm:text-sm mt-1">
                Importing for campus ID: {campusId}
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className={`p-4 border rounded-lg ${
              result.success 
                ? 'bg-green-900/50 border-green-700 text-green-200' 
                : 'bg-red-900/50 border-red-700 text-red-200'
            }`}>
              <p className="font-medium mb-2">{result.message}</p>
              {result.details && (
                <div className="text-sm mt-2 space-y-2">
                  <div className="space-y-1">
                    <p>Total: {result.details.total}</p>
                    <p>Successful: {result.details.successful}</p>
                    {result.details.errors > 0 && (
                      <p className="text-yellow-300">Errors: {result.details.errors}</p>
                    )}
                    {result.details.unknown > 0 && (
                      <p className="text-orange-300">Unknown rows: {result.details.unknown}</p>
                    )}
                  </div>
                  
                  {/* Show breakdown for "all" category */}
                  {result.details.breakdown && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <p className="font-medium mb-2">Breakdown by category:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {result.details.breakdown.students.total > 0 && (
                          <div>
                            <span className="font-medium">Students:</span> {result.details.breakdown.students.successful}✓ {result.details.breakdown.students.errors > 0 && <span className="text-yellow-300">{result.details.breakdown.students.errors}✗</span>}
                          </div>
                        )}
                        {result.details.breakdown.physical.total > 0 && (
                          <div>
                            <span className="font-medium">Physical:</span> {result.details.breakdown.physical.successful}✓ {result.details.breakdown.physical.errors > 0 && <span className="text-yellow-300">{result.details.breakdown.physical.errors}✗</span>}
                          </div>
                        )}
                        {result.details.breakdown.instructors.total > 0 && (
                          <div>
                            <span className="font-medium">Instructors:</span> {result.details.breakdown.instructors.successful}✓ {result.details.breakdown.instructors.errors > 0 && <span className="text-yellow-300">{result.details.breakdown.instructors.errors}✗</span>}
                          </div>
                        )}
                        {result.details.breakdown.courses.total > 0 && (
                          <div>
                            <span className="font-medium">Courses:</span> {result.details.breakdown.courses.successful}✓ {result.details.breakdown.courses.errors > 0 && <span className="text-yellow-300">{result.details.breakdown.courses.errors}✗</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {result.details.details?.errors?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <p className="font-medium mb-2">Error details:</p>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {result.details.details.errors.map((err: any, idx: number) => (
                          <div key={idx} className="bg-red-900/30 p-2 rounded text-xs">
                            <p className="text-red-200 font-medium">Row {idx + 1}:</p>
                            <p className="text-red-300">{err.error}</p>
                            {err.row && (
                              <details className="mt-1">
                                <summary className="cursor-pointer text-red-400 hover:text-red-300">
                                  View row data
                                </summary>
                                <pre className="mt-1 p-1 bg-gray-900 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(err.row, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Show errors from breakdown for "all" category */}
                  {result.details.details?.students?.errors?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <p className="font-medium mb-2">Student Groups Errors ({result.details.details.students.errors.length}):</p>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {result.details.details.students.errors.slice(0, 10).map((err: any, idx: number) => (
                          <div key={idx} className="bg-red-900/30 p-2 rounded text-xs">
                            <p className="text-red-200 font-medium">Row {idx + 1}:</p>
                            <p className="text-red-300">{err.error}</p>
                            {err.row && (
                              <details className="mt-1">
                                <summary className="cursor-pointer text-red-400 hover:text-red-300">
                                  View row data
                                </summary>
                                <pre className="mt-1 p-1 bg-gray-900 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(err.row, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        ))}
                        {result.details.details.students.errors.length > 10 && (
                          <p className="text-yellow-300 text-xs">... and {result.details.details.students.errors.length - 10} more errors</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {result.details.details?.physical?.errors?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <p className="font-medium mb-2">Physical Resources Errors ({result.details.details.physical.errors.length}):</p>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {result.details.details.physical.errors.slice(0, 10).map((err: any, idx: number) => (
                          <div key={idx} className="bg-red-900/30 p-2 rounded text-xs">
                            <p className="text-red-200 font-medium">Row {idx + 1}:</p>
                            <p className="text-red-300">{err.error}</p>
                            {err.row && (
                              <details className="mt-1">
                                <summary className="cursor-pointer text-red-400 hover:text-red-300">
                                  View row data
                                </summary>
                                <pre className="mt-1 p-1 bg-gray-900 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(err.row, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        ))}
                        {result.details.details.physical.errors.length > 10 && (
                          <p className="text-yellow-300 text-xs">... and {result.details.details.physical.errors.length - 10} more errors</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {result.details.details?.instructors?.errors?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <p className="font-medium mb-2">Instructors Errors ({result.details.details.instructors.errors.length}):</p>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {result.details.details.instructors.errors.slice(0, 10).map((err: any, idx: number) => (
                          <div key={idx} className="bg-red-900/30 p-2 rounded text-xs">
                            <p className="text-red-200 font-medium">Row {idx + 1}:</p>
                            <p className="text-red-300">{err.error}</p>
                            {err.row && (
                              <details className="mt-1">
                                <summary className="cursor-pointer text-red-400 hover:text-red-300">
                                  View row data
                                </summary>
                                <pre className="mt-1 p-1 bg-gray-900 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(err.row, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        ))}
                        {result.details.details.instructors.errors.length > 10 && (
                          <p className="text-yellow-300 text-xs">... and {result.details.details.instructors.errors.length - 10} more errors</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {result.details.details?.courses?.errors?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <p className="font-medium mb-2">Courses Errors ({result.details.details.courses.errors.length}):</p>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {result.details.details.courses.errors.slice(0, 10).map((err: any, idx: number) => (
                          <div key={idx} className="bg-red-900/30 p-2 rounded text-xs">
                            <p className="text-red-200 font-medium">Row {idx + 1}:</p>
                            <p className="text-red-300">{err.error}</p>
                            {err.row && (
                              <details className="mt-1">
                                <summary className="cursor-pointer text-red-400 hover:text-red-300">
                                  View row data
                                </summary>
                                <pre className="mt-1 p-1 bg-gray-900 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(err.row, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        ))}
                        {result.details.details.courses.errors.length > 10 && (
                          <p className="text-yellow-300 text-xs">... and {result.details.details.courses.errors.length - 10} more errors</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {result.details.unknown > 0 && (
                    <div className="mt-3 pt-3 border-t border-orange-600">
                      <p className="font-medium mb-2 text-orange-300">
                        Unknown Rows ({result.details.unknown}):
                      </p>
                      <p className="text-orange-200 text-sm">
                        These rows could not be automatically categorized. They may be:
                      </p>
                      <ul className="list-disc list-inside text-orange-200 text-xs mt-2 space-y-1">
                        <li>Empty or header rows</li>
                        <li>Rows with missing required fields</li>
                        <li>Rows that don't match any known data format</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <h3 className="text-white font-medium mb-4 text-sm sm:text-base">1. SELECT DATA CATEGORY</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
              {categories.map((category) => {
                const Icon = category.icon
                return (
                  <CategoryCard
                    key={category.id}
                    title={category.label}
                    icon={<Icon className="w-8 h-8" />}
                    isSelected={selectedCategory === category.id}
                    onClick={() => {
                      setSelectedCategory(category.id)
                      setResult(null)
                      setError('')
                    }}
                  />
                )
              })}
            </div>
            {selectedCategory === 'all' && (
              <div className="mt-3 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                <p className="text-blue-200 text-sm">
                  <strong>All Data Import:</strong> Upload a single file containing multiple data types. 
                  The system will automatically detect and import students, courses, instructors, and physical resources.
                </p>
              </div>
            )}
          </div>

          <FileUploadArea 
            onFileSelect={handleFileSelect} 
            disabled={uploading}
          />

          {uploading && (
            <div className="text-center py-4 text-gray-400">
              Uploading and processing file...
            </div>
          )}

          <ImportGuidelines />
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}

export default function BulkImportPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BulkImportContent />
    </Suspense>
  )
}

