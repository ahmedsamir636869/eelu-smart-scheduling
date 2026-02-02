import { BookOpen, AlertTriangle, Users } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { ReportsList } from '@/components/dashboard/ReportsList'
import { TAReport } from '@/types/api'

// Mock data - will be replaced with API calls
const mockReports: TAReport[] = [
  {
    id: '101',
    userId: '235251',
    branch: '2',
    description: 'Instructor Eng.Sara is assigned to two different courses at the same time.',
    status: 'new',
  },
  {
    id: '102',
    userId: '252524',
    branch: '11',
    description: 'Instructor Eng.Sara is assigned to two different courses at the same time.',
    status: 'in_progress',
  },
]

export default function DashboardPage() {
  return (
    <MainLayout title="Dashboard" subtitle="Welcome, Admin">
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <MetricCard
            title="SCHEDULES PENDING REVIEWS"
            value={1}
            icon={<BookOpen className="w-8 h-8" />}
          />
          <MetricCard
            title="OPEN CONFLICTS REPORTS"
            value={3}
            icon={<AlertTriangle className="w-8 h-8 text-red-400" />}
            valueColor="text-red-400"
          />
          <MetricCard
            title="DOCTOR SCHEDULES UPLOADED"
            value="4/8"
            icon={<Users className="w-8 h-8 text-green-400" />}
            valueColor="text-green-400"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <ReportsList reports={mockReports} />
          </div>
          <div>
            <QuickActions />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

