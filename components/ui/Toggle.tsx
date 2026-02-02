import { cn } from '@/lib/utils'

interface ToggleProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  label?: string
  description?: string
}

export function Toggle({ enabled, onChange, label, description }: ToggleProps) {
  return (
    <div className="flex items-start justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex-1">
        {label && <p className="text-white font-medium mb-1">{label}</p>}
        {description && <p className="text-gray-400 text-sm">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={cn(
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-900',
          enabled ? 'bg-green-500' : 'bg-gray-600'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
            enabled ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  )
}

