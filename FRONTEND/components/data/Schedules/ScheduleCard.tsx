'use client'

import { Calendar, Clock, Edit, Trash2, Eye, Cpu, User, UploadCloud } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Schedule } from './types'
import { cn } from '@/lib/utils'

interface ScheduleCardProps {
    schedule: Schedule
    onView: (schedule: Schedule) => void
    onEdit: (schedule: Schedule) => void
    onDelete: (schedule: Schedule) => void
    onPublish?: (schedule: Schedule) => void
}

export function ScheduleCard({ schedule, onView, onEdit, onDelete, onPublish }: ScheduleCardProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    return (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700/50 p-5 hover:border-teal-500/30 hover:shadow-lg hover:shadow-teal-900/10 transition-all duration-300 group flex flex-col h-full">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center shadow-inner',
                            schedule.status === 'published'
                                ? 'bg-green-500/10 text-green-400 ring-1 ring-green-500/20'
                                : 'bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20'
                        )}>
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-white font-bold text-lg leading-tight truncate group-hover:text-teal-400 transition-colors">
                                {schedule.name}
                            </h3>
                            <p className="text-gray-400 text-xs mt-1 truncate">{schedule.collegeName}</p>
                        </div>
                    </div>
                </div>
                <Badge variant={schedule.status === 'published' ? 'published' : 'draft'} className="ml-2 shrink-0">
                    {schedule.status === 'published' ? 'Published' : 'Draft'}
                </Badge>
            </div>

            {/* Info */}
            <div className="space-y-3 mb-6 flex-1">
                <div className="p-3 bg-gray-950/30 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="truncate">Updated {formatDate(schedule.updatedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        {schedule.generatedBy === 'ai' ? (
                            <>
                                <Cpu className="w-4 h-4 text-purple-400" />
                                <span className="text-purple-300">AI Generated</span>
                            </>
                        ) : (
                            <>
                                <User className="w-4 h-4 text-blue-400" />
                                <span className="text-blue-300">Manual Entry</span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <div className="w-4 h-4 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
                        </div>
                        <span className="text-gray-300">
                            {schedule.events.length} {schedule.events.length === 1 ? 'Session' : 'Sessions'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-gray-700/50 mt-auto">
                <Button
                    variant="secondary"
                    icon={<Eye className="w-4 h-4" />}
                    onClick={() => onView(schedule)}
                    className="flex-1 text-sm bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-gray-600"
                >
                    View
                </Button>

                {onPublish && schedule.status === 'draft' ? (
                    <Button
                        variant="primary"
                        icon={<UploadCloud className="w-4 h-4" />}
                        onClick={() => onPublish(schedule)}
                        className="flex-1 text-sm bg-teal-600 hover:bg-teal-700 border-teal-500 shadow-md shadow-teal-900/20"
                    >
                        Publish
                    </Button>
                ) : (
                    <Button
                        variant="primary"
                        icon={<Edit className="w-4 h-4" />}
                        onClick={() => onEdit(schedule)}
                        className="flex-1 text-sm bg-blue-600 hover:bg-blue-700 border-blue-500 shadow-md shadow-blue-900/20"
                    >
                        Edit
                    </Button>
                )}

                <button
                    onClick={() => onDelete(schedule)}
                    className="p-2.5 rounded-lg bg-gray-800/80 hover:bg-red-500/10 border border-gray-700 hover:border-red-500/50 text-gray-400 hover:text-red-400 transition-all"
                    title="Delete Schedule"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
