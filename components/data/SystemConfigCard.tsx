import { Settings } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function SystemConfigCard() {
  return (
    <Card>
      <div className="flex items-start gap-4">
        <div className="p-3 bg-yellow-500/20 rounded-lg">
          <Settings className="w-6 h-6 text-yellow-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg mb-2">SYSTEM CONFIGURATION</h3>
          <p className="text-gray-400 text-sm mb-4">
            To manage constraints and the academic calendar for all branches, go to System Settings.
          </p>
          <Button variant="warning" icon={<Settings className="w-4 h-4" />}>
            System Settings (Global)
          </Button>
        </div>
      </div>
    </Card>
  )
}

