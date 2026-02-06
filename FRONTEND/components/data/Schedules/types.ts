'use client'

// Schedule Types
export interface TimeSlot {
    id: string
    startTime: string // e.g., "08:00"
    endTime: string // e.g., "09:30"
}

export interface ScheduleEvent {
    id: string
    title: string
    courseCode: string
    courseName: string
    instructor: string
    location: string
    day: DayOfWeek
    startTime: string
    endTime: string
    color?: string
    type: 'lecture' | 'lab' | 'tutorial'
}

export type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'

export interface Schedule {
    id: string
    name: string
    collegeId: string
    collegeName: string
    status: 'draft' | 'published'
    events: ScheduleEvent[]
    createdAt: string
    updatedAt: string
    generatedBy: 'manual' | 'ai'
}

export interface College {
    id: string
    name: string
}

// Time slots configuration
export const TIME_SLOTS: TimeSlot[] = [
    { id: '1', startTime: '08:00', endTime: '09:30' },
    { id: '2', startTime: '09:45', endTime: '11:15' },
    { id: '3', startTime: '11:30', endTime: '13:00' },
    { id: '4', startTime: '13:15', endTime: '14:45' },
    { id: '5', startTime: '15:00', endTime: '16:30' },
    { id: '6', startTime: '16:45', endTime: '18:15' },
    { id: '7', startTime: '18:30', endTime: '20:00' },
]

export const DAYS_OF_WEEK: DayOfWeek[] = [
    'Saturday',
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
]

export const DAY_LABELS: Record<DayOfWeek, string> = {
    Saturday: 'Saturday',
    Sunday: 'Sunday',
    Monday: 'Monday',
    Tuesday: 'Tuesday',
    Wednesday: 'Wednesday',
    Thursday: 'Thursday',
    Friday: 'Friday',
}

// Event colors based on type
export const EVENT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    lecture: { bg: 'bg-blue-600/30', border: 'border-blue-500', text: 'text-blue-300' },
    lab: { bg: 'bg-purple-600/30', border: 'border-purple-500', text: 'text-purple-300' },
    tutorial: { bg: 'bg-teal-600/30', border: 'border-teal-500', text: 'text-teal-300' },
}
