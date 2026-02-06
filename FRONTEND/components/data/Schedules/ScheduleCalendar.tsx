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

    // Get events for a specific day and time slot
    const getEventsForSlot = useCallback(
        (day: DayOfWeek, slotStartTime: string) => {
            return events.filter(
                (event) => event.day === day && event.startTime === slotStartTime
            )
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
        <div className="overflow-x-auto">
            <div className="min-w-[900px]">
                {/* Calendar Grid */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                    {/* Header Row - Time Slots */}
                    <div className="grid" style={{ gridTemplateColumns: '120px repeat(7, 1fr)' }}>
                        {/* Empty corner cell */}
                        <div className="bg-gray-900 p-3 border-b border-r border-gray-700 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-gray-400" />
                        </div>
                        {/* Time slot headers */}
                        {TIME_SLOTS.map((slot) => (
                            <div
                                key={slot.id}
                                className="bg-gray-900 p-3 border-b border-r border-gray-700 text-center last:border-r-0"
                            >
                                <div className="text-teal-400 font-semibold text-sm">
                                    {slot.startTime}
                                </div>
                                <div className="text-gray-500 text-xs">
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
                            style={{ gridTemplateColumns: '120px repeat(7, 1fr)' }}
                        >
                            {/* Day Label */}
                            <div
                                className={cn(
                                    'p-3 border-r border-gray-700 flex items-center justify-center',
                                    dayIndex % 2 === 0 ? 'bg-gray-850' : 'bg-gray-800',
                                    dayIndex < DAYS_OF_WEEK.length - 1 && 'border-b'
                                )}
                            >
                                <span className="text-white font-medium text-sm">{DAY_LABELS[day]}</span>
                            </div>

                            {/* Time Slots for this day */}
                            {TIME_SLOTS.map((slot, slotIndex) => {
                                const slotEvents = getEventsForSlot(day, slot.startTime)
                                const isDropTarget =
                                    dragOverSlot?.day === day && dragOverSlot?.timeSlot === slot.startTime

                                return (
                                    <div
                                        key={`${day}-${slot.id}`}
                                        className={cn(
                                            'min-h-[100px] p-1.5 border-r border-gray-700 last:border-r-0 transition-all duration-200',
                                            dayIndex % 2 === 0 ? 'bg-gray-850' : 'bg-gray-800',
                                            dayIndex < DAYS_OF_WEEK.length - 1 && 'border-b',
                                            isDropTarget && 'bg-teal-500/20 border-2 border-dashed border-teal-500',
                                            isEditable && 'hover:bg-gray-700/50'
                                        )}
                                        onDragOver={(e) => handleDragOver(e, day, slot.startTime)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, day, slot.startTime)}
                                    >
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
