import { Card } from '@/components/ui/Card'
import { TrendingUp } from 'lucide-react'
import { PerformanceMetrics } from '@/types/api'

interface PerformanceInsightCardProps {
  metrics: PerformanceMetrics
}

export function PerformanceInsightCard({ metrics }: PerformanceInsightCardProps) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-blue-400" />
        <h3 className="text-white font-bold text-lg">FORMULA PERFORMANCE INSIGHT</h3>
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-gray-400 text-sm mb-1">Initial conflict rate</p>
          <p className="text-red-400 font-semibold">{metrics.initialConflictRate}</p>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Avg. Resolution Time</p>
          <p className="text-orange-400 font-semibold">{metrics.avgResolutionTime}</p>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Last Successful Run</p>
          <p className="text-green-400 font-semibold">{metrics.lastSuccessfulRun}</p>
        </div>
      </div>
    </Card>
  )
}

