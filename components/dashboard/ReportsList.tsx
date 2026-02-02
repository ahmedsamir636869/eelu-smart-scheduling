import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { List } from 'lucide-react'
import { TAReport } from '@/types/api'

interface ReportsListProps {
  reports: TAReport[]
}

export function ReportsList({ reports }: ReportsListProps) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg">LATEST TA REPORTS</h3>
        <List className="w-5 h-5 text-gray-400" />
      </div>
      <div className="space-y-4">
        {reports.map((report) => (
          <div key={report.id} className="border-b border-gray-700 pb-4 last:border-0 last:pb-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-white font-medium">
                  Report #{report.id} - User: #{report.userId} - Branch {report.branch}
                </p>
                <p className="text-gray-400 text-sm mt-1">{report.description}</p>
              </div>
              <Badge variant={report.status === 'new' ? 'new' : 'in_progress'}>
                {report.status === 'new' ? 'NEW' : 'In Progress'}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

