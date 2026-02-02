import { Toggle } from '@/components/ui/Toggle'

interface SoftConstraintToggleProps {
  id: string
  title: string
  description: string
  enabled: boolean
  onChange: (enabled: boolean) => void
}

export function SoftConstraintToggle({
  id,
  title,
  description,
  enabled,
  onChange,
}: SoftConstraintToggleProps) {
  return (
    <Toggle
      enabled={enabled}
      onChange={onChange}
      label={title}
      description={description}
    />
  )
}

