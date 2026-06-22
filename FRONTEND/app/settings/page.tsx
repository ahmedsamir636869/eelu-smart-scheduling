'use client'

import { useState, useEffect } from 'react'
import { Save, AlertTriangle, Loader2 } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SoftConstraintToggle } from '@/components/settings/SoftConstraintToggle'
import { CalendarSettings } from '@/components/settings/CalendarSettings'
import { constraintApi } from '@/lib/api'

interface SoftConstraint {
  id: string
  title: string
  description: string
  enabled: boolean
}

const DEFAULT_CONSTRAINTS = [
  {
    title: 'SC1: Staff Preference (TAs)',
    description: 'Respect TAs\' preferred day-offs whenever possible; may be overridden if no feasible solution exists.',
    type: 'OTHER', value: 'N/A', isActive: true,
  },
  {
    title: 'SC2: Staff Preference (Instructors)',
    description: 'Respect instructors\' preferred teaching days/times (e.g., morning or midweek).',
    type: 'OTHER', value: 'N/A', isActive: true,
  },
  {
    title: 'SC3: Time Distribution (Students)',
    description: 'Distribute lectures evenly throughout the week (avoid clustering).',
    type: 'OTHER', value: 'N/A', isActive: true,
  },
  {
    title: 'SC4: Optimization (Students / Staff)',
    description: 'Minimize idle gaps between consecutive sessions for both students and staff.',
    type: 'OTHER', value: 'N/A', isActive: true,
  },
  {
    title: 'SC5: Resource Optimization (IT)',
    description: 'Schedule sections earlier in the day (preferably before 4 PM) for optimal lab use.',
    type: 'OTHER', value: 'N/A', isActive: true,
  },
  {
    title: 'SC6: Course Organization (Students)',
    description: 'Group lectures and sections of the same course on nearby days for continuity.',
    type: 'OTHER', value: 'N/A', isActive: false,
  },
]

export default function SettingsPage() {
  const [constraints, setConstraints] = useState<SoftConstraint[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchConstraints = async () => {
      try {
        setLoading(true)
        let data = await constraintApi.getAll()
        
        // Seed initial constraints if the DB is empty
        if (data.length === 0) {
          console.log('Seeding initial constraints...')
          for (const c of DEFAULT_CONSTRAINTS) {
            await constraintApi.create({ name: c.title, description: c.description, type: c.type, value: c.value, isActive: c.isActive })
          }
          data = await constraintApi.getAll()
        }

        setConstraints(data.map((c: any) => ({
          id: c.id,
          title: c.name,
          description: c.description,
          enabled: c.isActive
        })))
      } catch (err) {
        console.error('Failed to fetch constraints', err)
      } finally {
        setLoading(false)
      }
    }
    fetchConstraints()
  }, [])

  const handleConstraintChange = (id: string, enabled: boolean) => {
    setConstraints(constraints.map(c => c.id === id ? { ...c, enabled } : c))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await Promise.all(constraints.map(c => 
        constraintApi.update(c.id, { isActive: c.enabled })
      ))
      alert('Configuration saved successfully!')
    } catch (err) {
      console.error('Failed to save constraints:', err)
      alert('Failed to save configuration.')
    } finally {
      setSaving(false)
    }
  }

  const handleEditCalendar = () => {
    alert('Calendar settings are managed automatically via the scheduling formula rules based on constraints.')
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
            <Button variant="primary" icon={<Save className="w-4 h-4" />} onClick={handleSave} disabled={loading || saving} className="w-full sm:w-auto">
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>

          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
              <h3 className="text-white font-medium">Soft Constraint Toggles</h3>
              <div className="flex items-center gap-2">
                <Button 
                  variant="secondary" 
                  onClick={() => setConstraints(constraints.map(c => ({ ...c, enabled: true })))} 
                  disabled={loading || saving}
                >
                  Enable All
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => setConstraints(constraints.map(c => ({ ...c, enabled: false })))} 
                  disabled={loading || saving}
                >
                  Disable All
                </Button>
              </div>
            </div>
            
            {/* Warning Note */}
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">
                Note on Hard Constraints: These are mandatory and cannot be disabled. They ensure the schedule is valid and conflict-free.
              </p>
            </div>

            {/* Constraint Toggles */}
            <div className="space-y-3">
              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                </div>
              ) : (
                constraints.map((constraint) => (
                  <SoftConstraintToggle
                    key={constraint.id}
                    id={constraint.id}
                    title={constraint.title}
                    description={constraint.description}
                    enabled={constraint.enabled}
                    onChange={(enabled) => handleConstraintChange(constraint.id, enabled)}
                  />
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="primary" icon={<Save className="w-4 h-4" />} onClick={handleSave} disabled={loading || saving}>
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </Card>

        {/* Calendar Settings */}
        <CalendarSettings onEdit={handleEditCalendar} />
      </div>
    </MainLayout>
  )
}

