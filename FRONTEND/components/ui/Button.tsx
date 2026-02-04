import { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success'
  icon?: ReactNode
  children: ReactNode
}

export function Button({ 
  variant = 'primary', 
  icon, 
  children, 
  className,
  ...props 
}: ButtonProps) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
  }

  return (
    <button
      className={cn(
        'px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base',
        'flex items-center justify-center gap-2',
        variants[variant],
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  )
}

