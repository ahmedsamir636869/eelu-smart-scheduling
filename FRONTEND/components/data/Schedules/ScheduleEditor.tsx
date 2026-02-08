'use client'

import { useState, useMemo } from 'react'
import { X, Save, Upload, ArrowLeft, Calendar, Cpu, User, Filter } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ScheduleCalendar } from './ScheduleCalendar'
import { Schedule, ScheduleEvent, DayOfWeek } from './types'
import { cn } from '@/lib/utils'

interface ScheduleEditorProps {
    schedule: Schedule
    onClose: () => void
    onSaveAsDraft: (schedule: Schedule) => Promise<void>
    onSaveAndPublish: (schedule: Schedule) => Promise<void>
}

export function ScheduleEditor({
    schedule,
    onClose,
    onSaveAsDraft,
    onSaveAndPublish,
}: ScheduleEditorProps) {
    const [events, setEvents] = useState<ScheduleEvent[]>(schedule.events)
    const [saving, setSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)
    const [levelFilter, setLevelFilter] = useState<string>('all')
    const [collegeFilter, setCollegeFilter] = useState<string>('all')

    const handleEventMove = (
        eventId: string,
        newDay: DayOfWeek,
        newStartTime: string,
        newEndTime: string
    ) => {
        setEvents((prevEvents) =>
            prevEvents.map((event) =>
                event.id === eventId
                    ? { ...event, day: newDay, startTime: newStartTime, endTime: newEndTime }
                    : event
            )
        )
        setHasChanges(true)
    }

    // Extract unique colleges from events for filter options
    const uniqueColleges = useMemo(() => {
        const colleges = new Set<string>()
        events.forEach(e => {
            if (e.college) colleges.add(e.college)
        })
        return Array.from(colleges).sort()
    }, [events])

    const filteredEvents = events.filter(e => {
        const matchesLevel = levelFilter === 'all' || e.year?.toString() === levelFilter
        const matchesCollege = collegeFilter === 'all' || e.college === collegeFilter
        return matchesLevel && matchesCollege
    })

    const handleSaveAsDraft = async () => {
        try {
            setSaving(true)
            await onSaveAsDraft({
                ...schedule,
                events,
                status: 'draft',
                updatedAt: new Date().toISOString(),
            })
            setHasChanges(false)
        } catch (error) {
            console.error('Error saving draft:', error)
        } finally {
            setSaving(false)
        }
    }

    const handleSaveAndPublish = async () => {
        try {
            setSaving(true)
            await onSaveAndPublish({
                ...schedule,
                events,
                status: 'published',
                updatedAt: new Date().toISOString(),
            })
            setHasChanges(false)
        } catch (error) {
            console.error('Error publishing schedule:', error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-gray-950 z-50 flex flex-col">
            {/* Header */}
            <div className="bg-gray-900 border-b border-gray-700 px-4 sm:px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left side - Back button and title */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-teal-400" />
                                <h1 className="text-white font-bold text-lg sm:text-xl">{schedule.name}</h1>
                                {hasChanges && (
                                    <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                                        Unsaved Changes
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-400 text-sm mt-1">
                                {schedule.collegeName}
                                <span className="mx-2">•</span>
                                <span className={cn(
                                    'inline-flex items-center gap-1',
                                    schedule.generatedBy === 'ai' ? 'text-purple-400' : 'text-blue-400'
                                )}>
                                    {schedule.generatedBy === 'ai' ? (
                                        <>
                                            <Cpu className="w-3 h-3" /> AI
                                        </>
                                    ) : (
                                        <>
                                            <User className="w-3 h-3" /> Manual
                                        </>
                                    )}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Right side - Action buttons */}
                    <div className="flex items-center gap-3">
                        <Button
                            variant="secondary"
                            icon={<Save className="w-4 h-4" />}
                            onClick={handleSaveAsDraft}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save as Draft'}
                        </Button>
                        <Button
                            variant="success"
                            icon={<Upload className="w-4 h-4" />}
                            onClick={handleSaveAndPublish}
                            disabled={saving}
                        >
                            {saving ? 'Publishing...' : 'Save & Publish'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filters and Legend */}
            <div className="px-4 sm:px-6 py-3 bg-gray-900/50 border-b border-gray-700">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="text-gray-400">Color Legend:</span>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-blue-500"></span><span className="text-blue-300">Level (Y2)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="text-gray-500 text-xs">
                                Colors indicate Year/Level.
                            </p>
                        </div>
                    </div>

                    {/* Filter Controls */}
                    <div className="flex items-center gap-4">
                        {/* College Filter */}
                        {uniqueColleges.length > 0 && (
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-400 text-sm">College:</span>
                                <select
                                    className="bg-gray-800 border-gray-700 text-white text-sm rounded-md p-1.5 focus:ring-teal-500 focus:border-teal-500 outline-none"
                                    value={collegeFilter}
                                    onChange={(e) => setCollegeFilter(e.target.value)}
                                >
                                    <option value="all" className="bg-gray-800 text-white">All Colleges</option>
                                    {uniqueColleges.map(c => (
                                        <option key={c} value={c} className="bg-gray-800 text-white">{c}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Level Filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm">Level:</span>
                            <select
                                className="bg-gray-800 border-gray-700 text-white text-sm rounded-md p-1.5 focus:ring-teal-500 focus:border-teal-500 outline-none"
                                value={levelFilter}
                                onChange={(e) => setLevelFilter(e.target.value)}
                            >
                                <option value="all" className="bg-gray-800 text-white">All Levels</option>
                                <option value="1" className="bg-gray-800 text-white">Year 1</option>
                                <option value="2" className="bg-gray-800 text-white">Year 2</option>
                                <option value="3" className="bg-gray-800 text-white">Year 3</option>
                                <option value="4" className="bg-gray-800 text-white">Year 4</option>
                                <option value="5" className="bg-gray-800 text-white">Year 5</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>


            {/* Calendar Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <ScheduleCalendar
                    events={filteredEvents}
                    onEventMove={handleEventMove}
                    isEditable={true}
                />
            </div>
        </div>
    )
}
