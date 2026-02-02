import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'bg-gray-800 rounded-lg p-6 border border-gray-700',
        onClick && 'cursor-pointer hover:border-gray-600 transition-colors',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

