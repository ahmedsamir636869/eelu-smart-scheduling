import { Card } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'

interface CalculationLogProps {
  log: string[]
}

export function CalculationLog({ log }: CalculationLogProps) {
  const logText = log.length > 0 ? log.join('\n') : 'Log output will appear here after calculation starts.'

  return (
    <Card>
      <h3 className="text-white font-bold text-lg mb-4">Calculation Log</h3>
      <Textarea
        readOnly
        rows={20}
        value={logText}
        className="h-full min-h-[400px]"
      />
    </Card>
  )
}

