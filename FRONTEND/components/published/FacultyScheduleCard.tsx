import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface FacultyScheduleCardProps {
  faculty: 'IT' | 'Business'
  status: 'draft' | 'published' | 'pending_review'
  keyMetric: string
}

export function FacultyScheduleCard({ faculty, status, keyMetric }: FacultyScheduleCardProps) {
  const statusMap = {
    draft: { variant: 'draft' as const, label: 'Draft' },
    published: { variant: 'published' as const, label: 'Published' },
    pending_review: { variant: 'pending_review' as const, label: 'Pending Review' },
  }

  const statusInfo = statusMap[status]

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-teal-400 font-bold text-lg">
          {faculty} Faculty Schedule ({statusInfo.label})
        </h3>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </div>

      <div className="bg-gray-900 rounded-lg p-8 mb-4 border border-gray-700 min-h-[300px] flex items-center justify-center">
        <p className="text-gray-500 text-sm">Detailed Timetable Preview (Placeholder)</p>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <p className="text-gray-400 text-sm">
          <span className="text-white font-medium">Key Metric:</span> {keyMetric}
        </p>
      </div>
    </Card>
  )
}

