import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: ReactNode
  variant?: 'draft' | 'published' | 'pending_review' | 'new' | 'in_progress'
  className?: string
}

export function Badge({ children, variant = 'draft', className }: BadgeProps) {
  const variants = {
    draft: 'bg-red-500/20 text-red-400 border-red-500/30',
    published: 'bg-green-500/20 text-green-400 border-green-500/30',
    pending_review: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    new: 'bg-red-500/20 text-red-400 border-red-500/30',
    in_progress: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  }

  return (
    <span
      className={cn(
        'px-2 py-1 rounded text-xs font-medium border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

