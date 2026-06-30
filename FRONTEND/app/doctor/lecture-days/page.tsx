'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Check, X } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { instructorAvailabilityApi } from '@/lib/api'

const DAYS = [
  { key: 'SATURDAY', label: 'Saturday' },
  { key: 'SUNDAY', label: 'Sunday' },
  { key: 'MONDAY', label: 'Monday' },
  { key: 'TUESDAY', label: 'Tuesday' },
  { key: 'WEDNESDAY', label: 'Wednesday' },
  { key: 'THURSDAY', label: 'Thursday' },
] as const

interface DaySelection {
  day: string
  selected: boolean
  startTime: string
  endTime: string
}

export default function DoctorLectureDaysPage() {
  const [days, setDays] = useState<DaySelection[]>(
    DAYS.map((d) => ({
      day: d.key,
      selected: false,
      startTime: '08:00',
      endTime: '17:00',
    }))
  )
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [existingAvailability, setExistingAvailability] = useState<any[]>([])

  useEffect(() => {
    fetchExistingAvailability()
  }, [])

  const fetchExistingAvailability = async () => {
    try {
      const data = await instructorAvailabilityApi.getMyAvailability().catch(() => [])
      if (Array.isArray(data)) {
        setExistingAvailability(data)
        // Mark existing days as selected
        setDays((prev) =>
          prev.map((d) => {
            const existing = data.find((a: any) => a.day === d.day)
            if (existing) {
              return { ...d, selected: true }
            }
            return d
          })
        )
      }
    } catch (err) {
      console.error('Error fetching availability:', err)
    }
  }

  const toggleDay = (dayKey: string) => {
    setDays((prev) =>
      prev.map((d) =>
        d.day === dayKey ? { ...d, selected: !d.selected } : d
      )
    )
  }

  const handleFinalize = async () => {
    const selectedDays = days.filter((d) => d.selected)
    if (selectedDays.length === 0) {
      setError('Please select at least one day.')
      return
    }

    // Only include days not already submitted
    const newSlots = selectedDays
      .filter((day) => !existingAvailability.find((a: any) => a.day === day.day))
      .map((day) => ({
        day: day.day,
        startTime: new Date(`2024-01-01T${day.startTime}:00Z`).toISOString(),
        endTime: new Date(`2024-01-01T${day.endTime}:00Z`).toISOString(),
      }))

    if (newSlots.length === 0) {
      setError('All selected days are already submitted.')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      // Send all slots in one request: { slots: [...] }
      await instructorAvailabilityApi.submitAvailability(newSlots)
      setSuccess('Availability submitted successfully!')
      fetchExistingAvailability()
    } catch (err: any) {
      setError(err.message || 'Failed to submit availability.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
      <MainLayout title="Direct Upload">
        {/* Back Link */}
        <Link
          href="/doctor"
          className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit to Overview
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Select Availability</h2>
          <button
            onClick={handleFinalize}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
          >
            <Check className="w-4 h-4" />
            {submitting ? 'Submitting...' : 'Finalize & Send'}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-3 bg-green-900/50 border border-green-700 rounded-lg text-green-200 text-sm">
            {success}
          </div>
        )}

        {/* Day Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {days.map((day) => {
            const dayLabel = DAYS.find((d) => d.key === day.day)?.label || day.day
            const isExisting = existingAvailability.some((a: any) => a.day === day.day)

            return (
              <div
                key={day.day}
                className={`relative rounded-2xl border-2 p-6 min-h-[180px] transition-all duration-300 cursor-pointer group ${
                  day.selected
                    ? 'border-teal-400 bg-teal-900/20 shadow-lg shadow-teal-400/10'
                    : 'border-teal-700/30 bg-gray-800/40 hover:border-teal-600/50 hover:bg-gray-800/60'
                }`}
                onClick={() => !isExisting && toggleDay(day.day)}
              >
                {/* Selection indicator */}
                {day.selected && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}

                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">{dayLabel}</h3>
                  {!isExisting && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleDay(day.day)
                      }}
                      className="w-8 h-8 rounded-lg bg-teal-800/40 text-teal-400 hover:bg-teal-700/50 flex items-center justify-center transition-colors border border-teal-700/30"
                    >
                      {day.selected ? (
                        <X className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>

                <p className="text-xs font-semibold text-teal-400/60 uppercase tracking-wider">
                  {isExisting
                    ? 'ALREADY SUBMITTED'
                    : day.selected
                    ? 'SELECTED FOR LECTURES'
                    : 'AVAILABLE FOR LECTURES'}
                </p>
              </div>
            )
          })}
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}
