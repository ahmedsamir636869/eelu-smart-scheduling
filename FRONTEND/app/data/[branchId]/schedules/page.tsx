'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Plus, Calendar, Search, Filter, LayoutGrid, List, Loader2 } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { campusApi, collegeApi, ApiError } from '@/lib/api'
import {
    ScheduleCard,
    ScheduleEditor,
    ScheduleViewer,
    CreateScheduleModal,
    Schedule,
    College,
    mockSchedules,
    mockColleges,
    mockEvents,
    DayOfWeek,
} from '@/components/data/Schedules'
import { cn } from '@/lib/utils'

type ViewMode = 'grid' | 'list'
type ModalState = 'none' | 'create' | 'view' | 'edit'

export default function SchedulesPage() {
    const params = useParams()
    const branchId = params.branchId as string

    // State
    const [branchName, setBranchName] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [schedules, setSchedules] = useState<Schedule[]>(mockSchedules)
    const [colleges, setColleges] = useState<College[]>(mockColleges)
    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode, setViewMode] = useState<ViewMode>('grid')
    const [modalState, setModalState] = useState<ModalState>('none')
    const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all')

    // Fetch branch info
    useEffect(() => {
        if (branchId) {
            fetchBranchInfo()
            fetchColleges()
        }
    }, [branchId])

    const fetchBranchInfo = async () => {
        try {
            setLoading(true)
            setError('')
            const campus = await campusApi.getById(branchId)
            if (campus) {
                const displayName = campus.city
                    ? `${campus.name} - ${campus.city}`
                    : campus.name
                setBranchName(displayName)
            }
        } catch (err) {
            const errorMessage =
                err instanceof ApiError
                    ? err.message
                    : 'Failed to load campus information.'
            setError(errorMessage)
            console.error('Error fetching campus:', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchColleges = async () => {
        try {
            const fetchedColleges = await collegeApi.getAll(branchId)
            if (fetchedColleges && fetchedColleges.length > 0) {
                setColleges(fetchedColleges.map((c: any) => ({ id: c.id, name: c.name })))
            }
        } catch (err) {
            console.error('Error fetching colleges:', err)
            // Use mock data as fallback
        }
    }

    // Filter schedules
    const filteredSchedules = schedules.filter((schedule) => {
        const matchesSearch =
            schedule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            schedule.collegeName.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || schedule.status === statusFilter
        return matchesSearch && matchesStatus
    })

    // Handlers
    const handleCreateSchedule = async (data: {
        name: string
        collegeId: string
        generationType: 'manual' | 'ai'
    }) => {
        const college = colleges.find((c) => c.id === data.collegeId)
        const newSchedule: Schedule = {
            id: `schedule-${Date.now()}`,
            name: data.name,
            collegeId: data.collegeId,
            collegeName: college?.name || 'Unknown College',
            status: 'draft',
            events: data.generationType === 'ai' ? mockEvents : [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            generatedBy: data.generationType,
        }
        setSchedules([newSchedule, ...schedules])
        setSelectedSchedule(newSchedule)
        setModalState('edit')
    }

    const handleViewSchedule = (schedule: Schedule) => {
        setSelectedSchedule(schedule)
        setModalState('view')
    }

    const handleEditSchedule = (schedule: Schedule) => {
        setSelectedSchedule(schedule)
        setModalState('edit')
    }

    const handleDeleteSchedule = (schedule: Schedule) => {
        if (confirm(`Are you sure you want to delete "${schedule.name}"?`)) {
            setSchedules(schedules.filter((s) => s.id !== schedule.id))
        }
    }

    const handleSaveAsDraft = async (updatedSchedule: Schedule) => {
        setSchedules(
            schedules.map((s) =>
                s.id === updatedSchedule.id ? { ...updatedSchedule, status: 'draft' } : s
            )
        )
        setModalState('none')
        setSelectedSchedule(null)
    }

    const handleSaveAndPublish = async (updatedSchedule: Schedule) => {
        setSchedules(
            schedules.map((s) =>
                s.id === updatedSchedule.id ? { ...updatedSchedule, status: 'published' } : s
            )
        )
        setModalState('none')
        setSelectedSchedule(null)
    }

    const handleCloseModal = () => {
        setModalState('none')
        setSelectedSchedule(null)
    }

    const handleSwitchToEdit = () => {
        setModalState('edit')
    }

    return (
        <ProtectedRoute>
            <MainLayout title={branchName ? `Schedules: ${branchName}` : 'Schedules: Loading...'}>
                {error && (
                    <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Back Link */}
                    <Link
                        href={`/data/${branchId}`}
                        className="text-teal-400 hover:text-teal-300 transition-colors inline-flex items-center gap-2"
                    >
                        ← Back to Branch Data
                    </Link>

                    {loading && !branchName ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-white text-2xl font-bold flex items-center gap-3">
                                        <Calendar className="w-7 h-7 text-teal-400" />
                                        Schedule Management
                                    </h1>
                                    <p className="text-gray-400 text-sm mt-1">
                                        Create and manage course schedules for this branch
                                    </p>
                                </div>
                                <Button
                                    variant="primary"
                                    icon={<Plus className="w-5 h-5" />}
                                    onClick={() => setModalState('create')}
                                    className="shrink-0"
                                >
                                    Create New Schedule
                                </Button>
                            </div>

                            {/* Filters & Search */}
                            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    {/* Search */}
                                    <div className="flex-1 relative">
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            type="text"
                                            placeholder="Search schedules..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pr-10 w-full"
                                        />
                                    </div>

                                    {/* Status Filter */}
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-5 h-5 text-gray-400" />
                                        <div className="flex rounded-lg overflow-hidden border border-gray-700">
                                            {(['all', 'published', 'draft'] as const).map((status) => (
                                                <button
                                                    key={status}
                                                    onClick={() => setStatusFilter(status)}
                                                    className={cn(
                                                        'px-4 py-2 text-sm font-medium transition-colors',
                                                        statusFilter === status
                                                            ? 'bg-teal-600 text-white'
                                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                                    )}
                                                >
                                                    {status === 'all' && 'All'}
                                                    {status === 'published' && 'Published'}
                                                    {status === 'draft' && 'Draft'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* View Mode Toggle */}
                                    <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1 border border-gray-700">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={cn(
                                                'p-2 rounded-md transition-colors',
                                                viewMode === 'grid'
                                                    ? 'bg-teal-600 text-white'
                                                    : 'text-gray-400 hover:text-white'
                                            )}
                                        >
                                            <LayoutGrid className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={cn(
                                                'p-2 rounded-md transition-colors',
                                                viewMode === 'list'
                                                    ? 'bg-teal-600 text-white'
                                                    : 'text-gray-400 hover:text-white'
                                            )}
                                        >
                                            <List className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Schedules Grid/List */}
                            {filteredSchedules.length > 0 ? (
                                <div
                                    className={cn(
                                        viewMode === 'grid'
                                            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                                            : 'space-y-4'
                                    )}
                                >
                                    {filteredSchedules.map((schedule) => (
                                        <ScheduleCard
                                            key={schedule.id}
                                            schedule={schedule}
                                            onView={handleViewSchedule}
                                            onEdit={handleEditSchedule}
                                            onDelete={handleDeleteSchedule}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                                        <Calendar className="w-10 h-10 text-gray-600" />
                                    </div>
                                    <h3 className="text-white text-lg font-semibold mb-2">
                                        {searchQuery || statusFilter !== 'all'
                                            ? 'No schedules found'
                                            : 'No schedules yet'}
                                    </h3>
                                    <p className="text-gray-400 text-sm mb-6">
                                        {searchQuery || statusFilter !== 'all'
                                            ? 'Try changing your search or filters'
                                            : 'Create your first schedule for this branch'}
                                    </p>
                                    {!searchQuery && statusFilter === 'all' && (
                                        <Button
                                            variant="primary"
                                            icon={<Plus className="w-5 h-5" />}
                                            onClick={() => setModalState('create')}
                                        >
                                            Create New Schedule
                                        </Button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Create Schedule Modal */}
                <CreateScheduleModal
                    isOpen={modalState === 'create'}
                    onClose={handleCloseModal}
                    onCreate={handleCreateSchedule}
                    colleges={colleges}
                />

                {/* Schedule Viewer */}
                {modalState === 'view' && selectedSchedule && (
                    <ScheduleViewer
                        schedule={selectedSchedule}
                        onClose={handleCloseModal}
                        onEdit={handleSwitchToEdit}
                    />
                )}

                {/* Schedule Editor */}
                {modalState === 'edit' && selectedSchedule && (
                    <ScheduleEditor
                        schedule={selectedSchedule}
                        onClose={handleCloseModal}
                        onSaveAsDraft={handleSaveAsDraft}
                        onSaveAndPublish={handleSaveAndPublish}
                    />
                )}
            </MainLayout>
        </ProtectedRoute>
    )
}
