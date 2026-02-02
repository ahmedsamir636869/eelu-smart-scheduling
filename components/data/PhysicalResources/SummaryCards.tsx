import { Card } from '@/components/ui/Card'

interface SummaryCardsProps {
  totalCapacity: number
  activeLabs: number
  lectureRooms: number
}

export function SummaryCards({ totalCapacity, activeLabs, lectureRooms }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
      <Card>
        <p className="text-gray-400 text-sm mb-2">TOTAL CAPACITY</p>
        <p className="text-teal-400 text-3xl font-bold">{totalCapacity}</p>
      </Card>
      <Card>
        <p className="text-gray-400 text-sm mb-2">ACTIVE LABS</p>
        <p className="text-green-400 text-3xl font-bold">{activeLabs}</p>
      </Card>
      <Card>
        <p className="text-gray-400 text-sm mb-2">LECTURE ROOMS</p>
        <p className="text-blue-400 text-3xl font-bold">{lectureRooms}</p>
      </Card>
    </div>
  )
}

