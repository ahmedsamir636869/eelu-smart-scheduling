import { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'

interface MetricCardProps {
  title: string
  value: string | number
  icon: ReactNode
  valueColor?: string
}

export function MetricCard({ title, value, icon, valueColor = 'text-white' }: MetricCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-2">{title}</p>
          <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
        </div>
        <div className="text-gray-400">
          {icon}
        </div>
      </div>
    </Card>
  )
}

