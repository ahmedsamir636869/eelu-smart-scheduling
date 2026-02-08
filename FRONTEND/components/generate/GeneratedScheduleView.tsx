'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { ScheduleGrid, ScheduleSession } from './ScheduleGrid'
import { Calendar, BookOpen, Users, Download, FileJson, FileSpreadsheet, Filter } from 'lucide-react'

interface GeneratedScheduleViewProps {
  schedule: {
    id: string
    semester: string
    generatedBy: string
    sessions?: Array<{
      id: string
      name: string
      type: 'LECTURE' | 'SECTION'
      day: string | null
      startTime: string | null
      endTime: string | null
      studentCount: number
      course?: {
        code: string
        name: string
        year?: number
        college?: {
          name: string
        }
      }
      instructor?: {
        name: string
      }
      classroom?: {
        name: string
        capacity?: number
      }
    }>
  } | null
  loading?: boolean
}

export function GeneratedScheduleView({ schedule, loading }: GeneratedScheduleViewProps) {
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [collegeFilter, setCollegeFilter] = useState<string>('all')

  // Convert sessions to ScheduleSession format
  const convertSessionsToSchedule = (): ScheduleSession[] => {
    if (!schedule || !schedule.sessions || schedule.sessions.length === 0) {
      return []
    }

    const dayMap: Record<string, string> = {
      'SATURDAY': 'Saturday',
      'SUNDAY': 'Sunday',
      'MONDAY': 'Monday',
      'TUESDAY': 'Tuesday',
      'WEDNESDAY': 'Wednesday',
      'THURSDAY': 'Thursday',
    }

    return schedule.sessions
      .filter((session) => session.day && session.startTime && session.endTime)
      .map((session) => {
        // Convert DateTime to time string (HH:MM format)
        const formatTime = (dateString: string | null): string => {
          if (!dateString) return '08:00'
          try {
            const date = new Date(dateString)
            const hours = String(date.getHours()).padStart(2, '0')
            const minutes = String(date.getMinutes()).padStart(2, '0')
            return `${hours}:${minutes}`
          } catch {
            return '08:00'
          }
        }

        const startTime = formatTime(session.startTime)
        const endTime = formatTime(session.endTime)
        const day = dayMap[session.day || ''] || 'Monday'

        // Determine session type
        const sessionType = session.type === 'SECTION' ? 'lab' : 'lecture'

        // Extract year and ensure it's a number
        const year = session.course?.year !== undefined && session.course?.year !== null
          ? Number(session.course.year)
          : undefined

        // Try to extract group from session name if available
        // Format: "Course Name (Group ID - Group A/B)"
        let groupName = undefined;
        if (session.name && session.name.includes('(Group')) {
          const match = session.name.match(/\((.*?)\)$/);
          if (match) {
            groupName = match[1];
          }
        }

        return {
          id: session.id,
          courseCode: session.course?.code || 'N/A',
          // Use session.name if it contains group info, otherwise fallback to course name
          courseName: session.name || session.course?.name || 'Unknown',
          instructor: session.instructor?.name || 'Unassigned',
          location: session.classroom?.name || 'TBA',
          day: day,
          startTime: startTime,
          endTime: endTime,
          type: sessionType as 'lecture' | 'lab',
          year: year,
          studentCount: session.studentCount,
          roomCapacity: session.classroom?.capacity, // capacity is now fetched
          group: groupName,
          // Extract college name assuming it might be in course.college.name (based on our previous deductions)
          // Since the interface passed to this component has defined course, check if college exists there.
          // Note: The interface in Props definition above needs to support it. I updated it.
          // We can't access `session.college` easily if it's not in the type definition, but usually JS allows it.
          // I added college?: { name: string } to the interface in this file.
          college: session.course?.college?.name
        } as any // cast as any to add extra prop if needed, or update ScheduleSession interface in ScheduleGrid? 
        // Wait, GeneratedScheduleView converts to ScheduleSession. I should update ScheduleSession interface too?
        // Let's check ScheduleGrid.tsx to see if I need to update the interface there. 
        // Actually I don't need to update ScheduleGrid interface if I only filter here.
        // But for consistency I should probably store it. 
        // For filtering *here*, I need it.
      })
  }

  const allSessions = convertSessionsToSchedule()

  // Extract unique colleges
  const uniqueColleges = useMemo(() => {
    const colleges = new Set<string>()
    allSessions.forEach((s: any) => { // using any because ScheduleSession might not have college yet
      if (s.college) colleges.add(s.college)
    })
    return Array.from(colleges).sort()
  }, [allSessions]) // Dependencies might need check, but allSessions is derived from prop.

  // Filter sessions
  const sessions = allSessions.filter((session: any) => {
    const matchesLevel = levelFilter === 'all' || session.year?.toString() === levelFilter
    const matchesCollege = collegeFilter === 'all' || session.college === collegeFilter
    return matchesLevel && matchesCollege
  })

  const lectureCount = sessions.filter(s => s.type === 'lecture').length
  const labCount = sessions.filter(s => s.type === 'lab').length

  // Export to JSON
  const exportToJSON = () => {
    if (!schedule || !schedule.sessions) return

    const exportData = {
      scheduleId: schedule.id,
      semester: schedule.semester,
      generatedBy: schedule.generatedBy,
      exportedAt: new Date().toISOString(),
      totalSessions: schedule.sessions.length,
      sessions: schedule.sessions.map(session => ({
        id: session.id,
        courseName: session.course?.name || session.name,
        courseCode: session.course?.code || 'N/A',
        instructor: session.instructor?.name || 'Unassigned',
        room: session.classroom?.name || 'TBA',
        day: session.day,
        startTime: session.startTime,
        endTime: session.endTime,
        studentCount: session.studentCount,
        type: session.type,
        year: session.course?.year,
        college: session.course?.college?.name
      }))
    }

    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `schedule_${schedule.semester.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Export to Excel (CSV format that Excel can open)
  const exportToExcel = () => {
    if (!schedule || !schedule.sessions) return

    // Create CSV content
    const headers = ['Day', 'Course Name', 'Course Code', 'College', 'Instructor', 'Room', 'Start Time', 'End Time', 'Students', 'Type', 'Year']

    const dayMap: Record<string, string> = {
      'SATURDAY': 'Saturday',
      'SUNDAY': 'Sunday',
      'MONDAY': 'Monday',
      'TUESDAY': 'Tuesday',
      'WEDNESDAY': 'Wednesday',
      'THURSDAY': 'Thursday',
    }

    const formatTime = (dateString: string | null): string => {
      if (!dateString) return ''
      try {
        const date = new Date(dateString)
        const hours = date.getHours()
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const ampm = hours >= 12 ? 'PM' : 'AM'
        const hour12 = hours % 12 || 12
        return `${hour12}:${minutes} ${ampm}`
      } catch {
        return ''
      }
    }

    const rows = schedule.sessions.map(session => [
      dayMap[session.day || ''] || session.day || '',
      session.course?.name || session.name,
      session.course?.code || '',
      session.course?.college?.name || '',
      session.instructor?.name || 'Unassigned',
      session.classroom?.name || 'TBA',
      formatTime(session.startTime),
      formatTime(session.endTime),
      session.studentCount.toString(),
      session.type,
      session.course?.year?.toString() || ''
    ])

    // Sort by day and time
    const dayOrder = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
    rows.sort((a, b) => {
      const dayA = dayOrder.indexOf(a[0])
      const dayB = dayOrder.indexOf(b[0])
      if (dayA !== dayB) return dayA - dayB
      return a[6].localeCompare(b[6]) // Sort by start time (index 6 now)
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
    a.download = `schedule_${schedule.semester.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <h3 className="text-white font-bold text-lg mb-4">Generated Schedule</h3>
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className="w-8 h-8 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mb-4"></div>
            Generating schedule...
          </div>
        </div>
      </Card>
    )
  }

  if (!schedule || allSessions.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <h3 className="text-white font-bold text-lg mb-4">Generated Schedule</h3>
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              No schedule generated yet. Generate a schedule to see it here.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="w-full">
      <Card className="lg:col-span-2">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-white font-bold text-xl mb-2">Generated Schedule</h3>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  <span>Semester: {schedule.semester}</span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {lectureCount} Lectures
                  </span>
                  {labCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {labCount} Labs
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {/* Filters */}

                {/* College Filter */}
                {uniqueColleges.length > 0 && (
                  <div className="flex items-center gap-2 mr-2 bg-gray-800 rounded-lg px-3 border border-gray-600">
                    <Filter className="w-3 h-3 text-gray-400" />
                    <select
                      className="bg-transparent border-none text-white text-sm py-2 focus:ring-0 outline-none cursor-pointer"
                      value={collegeFilter}
                      onChange={(e) => setCollegeFilter(e.target.value)}
                    >
                      <option value="all" className="bg-gray-800 text-white">All Colleges</option>
                      {uniqueColleges.map((c: string) => (
                        <option key={c} value={c} className="bg-gray-800 text-white">{c}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Level Filter */}
                <div className="flex items-center gap-2 mr-2 bg-gray-800 rounded-lg px-3 border border-gray-600">
                  <Filter className="w-3 h-3 text-gray-400" />
                  <select
                    className="bg-transparent border-none text-white text-sm py-2 focus:ring-0 outline-none cursor-pointer"
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

                <button
                  onClick={exportToExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel
                </button>
                <button
                  onClick={exportToJSON}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <FileJson className="w-4 h-4" />
                  JSON
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="p-3 bg-gray-900/50 rounded-lg">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="text-gray-400 font-semibold">Color Legend:</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="text-gray-400">By Level:</span>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-green-500"></span>
                    <span className="text-green-300">Year 1</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-blue-500"></span>
                    <span className="text-blue-300">Year 2</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-purple-500"></span>
                    <span className="text-purple-300">Year 3</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-orange-500"></span>
                    <span className="text-orange-300">Year 4</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-red-500"></span>
                    <span className="text-red-300">Year 5</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm pt-2 border-t border-gray-700">
                  <span className="text-gray-400">By Type:</span>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-blue-500"></span>
                    <span className="text-blue-300">Lecture</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-purple-500"></span>
                    <span className="text-purple-300">Lab</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Grid */}
          <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 350px)' }}>
            <ScheduleGrid sessions={sessions} />
          </div>
        </div>
      </Card>
    </div>
  )
}
