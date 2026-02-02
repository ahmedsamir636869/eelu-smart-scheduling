import Link from 'next/link'
import { Wrench, GraduationCap, ClipboardList, Settings, Upload, FileUp } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { BranchDataCard } from '@/components/data/BranchDataCard'

interface BranchDetailPageProps {
  params: {
    branchId: string
  }
}

// Mock branch data - will be replaced with API call
const branchNames: Record<string, string> = {
  '1': 'Ain Shams',
  '2': 'Assiut',
  '3': 'Alexandria',
  '4': 'Faiyum',
  '5': 'Beni Suef',
  '6': 'Al-Sadat',
  '7': 'Menofia',
  '8': 'Tanta',
  '9': 'Hurghada',
  '10': 'Minya',
  '11': 'Ismailia',
  '12': 'Qena',
  '13': 'Sohag',
  '14': 'Aswan',
}

export default function BranchDetailPage({ params }: BranchDetailPageProps) {
  const branchName = branchNames[params.branchId] || `Branch ${params.branchId}`
  const branchId = params.branchId

  return (
    <MainLayout title={`Data: Branch ${branchId} - ${branchName}`}>
      <div className="space-y-6">
        <Link
          href="/data"
          className="text-teal-400 hover:text-teal-300 transition-colors inline-flex items-center gap-2"
        >
          ← Back to Branch Selection
        </Link>

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
      </div>
    </MainLayout>
  )
}

