'use client'

import { useState, useCallback } from 'react'
import { GripVertical, Clock, MapPin, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    ScheduleEvent,
    TIME_SLOTS,
    DAYS_OF_WEEK,
    DAY_LABELS,
    EVENT_COLORS,
    DayOfWeek,
} from './types'

interface ScheduleCalendarProps {
    events: ScheduleEvent[]
    onEventMove?: (eventId: string, newDay: DayOfWeek, newStartTime: string, newEndTime: string) => void
    isEditable?: boolean
}

export function ScheduleCalendar({ events, onEventMove, isEditable = true }: ScheduleCalendarProps) {
    const [draggedEvent, setDraggedEvent] = useState<ScheduleEvent | null>(null)
    const [dragOverSlot, setDragOverSlot] = useState<{ day: DayOfWeek; timeSlot: string } | null>(null)

    // Helper: parse "HH:MM" to minutes since midnight
    const parseTimeToMinutes = (time: string): number => {
        const [h, m] = time.split(':').map(Number)
        return h * 60 + (m || 0)
    }

    // Get events for a specific day and time slot (flexible matching: event falls within slot range)
    const getEventsForSlot = useCallback(
        (day: DayOfWeek, slotStartTime: string, slotEndTime: string) => {
            if (!events || events.length === 0) return []

            const slotStart = parseTimeToMinutes(slotStartTime)
            const slotEnd = parseTimeToMinutes(slotEndTime)
            const slotIdx = TIME_SLOTS.findIndex(s => s.startTime === slotStartTime)
            const nextSlotStart = slotIdx < TIME_SLOTS.length - 1
                ? parseTimeToMinutes(TIME_SLOTS[slotIdx + 1].startTime)
                : slotEnd + 60 // after last slot

            const matchedEvents = events.filter((event) => {
                if (!event || !event.day || !event.startTime) return false

                // Normalize day names for comparison (case-insensitive, handle variations)
                const eventDay = String(event.day).trim()
                const slotDay = String(day).trim()

                // Direct match
                if (eventDay.toLowerCase() === slotDay.toLowerCase()) {
                    const eventStart = parseTimeToMinutes(event.startTime)

                    // Event belongs to this slot if it starts within the slot range
                    // For consecutive slots: eventStart >= slotStart && eventStart < nextSlotStart
                    if (eventStart >= slotStart && eventStart < nextSlotStart) {
                        return true
                    }

                    // Also check if event overlaps with the slot (for events that span multiple slots)
                    const eventEnd = parseTimeToMinutes(event.endTime || event.startTime)
                    if (eventStart < slotEnd && eventEnd > slotStart) {
                        return true
                    }
                }

                return false
            })

            return matchedEvents
        },
        [events]
    )

    // Drag handlers
    const handleDragStart = (e: React.DragEvent, event: ScheduleEvent) => {
        if (!isEditable) return
        setDraggedEvent(event)
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', event.id)
    }

    const handleDragOver = (e: React.DragEvent, day: DayOfWeek, slotStartTime: string) => {
        if (!isEditable) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setDragOverSlot({ day, timeSlot: slotStartTime })
    }

    const handleDragLeave = () => {
        setDragOverSlot(null)
    }

    const handleDrop = (e: React.DragEvent, day: DayOfWeek, slotStartTime: string) => {
        if (!isEditable) return
        e.preventDefault()
        setDragOverSlot(null)

        if (draggedEvent && onEventMove) {
            // Find the corresponding end time from TIME_SLOTS
            const slot = TIME_SLOTS.find((s) => s.startTime === slotStartTime)
            if (slot) {
                onEventMove(draggedEvent.id, day, slot.startTime, slot.endTime)
            }
        }
        setDraggedEvent(null)
    }

    const handleDragEnd = () => {
        setDraggedEvent(null)
        setDragOverSlot(null)
    }

    return (
        <div className="w-full">
            {/* Mobile hint */}
            <div className="md:hidden mb-3 p-2 bg-gray-800/50 rounded-lg border border-gray-700 text-center">
                <p className="text-gray-400 text-xs">👆 Scroll horizontally to view all time slots</p>
            </div>

            <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800 pb-2">
                <div className="min-w-[800px] lg:min-w-full">
                    {/* Calendar Grid */}
                    <div className="bg-gray-800/80 rounded-xl border border-gray-700/80 shadow-xl backdrop-blur-sm">
                        {/* Header Row - Time Slots (Sticky) */}
                        <div className="sticky top-0 z-20 grid bg-gray-900/95 backdrop-blur-sm rounded-t-xl" style={{ gridTemplateColumns: `100px repeat(${TIME_SLOTS.length}, minmax(120px, 1fr))` }}>
                            {/* Empty corner cell */}
                            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-2 sm:p-3 border-b border-r border-gray-700/60 flex items-center justify-center sticky left-0 z-30 rounded-tl-xl">
                                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400" />
                            </div>
                            {/* Time slot headers */}
                            {TIME_SLOTS.map((slot, idx) => (
                                <div
                                    key={slot.id}
                                    className={cn(
                                        "bg-gradient-to-br from-gray-800 to-gray-900 p-2 sm:p-3 border-b border-r border-gray-700/60 text-center",
                                        idx === TIME_SLOTS.length - 1 && "border-r-0 rounded-tr-xl"
                                    )}
                                >
                                    <div className="text-teal-400 font-semibold text-xs sm:text-sm whitespace-nowrap">
                                        {slot.startTime}
                                    </div>
                                    <div className="text-gray-500 text-xs whitespace-nowrap">
                                        {slot.endTime}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Day Rows */}
                        {DAYS_OF_WEEK.map((day, dayIndex) => (
                            <div
                                key={day}
                                className="grid"
                                style={{ gridTemplateColumns: `100px repeat(${TIME_SLOTS.length}, minmax(120px, 1fr))` }}
                            >
                                {/* Day Label (Sticky on horizontal scroll) */}
                                <div
                                    className={cn(
                                        'p-2 sm:p-3 border-r border-gray-700/60 flex items-center justify-center sticky left-0 z-[15]',
                                        dayIndex % 2 === 0
                                            ? 'bg-gradient-to-r from-gray-850 to-gray-800'
                                            : 'bg-gradient-to-r from-gray-800 to-gray-850',
                                        dayIndex < DAYS_OF_WEEK.length - 1 && 'border-b border-gray-700/60',
                                        dayIndex === DAYS_OF_WEEK.length - 1 && 'rounded-bl-xl'
                                    )}
                                >
                                    <span className="text-white font-medium text-xs sm:text-sm whitespace-nowrap">{DAY_LABELS[day]}</span>
                                </div>

                                {/* Time Slots for this day */}
                                {TIME_SLOTS.map((slot, slotIndex) => {
                                    const slotEvents = getEventsForSlot(day, slot.startTime, slot.endTime)
                                    const isDropTarget =
                                        dragOverSlot?.day === day && dragOverSlot?.timeSlot === slot.startTime

                                    return (
                                        <div
                                            key={`${day}-${slot.id}`}
                                            className={cn(
                                                'min-h-[100px] sm:min-h-[120px] p-1.5 sm:p-2 border-r border-gray-700/40 last:border-r-0 transition-all duration-200',
                                                dayIndex % 2 === 0 ? 'bg-gray-850/50' : 'bg-gray-800/50',
                                                dayIndex < DAYS_OF_WEEK.length - 1 && 'border-b border-gray-700/40',
                                                isDropTarget && 'bg-teal-500/20 border-2 border-dashed border-teal-400 rounded-lg',
                                                isEditable && 'hover:bg-gray-700/30',
                                                dayIndex === DAYS_OF_WEEK.length - 1 && slotIndex === TIME_SLOTS.length - 1 && 'rounded-br-xl'
                                            )}
                                            style={{
                                                minHeight: slotEvents.length > 0 ? `${Math.max(100, slotEvents.length * 130)}px` : undefined
                                            }}
                                            onDragOver={(e) => handleDragOver(e, day, slot.startTime)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, day, slot.startTime)}
                                        >
                                            {slotEvents.length > 0 ? (
                                                <div className="flex flex-col gap-1.5">
                                                    {slotEvents.map((event) => (
                                                        <EventCard
                                                            key={event.id}
                                                            event={event}
                                                            isDragging={draggedEvent?.id === event.id}
                                                            isEditable={isEditable}
                                                            onDragStart={(e) => handleDragStart(e, event)}
                                                            onDragEnd={handleDragEnd}
                                                        />
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

interface EventCardProps {
    event: ScheduleEvent
    isDragging: boolean
    isEditable: boolean
    onDragStart: (e: React.DragEvent) => void
    onDragEnd: () => void
}

// Color mapping based on year/level (reused from logic)
const getYearColors = (year?: number, type: 'lecture' | 'lab' | 'tutorial' = 'lecture') => {
    // Default colors if year is not available or is 0
    if (!year || year === 0) {
        return EVENT_COLORS[type] || EVENT_COLORS.lecture
    }

    // Year-based color schemes
    const yearColors: Record<number, { lecture: any, lab: any, tutorial: any }> = {
        1: {
            lecture: { bg: 'bg-green-600/30', border: 'border-green-500', text: 'text-green-300', badge: 'bg-green-500/30 text-green-300' },
            lab: { bg: 'bg-emerald-600/30', border: 'border-emerald-500', text: 'text-emerald-300', badge: 'bg-emerald-500/30 text-emerald-300' },
            tutorial: { bg: 'bg-emerald-600/30', border: 'border-emerald-500', text: 'text-emerald-300', badge: 'bg-emerald-500/30 text-emerald-300' }
        },
        2: {
            lecture: { bg: 'bg-blue-600/30', border: 'border-blue-500', text: 'text-blue-300', badge: 'bg-blue-500/30 text-blue-300' },
            lab: { bg: 'bg-cyan-600/30', border: 'border-cyan-500', text: 'text-cyan-300', badge: 'bg-cyan-500/30 text-cyan-300' },
            tutorial: { bg: 'bg-cyan-600/30', border: 'border-cyan-500', text: 'text-cyan-300', badge: 'bg-cyan-500/30 text-cyan-300' }
        },
        3: {
            lecture: { bg: 'bg-purple-600/30', border: 'border-purple-500', text: 'text-purple-300', badge: 'bg-purple-500/30 text-purple-300' },
            lab: { bg: 'bg-violet-600/30', border: 'border-violet-500', text: 'text-violet-300', badge: 'bg-violet-500/30 text-violet-300' },
            tutorial: { bg: 'bg-violet-600/30', border: 'border-violet-500', text: 'text-violet-300', badge: 'bg-violet-500/30 text-violet-300' }
        },
        4: {
            lecture: { bg: 'bg-orange-600/30', border: 'border-orange-500', text: 'text-orange-300', badge: 'bg-orange-500/30 text-orange-300' },
            lab: { bg: 'bg-amber-600/30', border: 'border-amber-500', text: 'text-amber-300', badge: 'bg-amber-500/30 text-amber-300' },
            tutorial: { bg: 'bg-amber-600/30', border: 'border-amber-500', text: 'text-amber-300', badge: 'bg-amber-500/30 text-amber-300' }
        },
        5: {
            lecture: { bg: 'bg-red-600/30', border: 'border-red-500', text: 'text-red-300', badge: 'bg-red-500/30 text-red-300' },
            lab: { bg: 'bg-rose-600/30', border: 'border-rose-500', text: 'text-rose-300', badge: 'bg-rose-500/30 text-rose-300' },
            tutorial: { bg: 'bg-rose-600/30', border: 'border-rose-500', text: 'text-rose-300', badge: 'bg-rose-500/30 text-rose-300' }
        }
    }

    // Default to year 1 if year is out of range
    const yearKey = year >= 1 && year <= 5 ? year : 1
    return yearColors[yearKey][type]
}

function EventCard({ event, isDragging, isEditable, onDragStart, onDragEnd }: EventCardProps) {
    const colors = getYearColors(event.year, event.type)

    return (
        <div
            draggable={isEditable}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className={cn(
                'rounded-lg p-2 sm:p-2.5 border-l-4 transition-all duration-200 shadow-md backdrop-blur-sm',
                'bg-gray-800/90 hover:bg-gray-750/95',
                colors.border,
                isDragging && 'opacity-50 scale-95 shadow-xl',
                isEditable && 'cursor-grab active:cursor-grabbing hover:shadow-lg hover:translate-y-[-1px]'
            )}
        >
            {/* Header with Type Badge */}
            <div className="flex items-start justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-1 flex-wrap">
                    {(event.year !== undefined && event.year !== null) && (
                        <span
                            className={cn(
                                'px-1.5 py-0.5 rounded text-[10px] font-semibold',
                                colors.badge
                            )}
                        >
                            Y{event.year}
                        </span>
                    )}
                    <span
                        className={cn(
                            'px-1.5 py-0.5 rounded text-[10px] font-medium',
                            event.type === 'lecture' ? 'bg-blue-500/20 text-blue-300' :
                                event.type === 'lab' ? 'bg-purple-500/20 text-purple-300' :
                                    'bg-teal-500/20 text-teal-300'
                        )}
                    >
                        {event.type === 'lecture' && '📚'}
                        {event.type === 'lab' && '🔬'}
                        {event.type === 'tutorial' && '📝'}
                    </span>
                </div>
                {isEditable && (
                    <GripVertical className="w-3 h-3 text-gray-500 flex-shrink-0 mt-0.5" />
                )}
            </div>

            {/* Course Code & Name */}
            <div className="mb-1.5">
                <div className={cn('font-bold text-xs sm:text-sm leading-tight', colors.text)}>
                    {event.courseCode}
                </div>
                <div className="text-white text-[11px] sm:text-xs font-medium line-clamp-2 leading-tight mt-0.5">
                    {event.courseName}
                </div>
            </div>

            {/* Details */}
            <div className="space-y-1 text-[10px] sm:text-xs">
                {/* College */}
                {event.college && (
                    <div className="flex items-center gap-1 text-gray-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0"></span>
                        <span className="truncate">{event.college}</span>
                    </div>
                )}

                {/* Instructor */}
                <div className="flex items-center gap-1 text-gray-300">
                    <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0 text-gray-500" />
                    <span className="truncate">{event.instructor}</span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1 text-gray-300">
                    <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0 text-gray-500" />
                    <span className="truncate">{event.location}</span>
                </div>

                {/* Capacity Info */}
                {(event.roomCapacity !== undefined || event.studentCount !== undefined) && (
                    <div className="flex items-center gap-2 text-gray-500 pt-0.5 border-t border-gray-700/50 mt-1">
                        {event.studentCount !== undefined && (
                            <span className="flex items-center gap-0.5">
                                👥 {event.studentCount}
                            </span>
                        )}
                        {event.roomCapacity !== undefined && (
                            <span className="flex items-center gap-0.5">
                                🏫 {event.roomCapacity}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
