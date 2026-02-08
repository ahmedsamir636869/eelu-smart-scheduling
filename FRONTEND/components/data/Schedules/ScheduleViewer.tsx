'use client'

import { useState, useMemo } from 'react'
import { X, ArrowLeft, Calendar, Cpu, User, Download, Printer, Filter, FileSpreadsheet, FileJson } from 'lucide-react'
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
            if (e.college && e.college !== 'General') colleges.add(e.college)
        })

        // If no colleges found, add the schedule's college name
        if (colleges.size === 0 && schedule.collegeName && schedule.collegeName !== 'General') {
            colleges.add(schedule.collegeName)
        }

        return Array.from(colleges).sort()
    }, [schedule.events, schedule.collegeName])

    const filteredEvents = useMemo(() => {
        return schedule.events.filter(e => {
            const matchesLevel = levelFilter === 'all' || e.year?.toString() === levelFilter
            const matchesCollege = collegeFilter === 'all' || e.college === collegeFilter
            return matchesLevel && matchesCollege
        })
    }, [schedule.events, levelFilter, collegeFilter])

    // Export to JSON
    const exportToJSON = () => {
        const exportData = {
            scheduleId: schedule.id,
            scheduleName: schedule.name,
            collegeName: schedule.collegeName,
            status: schedule.status,
            generatedBy: schedule.generatedBy,
            exportedAt: new Date().toISOString(),
            totalSessions: schedule.events.length,
            sessions: schedule.events.map(event => ({
                id: event.id,
                courseName: event.courseName,
                courseCode: event.courseCode,
                instructor: event.instructor,
                room: event.location,
                day: event.day,
                startTime: event.startTime,
                endTime: event.endTime,
                type: event.type,
                year: event.year,
                college: event.college
            }))
        }

        const jsonString = JSON.stringify(exportData, null, 2)
        const blob = new Blob([jsonString], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `schedule_${schedule.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    // Export to Excel (CSV format)
    const exportToExcel = () => {
        const headers = ['Day', 'Course Name', 'Course Code', 'College', 'Instructor', 'Room', 'Start Time', 'End Time', 'Type', 'Year']

        const formatTime12h = (time24: string): string => {
            if (!time24) return ''
            try {
                const [hours, minutes] = time24.split(':').map(Number)
                const ampm = hours >= 12 ? 'PM' : 'AM'
                const hour12 = hours % 12 || 12
                return `${hour12}:${String(minutes).padStart(2, '0')} ${ampm}`
            } catch {
                return time24
            }
        }

        const rows = schedule.events.map(event => [
            event.day,
            event.courseName,
            event.courseCode,
            event.college || '',
            event.instructor,
            event.location,
            formatTime12h(event.startTime),
            formatTime12h(event.endTime),
            event.type,
            event.year?.toString() || ''
        ])

        // Sort by day and time
        const dayOrder = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        rows.sort((a, b) => {
            const dayA = dayOrder.indexOf(a[0])
            const dayB = dayOrder.indexOf(b[0])
            if (dayA !== dayB) return dayA - dayB
            return a[6].localeCompare(b[6])
        })

        // Escape CSV values
        const escapeCSV = (value: string) => {
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`
            }
            return value
        }

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(escapeCSV).join(','))
        ].join('\n')

        // Add BOM for Excel to recognize UTF-8
        const BOM = '\uFEFF'
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `schedule_${schedule.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
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
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <button
                            onClick={exportToExcel}
                            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span className="hidden sm:inline">Excel</span>
                        </button>
                        <button
                            onClick={exportToJSON}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            <FileJson className="w-4 h-4" />
                            <span className="hidden sm:inline">JSON</span>
                        </button>
                        <Button
                            variant="secondary"
                            icon={<Printer className="w-4 h-4" />}
                            onClick={() => window.print()}
                        >
                            <span className="hidden sm:inline">Print</span>
                        </Button>
                        <Button
                            variant="primary"
                            onClick={onEdit}
                        >
                            Edit
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
            <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-gray-900/80 to-gray-800/80 border-b border-gray-700/60 backdrop-blur-sm">
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                    {/* Coloring Legend */}
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="text-gray-400 font-medium">Year Colors:</span>
                        <div className="flex items-center gap-3 bg-gray-800/50 px-3 py-1.5 rounded-lg border border-gray-700/50">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm bg-green-500"></span><span className="text-green-300 text-xs">Y1</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span><span className="text-blue-300 text-xs">Y2</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm bg-purple-500"></span><span className="text-purple-300 text-xs">Y3</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm bg-orange-500"></span><span className="text-orange-300 text-xs">Y4</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm bg-red-500"></span><span className="text-red-300 text-xs">Y5</span>
                            </div>
                        </div>
                    </div>

                    {/* Filter Controls */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* College Filter */}
                        <div className="flex items-center gap-2 bg-gray-800/60 px-3 py-2 rounded-lg border border-gray-700/50">
                            <Filter className="w-4 h-4 text-teal-400" />
                            <span className="text-gray-300 text-sm font-medium">College:</span>
                            <select
                                className="bg-gray-900/80 border border-gray-600 text-white text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none min-w-[140px] cursor-pointer hover:bg-gray-800 transition-colors"
                                value={collegeFilter}
                                onChange={(e) => setCollegeFilter(e.target.value)}
                            >
                                <option value="all" className="bg-gray-900 text-white">All Colleges</option>
                                {uniqueColleges.map(c => (
                                    <option key={c} value={c} className="bg-gray-900 text-white">{c}</option>
                                ))}
                            </select>
                        </div>

                        {/* Level Filter */}
                        <div className="flex items-center gap-2 bg-gray-800/60 px-3 py-2 rounded-lg border border-gray-700/50">
                            <span className="text-gray-300 text-sm font-medium">Level:</span>
                            <select
                                className="bg-gray-900/80 border border-gray-600 text-white text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none min-w-[110px] cursor-pointer hover:bg-gray-800 transition-colors"
                                value={levelFilter}
                                onChange={(e) => setLevelFilter(e.target.value)}
                            >
                                <option value="all" className="bg-gray-900 text-white">All Levels</option>
                                <option value="1" className="bg-gray-900 text-white">Year 1</option>
                                <option value="2" className="bg-gray-900 text-white">Year 2</option>
                                <option value="3" className="bg-gray-900 text-white">Year 3</option>
                                <option value="4" className="bg-gray-900 text-white">Year 4</option>
                                <option value="5" className="bg-gray-900 text-white">Year 5</option>
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
