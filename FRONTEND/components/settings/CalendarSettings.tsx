import { Info } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface CalendarSettingsProps {
  onEdit: () => void
}

export function CalendarSettings({ onEdit }: CalendarSettingsProps) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-bold text-lg">GLOBAL SCHEDULING FORMULA SETTINGS</h3>
          <Info className="w-5 h-5 text-blue-400" />
        </div>
      </div>
      <p className="text-gray-400 text-sm mb-4">
        Set academic year start/end dates, weekly lecture/lab durations, and global working hour limits (8:00 AM to 5:00 PM).
      </p>
      <Button variant="primary" onClick={onEdit}>
        Edit Calendar Settings
      </Button>
    </Card>
  )
}

