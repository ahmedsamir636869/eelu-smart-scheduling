'use client'

import { useState } from 'react'
import { X, Calendar, Cpu, User, Sparkles, GraduationCap, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { College } from './types'
import { cn } from '@/lib/utils'

interface CreateScheduleModalProps {
    isOpen: boolean
    onClose: () => void
    onCreate: (data: {
        name: string
        collegeId: string
        generationType: 'manual' | 'ai'
    }) => Promise<void>
    colleges: College[]
}

export function CreateScheduleModal({ isOpen, onClose, onCreate, colleges }: CreateScheduleModalProps) {
    const [scheduleName, setScheduleName] = useState('')
    const [selectedCollege, setSelectedCollege] = useState('')
    const [generationType, setGenerationType] = useState<'manual' | 'ai'>('manual')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!scheduleName.trim()) {
            setError('Please enter a schedule name')
            return
        }

        if (!selectedCollege) {
            setError('Please select a college')
            return
        }

        try {
            setLoading(true)
            await onCreate({
                name: scheduleName.trim(),
                collegeId: selectedCollege,
                generationType,
            })
            handleClose()
        } catch (err) {
            setError('An error occurred while creating the schedule')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setScheduleName('')
        setSelectedCollege('')
        setGenerationType('manual')
        setError('')
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-xl">Create New Schedule</h2>
                            <p className="text-gray-400 text-sm">Select college and generation method</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Schedule Name */}
                    <div>
                        <label className="text-gray-300 text-sm font-medium mb-2 block">
                            Schedule Name
                        </label>
                        <Input
                            type="text"
                            value={scheduleName}
                            onChange={(e) => setScheduleName(e.target.value)}
                            placeholder="e.g., Main Schedule - Semester 1"
                            required
                            className="w-full"
                            disabled={loading}
                        />
                    </div>

                    {/* College Selection */}
                    <div>
                        <label className="text-gray-300 text-sm font-medium mb-2 flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-teal-400" />
                            Select College
                        </label>
                        <Select
                            options={colleges.map((college) => ({
                                value: college.id,
                                label: college.name,
                            }))}
                            value={selectedCollege}
                            onChange={(e) => setSelectedCollege(e.target.value)}
                            placeholder="Select college..."
                            disabled={loading}
                        />
                    </div>

                    {/* Generation Type Selection */}
                    <div>
                        <label className="text-gray-300 text-sm font-medium mb-3 block">
                            Generation Method
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Manual Option */}
                            <button
                                type="button"
                                onClick={() => setGenerationType('manual')}
                                disabled={loading}
                                className={cn(
                                    'p-4 rounded-xl border-2 transition-all duration-300 text-left', // Changed text-right to text-left for English
                                    generationType === 'manual'
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-gray-700 bg-gray-800 hover:border-gray-600',
                                    loading && 'opacity-50 cursor-not-allowed'
                                )}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={cn(
                                        'w-10 h-10 rounded-lg flex items-center justify-center',
                                        generationType === 'manual'
                                            ? 'bg-blue-500/20 text-blue-400'
                                            : 'bg-gray-700 text-gray-400'
                                    )}>
                                        <User className="w-5 h-5" />
                                    </div>
                                    <span className={cn(
                                        'font-semibold',
                                        generationType === 'manual' ? 'text-blue-400' : 'text-gray-300'
                                    )}>
                                        Manual
                                    </span>
                                </div>
                                <p className="text-gray-400 text-xs">
                                    Create schedule manually and add lectures yourself
                                </p>
                            </button>

                            {/* AI Option */}
                            <button
                                type="button"
                                onClick={() => setGenerationType('ai')}
                                disabled={loading}
                                className={cn(
                                    'p-4 rounded-xl border-2 transition-all duration-300 text-left relative overflow-hidden', // Changed text-right to text-left for English
                                    generationType === 'ai'
                                        ? 'border-purple-500 bg-purple-500/10'
                                        : 'border-gray-700 bg-gray-800 hover:border-gray-600',
                                    loading && 'opacity-50 cursor-not-allowed'
                                )}
                            >
                                {/* Sparkle effect */}
                                <div className="absolute top-2 right-2"> {/* Changed left to right to align with English layout */}
                                    <Sparkles className={cn(
                                        'w-4 h-4',
                                        generationType === 'ai' ? 'text-purple-400' : 'text-gray-600'
                                    )} />
                                </div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={cn(
                                        'w-10 h-10 rounded-lg flex items-center justify-center',
                                        generationType === 'ai'
                                            ? 'bg-purple-500/20 text-purple-400'
                                            : 'bg-gray-700 text-gray-400'
                                    )}>
                                        <Cpu className="w-5 h-5" />
                                    </div>
                                    <span className={cn(
                                        'font-semibold',
                                        generationType === 'ai' ? 'text-purple-400' : 'text-gray-300'
                                    )}>
                                        AI Generation
                                    </span>
                                </div>
                                <p className="text-gray-400 text-xs">
                                    Let AI generate the schedule automatically
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* AI Notice */}
                    {generationType === 'ai' && (
                        <div className="p-4 bg-purple-900/20 border border-purple-700/50 rounded-lg">
                            <div className="flex items-start gap-3">
                                <Sparkles className="w-5 h-5 text-purple-400 mt-0.5" />
                                <div>
                                    <p className="text-purple-300 text-sm font-medium">Note</p>
                                    <p className="text-gray-400 text-xs mt-1">
                                        System data will be used to generate an optimal schedule considering all constraints and requirements.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-700">
                        <Button
                            variant="secondary"
                            onClick={handleClose}
                            type="button"
                            className="w-full sm:w-auto"
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            className="w-full sm:w-auto"
                            disabled={loading}
                            icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                        >
                            {loading ? 'Creating...' : 'Create Schedule'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
