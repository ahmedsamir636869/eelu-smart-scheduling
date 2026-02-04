import { Download, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface ScheduleItemProps {
  id: string
  fileName: string
  doctorName: string
  branch: string
  date: string
  status: 'processed' | 'error' | 'pending'
  onDownload: (id: string) => void
  onDelete: (id: string) => void
}

export function ScheduleItem({
  id,
  fileName,
  doctorName,
  branch,
  date,
  status,
  onDownload,
  onDelete,
}: ScheduleItemProps) {
  const statusMap = {
    processed: { variant: 'published' as const, label: 'Processed' },
    error: { variant: 'draft' as const, label: 'Error in parsing' },
    pending: { variant: 'pending_review' as const, label: 'Pending Review' },
  }

  const statusInfo = statusMap[status]

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-start gap-4 mb-3">
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            <div>
              <p className="text-white font-medium">{doctorName} ({fileName})</p>
              <p className="text-gray-400 text-sm mt-1">
                Branch: {branch} | Date: {date}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onDownload(id)}
            className="text-gray-400 hover:text-white transition-colors"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(id)}
            className="text-gray-400 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </Card>
  )
}

