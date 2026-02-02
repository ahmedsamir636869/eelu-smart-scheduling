import { Clock, Users, Zap } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface QuickFixActionsProps {
  onReassignTimeSlot: () => void
  onAdjustRoomCapacity: () => void
  onRecalculateSection: () => void
}

export function QuickFixActions({
  onReassignTimeSlot,
  onAdjustRoomCapacity,
  onRecalculateSection,
}: QuickFixActionsProps) {
  return (
    <Card>
      <h3 className="text-white font-bold text-lg mb-2">QUICK FIX ACTIONS</h3>
      <p className="text-gray-400 text-sm mb-6">
        Apply common fixes directly to the related schedule to automatically resolve this conflict.
      </p>

      <div className="space-y-4">
        <Button
          variant="warning"
          icon={<Clock className="w-4 h-4 sm:w-5 sm:h-5" />}
          onClick={onReassignTimeSlot}
          className="w-full justify-start text-sm sm:text-base"
        >
          <div className="flex flex-col items-start">
            <span>Reassign Time Slot</span>
            <span className="text-xs font-normal opacity-90">Change class period</span>
          </div>
        </Button>

        <Button
          variant="success"
          icon={<Users className="w-4 h-4 sm:w-5 sm:h-5" />}
          onClick={onAdjustRoomCapacity}
          className="w-full justify-start text-sm sm:text-base"
        >
          <div className="flex flex-col items-start">
            <span>Adjust Room Capacity</span>
            <span className="text-xs font-normal opacity-90">Increase max student</span>
          </div>
        </Button>

        <Button
          variant="primary"
          icon={<Zap className="w-4 h-4 sm:w-5 sm:h-5" />}
          onClick={onRecalculateSection}
          className="w-full justify-start text-sm sm:text-base"
        >
          <div className="flex flex-col items-start">
            <span>Recalculate Section</span>
            <span className="text-xs font-normal opacity-90">Rerun formula on a specific section</span>
          </div>
        </Button>
      </div>
    </Card>
  )
}

