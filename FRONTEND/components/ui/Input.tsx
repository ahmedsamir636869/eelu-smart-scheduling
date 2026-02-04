import { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  onIncrement?: () => void
  onDecrement?: () => void
}

export function Input({ className, onIncrement, onDecrement, ...props }: InputProps) {
  return (
    <div className="relative">
      <input
        className={cn(
          'w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2',
          'text-white',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          className
        )}
        {...props}
      />
      {(onIncrement || onDecrement) && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
          {onIncrement && (
            <button
              type="button"
              onClick={onIncrement}
              className="text-gray-400 hover:text-white text-xs leading-none"
            >
              ▲
            </button>
          )}
          {onDecrement && (
            <button
              type="button"
              onClick={onDecrement}
              className="text-gray-400 hover:text-white text-xs leading-none"
            >
              ▼
            </button>
          )}
        </div>
      )}
    </div>
  )
}

