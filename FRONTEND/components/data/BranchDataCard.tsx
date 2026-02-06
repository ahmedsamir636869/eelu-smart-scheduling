import Link from 'next/link'
import { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface BranchDataCardProps {
  title: string
  description: string
  icon: ReactNode
  iconColor?: 'green' | 'blue' | 'red' | 'yellow' | 'teal'
  href: string
  showButton?: boolean
  buttonText?: string
  buttonVariant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success'
  onButtonClick?: () => void
}

export function BranchDataCard({
  title,
  description,
  icon,
  iconColor = 'blue',
  href,
  showButton = false,
  buttonText,
  buttonVariant = 'warning',
  onButtonClick,
}: BranchDataCardProps) {
  const iconColors = {
    green: 'bg-green-500/20 text-green-400',
    blue: 'bg-blue-500/20 text-blue-400',
    red: 'bg-red-500/20 text-red-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    teal: 'bg-teal-500/20 text-teal-400',
  }

  const content = (
    <Card className="h-full">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${iconColors[iconColor]}`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
          <p className="text-gray-400 text-sm mb-4">{description}</p>
          {showButton && buttonText && (
            <Button variant={buttonVariant} onClick={onButtonClick}>
              {buttonText}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )

  if (showButton) {
    return content
  }

  return <Link href={href}>{content}</Link>
}

