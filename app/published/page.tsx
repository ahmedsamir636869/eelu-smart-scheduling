'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { FacultyScheduleCard } from '@/components/published/FacultyScheduleCard'

// Mock branch data
const branches = [
  { value: '1', label: 'Branch 1 - Ain Shams (Draft)' },
  { value: '2', label: 'Branch 2 - Assiut (Published)' },
  { value: '3', label: 'Branch 3 - Alexandria (Pending Review)' },
  { value: '4', label: 'Branch 4 - Faiyum (Draft)' },
]

const branchStatuses: Record<string, 'draft' | 'published' | 'pending_review'> = {
  '1': 'draft',
  '2': 'published',
  '3': 'pending_review',
  '4': 'draft',
}

export default function PublishedPage() {
  const [selectedBranch, setSelectedBranch] = useState('3')

  const currentStatus = branchStatuses[selectedBranch] || 'draft'

  const handleFinalize = () => {
    console.log('Finalizing and publishing schedules for branch:', selectedBranch)
    // In real app, this would call the API
    // api.post(`/branches/${selectedBranch}/publish`, {})
  }

  return (
    <MainLayout title="Published Schedules">
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-white text-lg sm:text-xl font-bold uppercase mb-4">SCHEDULE REVIEW AND PUBLISH</h2>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 sm:mb-6">
            <div className="flex-1 w-full">
              <label className="text-gray-400 text-sm mb-2 block">Select Branch for Review</label>
              <Select
                options={branches}
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="text-gray-400 text-sm mb-2 block">Current Status:</label>
              <Badge variant={currentStatus === 'pending_review' ? 'pending_review' : currentStatus === 'published' ? 'published' : 'draft'}>
                {currentStatus === 'pending_review' ? 'Pending Review' : currentStatus === 'published' ? 'Published' : 'Draft'}
              </Badge>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-white text-base sm:text-lg font-bold mb-4">
            Branch {selectedBranch} - {branches.find(b => b.value === selectedBranch)?.label.split(' - ')[1]?.split(' (')[0] || 'Unknown'} Schedules
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <FacultyScheduleCard
              faculty="IT"
              status={currentStatus}
              keyMetric="4/5 Labs utilized. No conflicts found in L1-L4."
            />
            <FacultyScheduleCard
              faculty="Business"
              status={currentStatus}
              keyMetric="All mandatory courses covered. Max class size limit met."
            />
          </div>

          <div className="flex justify-center">
            <Button
              variant="primary"
              icon={<Check className="w-4 h-4" />}
              onClick={handleFinalize}
              className="px-8 py-3 text-lg"
            >
              Finalize & Publish
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

