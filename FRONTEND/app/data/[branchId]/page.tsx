'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Wrench, GraduationCap, ClipboardList, Settings, Upload, FileUp } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { BranchDataCard } from '@/components/data/BranchDataCard'
import { campusApi, ApiError } from '@/lib/api'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

interface BranchDetailPageProps {
  params: {
    branchId: string
  }
}

export default function BranchDetailPage({ params }: BranchDetailPageProps) {
  const [branchName, setBranchName] = useState(`Branch ${params.branchId}`)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const branchId = params.branchId

  useEffect(() => {
    fetchCampusInfo()
  }, [branchId])

  const fetchCampusInfo = async () => {
    try {
      setLoading(true)
      setError('')
      const campus = await campusApi.getById(branchId)
      if (campus) {
        const displayName = campus.city 
          ? `${campus.name} - ${campus.city}` 
          : campus.name
        setBranchName(displayName)
      }
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to load campus information.'
      setError(errorMessage)
      console.error('Error fetching campus:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <MainLayout title={`Data: Branch ${branchId} - ${branchName}`}>
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}
        <div className="space-y-6">
          <Link
            href="/data"
            className="text-teal-400 hover:text-teal-300 transition-colors inline-flex items-center gap-2"
          >
            ← Back to Branch Selection
          </Link>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading campus information...</div>
          ) : (
            <>
              <div>
                <h2 className="text-white text-xl font-bold uppercase mb-2">
                  BRANCH {branchId} - {branchName.toUpperCase()} - DATA MANAGEMENT
                </h2>
                <p className="text-gray-400 text-sm">
                  Select a category below to manage the data inputs specific to this Branch.
                </p>
              </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <BranchDataCard
            title="Physical resources"
            description={`Manage all spaces and capacities for Branch ${branchId} - ${branchName}`}
            icon={<Wrench className="w-6 h-6" />}
            iconColor="green"
            href={`/data/${branchId}/physical-resources`}
          />
          <BranchDataCard
            title="Students' Data"
            description={`Manage Students' Data, Sections all over the two faculties for Branch ${branchId} - ${branchName}.`}
            icon={<GraduationCap className="w-6 h-6" />}
            iconColor="blue"
            href={`/data/${branchId}/students`}
          />
          <BranchDataCard
            title="Instructor Assignments"
            description={`Map instructors and courses specifically for Branch ${branchId} - ${branchName}`}
            icon={<ClipboardList className="w-6 h-6" />}
            iconColor="red"
            href={`/data/${branchId}/instructors`}
          />
          <BranchDataCard
            title="SYSTEM CONFIGURATION"
            description="To manage constraints and the academic calendar for all branches, go to System Settings."
            icon={<Settings className="w-6 h-6" />}
            iconColor="yellow"
            href="/settings"
            showButton
            buttonText="System Settings (Global)"
            buttonVariant="warning"
          />
          <BranchDataCard
            title="Doctor Schedule Upload Manager"
            description={`Manage/Upload Doctor-provided schedules to Initialize data for Branch ${branchId} - ${branchName}`}
            icon={<Upload className="w-6 h-6" />}
            iconColor="blue"
            href={`/data/${branchId}/doctor-schedules`}
          />
          <BranchDataCard
            title="IMPORT SYSTEM DATA"
            description="Bulk upload EXCEL/JSON files directly into the system database."
            icon={<FileUp className="w-6 h-6" />}
            iconColor="blue"
            href="/data/import"
          />
        </div>
            </>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}

