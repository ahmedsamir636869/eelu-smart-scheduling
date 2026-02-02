import { cn } from '@/lib/utils'

interface ToggleButtonProps {
  label: string
  isSelected: boolean
  onClick: () => void
}

export function ToggleButton({ label, isSelected, onClick }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-lg font-medium transition-colors',
        isSelected
          ? 'bg-teal-600 text-white'
          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
      )}
    >
      {label}
    </button>
  )
}

