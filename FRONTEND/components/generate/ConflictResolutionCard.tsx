import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Lightbulb, AlertTriangle } from 'lucide-react'

interface ConflictResolutionCardProps {
  onResolveConflicts: () => void
}

export function ConflictResolutionCard({ onResolveConflicts }: ConflictResolutionCardProps) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="w-5 h-5 text-yellow-400" />
        <h3 className="text-white font-bold text-lg">CONFLICT RESOLUTION</h3>
      </div>
      <p className="text-gray-400 text-sm mb-4">
        If the formula fails or finds conflicts, use this interface to manually resolve issues.
      </p>
      <Button variant="danger" icon={<AlertTriangle className="w-4 h-4" />} onClick={onResolveConflicts}>
        Resolve Conflicts
      </Button>
    </Card>
  )
}

