'use client'

import { useState, useMemo } from 'react'
import { X, ArrowLeft, Calendar, Cpu, User, Download, Printer, Filter } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ScheduleCalendar } from './ScheduleCalendar'
import { Schedule } from './types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'

interface ScheduleViewerProps {
    schedule: Schedule
    onClose: () => void
    onEdit: () => void
}

export function ScheduleViewer({ schedule, onClose, onEdit }: ScheduleViewerProps) {
    const [levelFilter, setLevelFilter] = useState<string>('all')
    const [collegeFilter, setCollegeFilter] = useState<string>('all')

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    // Extract unique colleges from events for filter options
    const uniqueColleges = useMemo(() => {
        const colleges = new Set<string>()
        schedule.events.forEach(e => {
            if (e.college) colleges.add(e.college)
        })
        return Array.from(colleges).sort()
    }, [schedule.events])

    const filteredEvents = useMemo(() => {
        return schedule.events.filter(e => {
            const matchesLevel = levelFilter === 'all' || e.year?.toString() === levelFilter
            const matchesCollege = collegeFilter === 'all' || e.college === collegeFilter
            return matchesLevel && matchesCollege
        })
    }, [schedule.events, levelFilter, collegeFilter])

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
                                <Badge variant={schedule.status === 'published' ? 'published' : 'draft'}>
                                    {schedule.status === 'published' ? 'Published' : 'Draft'}
                                </Badge>
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
                                            <Cpu className="w-3 h-3" /> AI Generated
                                        </>
                                    ) : (
                                        <>
                                            <User className="w-3 h-3" /> Created Manually
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
                            icon={<Printer className="w-4 h-4" />}
                            onClick={() => window.print()}
                        >
                            Print
                        </Button>
                        <Button
                            variant="primary"
                            onClick={onEdit}
                        >
                            Edit Schedule
                        </Button>
                    </div>
                </div>
            </div>

            {/* Info Bar */}
            <div className="bg-gray-800/50 border-b border-gray-700 px-4 sm:px-6 py-3">
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                        <span>Created:</span>
                        <span className="text-white">{formatDate(schedule.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                        <span>Last Updated:</span>
                        <span className="text-white">{formatDate(schedule.updatedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                        <span>Total Lectures:</span>
                        <span className="text-teal-400 font-semibold">{schedule.events.length}</span>
                    </div>
                </div>
            </div>

            {/* Filters and Legend */}
            <div className="px-4 sm:px-6 py-3 bg-gray-900/50 border-b border-gray-700">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    {/* Coloring Legend */}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="text-gray-400">Level:</span>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-green-500"></span><span className="text-green-300">Y1</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-blue-500"></span><span className="text-blue-300">Y2</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-purple-500"></span><span className="text-purple-300">Y3</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-orange-500"></span><span className="text-orange-300">Y4</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-red-500"></span><span className="text-red-300">Y5</span>
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
                    isEditable={false}
                />
            </div>
        </div>
    )
}
