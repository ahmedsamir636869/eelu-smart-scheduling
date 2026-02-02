import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Branch } from '@/types/api'

interface BranchCardProps {
  branch: Branch
}

export function BranchCard({ branch }: BranchCardProps) {
  const statusMap = {
    draft: 'draft' as const,
    published: 'published' as const,
    pending_review: 'pending_review' as const,
  }

  const statusLabel = {
    draft: 'Draft',
    published: 'Published',
    pending_review: 'Pending Review',
  }

  return (
    <Link href={`/data/${branch.id}`}>
      <Card className="hover:border-teal-600/50 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <h3 className="text-white font-medium">{branch.name}</h3>
            </div>
          </div>
          <Badge variant={statusMap[branch.status]}>
            {statusLabel[branch.status]}
          </Badge>
        </div>
      </Card>
    </Link>
  )
}

