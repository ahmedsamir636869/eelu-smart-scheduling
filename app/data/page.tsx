import { MainLayout } from '@/components/layout/MainLayout'
import { BranchCard } from '@/components/data/BranchCard'
import { ImportDataCard } from '@/components/data/ImportDataCard'
import { SystemConfigCard } from '@/components/data/SystemConfigCard'
import { Branch } from '@/types/api'

// Mock data - will be replaced with API calls
const branches: Branch[] = [
  { id: '1', name: 'Branch 1 - Ain Shams', status: 'draft' },
  { id: '2', name: 'Branch 2 - Assiut', status: 'published' },
  { id: '3', name: 'Branch 3 - Alexandria', status: 'published' },
  { id: '4', name: 'Branch 4 - Faiyum', status: 'pending_review' },
  { id: '5', name: 'Branch 5 - Beni Suef', status: 'draft' },
  { id: '6', name: 'Branch 6 - Al-Sadat', status: 'published' },
  { id: '7', name: 'Branch 7 - Menofia', status: 'published' },
  { id: '8', name: 'Branch 8 - Tanta', status: 'published' },
  { id: '9', name: 'Branch 9 - Hurghada', status: 'pending_review' },
  { id: '10', name: 'Branch 10 - Minya', status: 'draft' },
  { id: '11', name: 'Branch 11 - Ismailia', status: 'published' },
  { id: '12', name: 'Branch 12 - Qena', status: 'pending_review' },
  { id: '13', name: 'Branch 13 - Sohag', status: 'pending_review' },
  { id: '14', name: 'Branch 14 - Aswan', status: 'draft' },
]

export default function DataPage() {
  return (
    <MainLayout title="Data">
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-white text-lg sm:text-xl font-bold mb-2">SELECT BRANCH FOR DATA MANAGEMENT</h2>
          <p className="text-gray-400 text-xs sm:text-sm">
            Select a campus below to manage its specific data inputs (Physical Data, Instruction, Uploads).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {branches.map((branch) => (
            <BranchCard key={branch.id} branch={branch} />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
          <ImportDataCard />
          <SystemConfigCard />
        </div>
      </div>
    </MainLayout>
  )
}

