import { Monitor, Edit } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

interface ResourceCardProps {
  id: string
  name: string
  capacity: number
  onCapacityChange: (id: string, capacity: number) => void
}

export function ResourceCard({ id, name, capacity, onCapacityChange }: ResourceCardProps) {
  const handleIncrement = () => {
    onCapacityChange(id, capacity + 1)
  }

  const handleDecrement = () => {
    if (capacity > 0) {
      onCapacityChange(id, capacity - 1)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0
    onCapacityChange(id, value)
  }

  return (
    <Card className="relative">
      <div className="absolute top-4 right-4">
        <Edit className="w-4 h-4 text-gray-400" />
      </div>
      <div className="flex items-start gap-4">
        <Monitor className="w-6 h-6 text-gray-400 mt-1" />
        <div className="flex-1">
          <h3 className="text-white font-medium mb-1">{name}</h3>
          <p className="text-gray-400 text-sm mb-3">Seat Capacity</p>
          <Input
            type="number"
            value={capacity}
            onChange={handleChange}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            className="w-full"
          />
        </div>
      </div>
    </Card>
  )
}

