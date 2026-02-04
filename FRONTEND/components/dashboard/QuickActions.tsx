import { Zap, Database, Wrench } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function QuickActions() {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-5 h-5 text-yellow-400" />
        <h3 className="text-white font-bold text-lg">QUICK ACTIONS</h3>
      </div>
      <p className="text-gray-400 text-sm mb-4">
        Start the scheduling process or jump to data management or Tune Constraints.
      </p>
      <div className="flex flex-col gap-3">
        <Button variant="primary" icon={<Zap className="w-4 h-4" />}>
          Run Formula Calculations
        </Button>
        <Button variant="warning" icon={<Database className="w-4 h-4" />}>
          Manage Data Inputs
        </Button>
        <Button variant="danger" icon={<Wrench className="w-4 h-4" />}>
          Edit Constraints
        </Button>
      </div>
    </Card>
  )
}

