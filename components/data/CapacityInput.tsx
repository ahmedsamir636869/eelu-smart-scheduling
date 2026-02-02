'use client'

import { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CapacityInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: number
  onChange: (value: number) => void
}

export function CapacityInput({ value, onChange, className, ...props }: CapacityInputProps) {
  const handleIncrement = () => {
    onChange(value + 1)
  }

  const handleDecrement = () => {
    if (value > 0) {
      onChange(value - 1)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || 0
    onChange(newValue)
  }

  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        onChange={handleChange}
        className={cn(
          'w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2',
          'text-white pr-10',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          className
        )}
        {...props}
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
        <button
          type="button"
          onClick={handleIncrement}
          className="text-gray-400 hover:text-white text-xs leading-none w-4 h-3 flex items-center justify-center"
        >
          ▲
        </button>
        <button
          type="button"
          onClick={handleDecrement}
          className="text-gray-400 hover:text-white text-xs leading-none w-4 h-3 flex items-center justify-center"
        >
          ▼
        </button>
      </div>
    </div>
  )
}

