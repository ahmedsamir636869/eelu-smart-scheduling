'use client'

import { useState, useCallback, useMemo } from 'react'
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
                    // Parse event times
                    const eventStart = parseTimeToMinutes(event.startTime)
                    
                    // Debug logging
                    if (process.env.NODE_ENV === 'development' && slotStart === 480) {
                        console.log(`Checking ${event.courseCode} (${event.startTime}) for slot ${slotStartTime}-${slotEndTime}:`, {
                            eventStart,
                            slotStart,
                            nextSlotStart,
                            inRange: eventStart >= slotStart && eventStart < nextSlotStart
                        })
                    }
                    
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
        <div className="w-full overflow-x-auto">
            <div className="min-w-[900px] w-full inline-block">
                {/* Calendar Grid */}
                <div className="bg-gray-800 rounded-xl border border-gray-700">
                    {/* Header Row - Time Slots (Sticky) */}
                    <div className="sticky top-0 z-20 grid bg-gray-800" style={{ gridTemplateColumns: `120px repeat(${TIME_SLOTS.length}, 1fr)` }}>
                        {/* Empty corner cell */}
                        <div className="bg-gray-900 p-3 border-b border-r border-gray-700 flex items-center justify-center sticky left-0 z-30 shadow-lg">
                            <Clock className="w-5 h-5 text-gray-400" />
                        </div>
                        {/* Time slot headers */}
                        {TIME_SLOTS.map((slot, idx) => (
                            <div
                                key={slot.id}
                                className="bg-gray-900 p-3 border-b border-r border-gray-700 text-center last:border-r-0 shadow-lg"
                            >
                                <div className="text-teal-400 font-semibold text-sm whitespace-nowrap">
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
                            style={{ gridTemplateColumns: `120px repeat(${TIME_SLOTS.length}, 1fr)` }}
                        >
                            {/* Day Label (Sticky on horizontal scroll) */}
                            <div
                                className={cn(
                                    'p-3 border-r border-gray-700 flex items-center justify-center sticky left-0 z-[15] shadow-lg',
                                    dayIndex % 2 === 0 ? 'bg-gray-850' : 'bg-gray-800',
                                    dayIndex < DAYS_OF_WEEK.length - 1 && 'border-b'
                                )}
                            >
                                <span className="text-white font-medium text-sm whitespace-nowrap">{DAY_LABELS[day]}</span>
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
                                            'min-h-[120px] p-1.5 border-r border-gray-700 last:border-r-0 transition-all duration-200',
                                            dayIndex % 2 === 0 ? 'bg-gray-850' : 'bg-gray-800',
                                            dayIndex < DAYS_OF_WEEK.length - 1 && 'border-b',
                                            isDropTarget && 'bg-teal-500/20 border-2 border-dashed border-teal-500',
                                            isEditable && 'hover:bg-gray-700/50'
                                        )}
                                        style={{ 
                                            minHeight: slotEvents.length > 0 ? `${Math.max(120, slotEvents.length * 140)}px` : '120px'
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
    )
}

interface EventCardProps {
    event: ScheduleEvent
    isDragging: boolean
    isEditable: boolean
    onDragStart: (e: React.DragEvent) => void
    onDragEnd: () => void
}

function EventCard({ event, isDragging, isEditable, onDragStart, onDragEnd }: EventCardProps) {
    const colors = EVENT_COLORS[event.type] || EVENT_COLORS.lecture

    return (
        <div
            draggable={isEditable}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className={cn(
                'rounded-lg p-2 border transition-all duration-200',
                colors.bg,
                colors.border,
                isDragging && 'opacity-50 scale-95',
                isEditable && 'cursor-grab active:cursor-grabbing hover:scale-[1.02]'
            )}
        >
            {/* Drag Handle */}
            {isEditable && (
                <div className="flex justify-center mb-1">
                    <GripVertical className="w-4 h-4 text-gray-500" />
                </div>
            )}

            {/* Course Info */}
            <div className="space-y-1">
                <div className={cn('font-semibold text-xs', colors.text)}>
                    {event.courseCode}
                </div>
                <div className="text-white text-xs font-medium truncate">
                    {event.courseName}
                </div>
                <div className="flex items-center gap-1 text-gray-400 text-[10px]">
                    <User className="w-3 h-3" />
                    <span className="truncate">{event.instructor}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400 text-[10px]">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{event.location}</span>
                </div>
            </div>

            {/* Type Badge */}
            <div className="mt-2">
                <span
                    className={cn(
                        'px-1.5 py-0.5 rounded text-[10px] font-medium',
                        event.type === 'lecture' && 'bg-blue-500/30 text-blue-300',
                        event.type === 'lab' && 'bg-purple-500/30 text-purple-300',
                        event.type === 'tutorial' && 'bg-teal-500/30 text-teal-300'
                    )}
                >
                    {event.type === 'lecture' && 'Lecture'}
                    {event.type === 'lab' && 'Lab'}
                    {event.type === 'tutorial' && 'Tutorial'}
                </span>
            </div>
        </div>
    )
}
