import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface ReportListItemProps {
  id: string
  reportNumber: string
  userId: string
  branch: string
  description: string
  status: 'new' | 'in_progress' | 'resolved'
  isSelected: boolean
  onClick: () => void
}

export function ReportListItem({
  id,
  reportNumber,
  userId,
  branch,
  description,
  status,
  isSelected,
  onClick,
}: ReportListItemProps) {
  const statusMap = {
    new: { variant: 'draft' as const, label: 'New' },
    in_progress: { variant: 'pending_review' as const, label: 'In Progress' },
    resolved: { variant: 'published' as const, label: 'Resolved' },
  }

  const statusInfo = statusMap[status]

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 rounded-lg border cursor-pointer transition-colors',
        isSelected
          ? 'bg-teal-500/10 border-teal-500/50'
          : 'bg-gray-800 border-gray-700 hover:border-gray-600'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-white font-medium">
            Report #{reportNumber} - User: #{userId} - Branch {branch}
          </p>
          <p className="text-gray-400 text-sm mt-1">{description}</p>
        </div>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </div>
    </div>
  )
}

