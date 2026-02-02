import { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'w-full bg-black border border-gray-700 rounded-lg px-4 py-3',
        'text-green-400 font-mono text-sm',
        'focus:outline-none focus:ring-2 focus:ring-green-500/50',
        'resize-none',
        className
      )}
      {...props}
    />
  )
}

