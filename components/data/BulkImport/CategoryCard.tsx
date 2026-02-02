import { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

interface CategoryCardProps {
  title: string
  icon: ReactNode
  isSelected: boolean
  onClick: () => void
}

export function CategoryCard({ title, icon, isSelected, onClick }: CategoryCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'cursor-pointer text-center p-6 transition-all',
        isSelected
          ? 'border-teal-500 border-2 bg-teal-500/10'
          : 'hover:border-gray-600'
      )}
    >
      <div className={cn('flex justify-center mb-3', isSelected ? 'text-teal-400' : 'text-gray-400')}>
        {icon}
      </div>
      <p className={cn('text-sm font-medium', isSelected ? 'text-teal-400' : 'text-gray-300')}>
        {title}
      </p>
    </Card>
  )
}

