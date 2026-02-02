'use client'

import { useState } from 'react'
import { Save, AlertTriangle } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SoftConstraintToggle } from '@/components/settings/SoftConstraintToggle'
import { CalendarSettings } from '@/components/settings/CalendarSettings'

interface SoftConstraint {
  id: string
  title: string
  description: string
  enabled: boolean
}

const initialConstraints: SoftConstraint[] = [
  {
    id: 'SC1',
    title: 'SC1: Staff Preference (TAs)',
    description: 'Respect TAs\' preferred day-offs whenever possible; may be overridden if no feasible solution exists.',
    enabled: true,
  },
  {
    id: 'SC2',
    title: 'SC2: Staff Preference (Instructors)',
    description: 'Respect instructors\' preferred teaching days/times (e.g., morning or midweek).',
    enabled: true,
  },
  {
    id: 'SC3',
    title: 'SC3: Time Distribution (Students)',
    description: 'Distribute lectures evenly throughout the week (avoid clustering).',
    enabled: true,
  },
  {
    id: 'SC4',
    title: 'SC4: Optimization (Students / Staff)',
    description: 'Minimize idle gaps between consecutive sessions for both students and staff.',
    enabled: true,
  },
  {
    id: 'SC5',
    title: 'SC5: Resource Optimization (IT)',
    description: 'Schedule sections earlier in the day (preferably before 4 PM) for optimal lab use.',
    enabled: true,
  },
  {
    id: 'SC6',
    title: 'SC6: Course Organization (Students)',
    description: 'Group lectures and sections of the same course on nearby days for continuity.',
    enabled: false,
  },
]

export default function SettingsPage() {
  const [constraints, setConstraints] = useState<SoftConstraint[]>(initialConstraints)

  const handleConstraintChange = (id: string, enabled: boolean) => {
    setConstraints(constraints.map(c => c.id === id ? { ...c, enabled } : c))
  }

  const handleSave = () => {
    console.log('Saving configuration:', constraints)
    // In real app, this would call the API
    // api.post('/settings/constraints', { constraints })
  }

  const handleEditCalendar = () => {
    console.log('Opening calendar settings editor')
    // In real app, this would open a modal or navigate to calendar settings page
  }

  return (
    <MainLayout title="Settings">
      <div className="space-y-4 sm:space-y-6">
        {/* Global Scheduling Formula Settings - Soft Constraints */}
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div className="flex-1">
              <h2 className="text-white font-bold text-lg sm:text-xl mb-2">GLOBAL SCHEDULING FORMULA SETTINGS</h2>
              <p className="text-gray-400 text-xs sm:text-sm">
                Manage the behavior and optimization goals of the automatic scheduling formula. Changes here affect 'all' branches.
              </p>
            </div>
            <Button variant="primary" icon={<Save className="w-4 h-4" />} onClick={handleSave} className="w-full sm:w-auto">
              Save Configuration
            </Button>
          </div>

          <div className="mb-6">
            <h3 className="text-white font-medium mb-4">Soft Constraint Toggles</h3>
            
            {/* Warning Note */}
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">
                Note on Hard Constraints: These are mandatory and cannot be disabled. They ensure the schedule is valid and conflict-free.
              </p>
            </div>

            {/* Constraint Toggles */}
            <div className="space-y-3">
              {constraints.map((constraint) => (
                <SoftConstraintToggle
                  key={constraint.id}
                  id={constraint.id}
                  title={constraint.title}
                  description={constraint.description}
                  enabled={constraint.enabled}
                  onChange={(enabled) => handleConstraintChange(constraint.id, enabled)}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="primary" icon={<Save className="w-4 h-4" />} onClick={handleSave}>
              Save Configuration
            </Button>
          </div>
        </Card>

        {/* Calendar Settings */}
        <CalendarSettings onEdit={handleEditCalendar} />
      </div>
    </MainLayout>
  )
}

