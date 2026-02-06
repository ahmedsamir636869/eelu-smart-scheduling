'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Save, Plus } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { SummaryCards } from '@/components/data/PhysicalResources/SummaryCards'
import { Tabs } from '@/components/data/PhysicalResources/Tabs'
import { ResourceCard } from '@/components/data/PhysicalResources/ResourceCard'
import { CreateResourceModal } from '@/components/data/PhysicalResources/CreateResourceModal'
import { Button } from '@/components/ui/Button'
import { PhysicalResource } from '@/types/api'
import { campusApi, classroomApi, ApiError } from '@/lib/api'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function PhysicalResourcesPage() {
  const params = useParams()
  const branchId = params.branchId as string
  const [branchName, setBranchName] = useState('')
  const [labs, setLabs] = useState<PhysicalResource[]>([])
  const [rooms, setRooms] = useState<PhysicalResource[]>([])
  const [isLabModalOpen, setIsLabModalOpen] = useState(false)
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (branchId) {
      fetchCampusAndClassrooms()
    }
  }, [branchId])

  const fetchCampusAndClassrooms = async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch campus info
      const campus = await campusApi.getById(branchId)
      if (campus) {
        const displayName = campus.city
          ? `${campus.name} - ${campus.city}`
          : campus.name
        setBranchName(displayName)
      }

      // Fetch classrooms for this campus
      const campusName = campus?.name || ''
      const classrooms = await classroomApi.getAll(campusName)

      // Separate labs and lecture halls
      const labResources: PhysicalResource[] = []
      const roomResources: PhysicalResource[] = []

      classrooms.forEach((classroom: any) => {
        const resource: PhysicalResource = {
          id: classroom.id,
          name: classroom.name,
          type: classroom.type === 'LAB' ? 'LAB' : 'LECTURE_HALL',
          capacity: classroom.capacity,
          campusId: classroom.campusId,
        }

        if (classroom.type === 'LAB') {
          labResources.push(resource)
        } else {
          roomResources.push(resource)
        }
      })

      setLabs(labResources)
      setRooms(roomResources)
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to load physical resources. Please try again.'
      setError(errorMessage)
      console.error('Error fetching classrooms:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLabCapacityChange = async (id: string, capacity: number) => {
    try {
      await classroomApi.update(id, { capacity })
      setLabs(labs.map(lab => lab.id === id ? { ...lab, capacity } : lab))
    } catch (err) {
      console.error('Error updating lab capacity:', err)
      setError('Failed to update lab capacity')
    }
  }

  const handleRoomCapacityChange = async (id: string, capacity: number) => {
    try {
      await classroomApi.update(id, { capacity })
      setRooms(rooms.map(room => room.id === id ? { ...room, capacity } : room))
    } catch (err) {
      console.error('Error updating room capacity:', err)
      setError('Failed to update room capacity')
    }
  }

  const handleCreateLab = async (data: { name: string; capacity: number }) => {
    try {
      setError('')
      const campus = await campusApi.getById(branchId)
      if (!campus) {
        throw new Error('Campus not found')
      }

      const newLab = await classroomApi.create({
        name: data.name,
        capacity: data.capacity,
        type: 'LAB',
        campusName: campus.name,
      })

      setLabs([...labs, {
        id: newLab.id,
        name: newLab.name,
        type: 'LAB',
        capacity: newLab.capacity,
        campusId: newLab.campusId,
      }])
      setIsLabModalOpen(false)
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to create lab. Please try again.'
      setError(errorMessage)
      throw err
    }
  }

  const handleCreateRoom = async (data: { name: string; capacity: number }) => {
    try {
      setError('')
      const campus = await campusApi.getById(branchId)
      if (!campus) {
        throw new Error('Campus not found')
      }

      const newRoom = await classroomApi.create({
        name: data.name,
        capacity: data.capacity,
        type: 'LECTURE_HALL',
        campusName: campus.name,
      })

      setRooms([...rooms, {
        id: newRoom.id,
        name: newRoom.name,
        type: 'LECTURE_HALL',
        capacity: newRoom.capacity,
        campusId: newRoom.campusId,
      }])
      setIsRoomModalOpen(false)
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to create lecture room. Please try again.'
      setError(errorMessage)
      throw err
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      // Capacity changes are already saved individually, so this is just a confirmation
      // In a real app, you might want to batch save all changes
      console.log('All changes saved')
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to save changes. Please try again.'
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    {
      id: 'labs',
      label: 'Labs(IT)',
      content: (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="success"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsLabModalOpen(true)}
            >
              Create Lab
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {labs.map((lab) => (
              <ResourceCard
                key={lab.id}
                id={lab.id}
                name={lab.name}
                capacity={lab.capacity}
                onCapacityChange={handleLabCapacityChange}
              />
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'rooms',
      label: 'Lecture Rooms',
      content: (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="success"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsRoomModalOpen(true)}
            >
              Create Lecture Room
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <ResourceCard
                key={room.id}
                id={room.id}
                name={room.name}
                capacity={room.capacity}
                onCapacityChange={handleRoomCapacityChange}
              />
            ))}
          </div>
        </div>
      ),
    },
  ]

  const totalCapacity = [...labs, ...rooms].reduce((sum, r) => sum + r.capacity, 0)
  const activeLabs = labs.length
  const lectureRooms = rooms.length

  return (
    <ProtectedRoute>
      <MainLayout title={branchName ? `Data: Physical Resources - ${branchName}` : 'Data: Loading...'}>
        <div className="space-y-4 sm:space-y-6">
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <Link
            href={`/data/${branchId}`}
            className="text-teal-400 hover:text-teal-300 transition-colors inline-flex items-center gap-2 text-sm sm:text-base"
          >
            ← Back to Data Management ({branchName || '...'})
          </Link>

          <div>
            <h2 className="text-white text-lg sm:text-xl font-bold uppercase mb-2">PHYSICAL DATA</h2>
          </div>

          {loading && !branchName ? (
            <div className="text-center py-8 text-gray-400">Loading physical resources...</div>
          ) : (
            <>
              <SummaryCards
                totalCapacity={totalCapacity}
                activeLabs={activeLabs}
                lectureRooms={lectureRooms}
              />

              <Tabs tabs={tabs} defaultTab="labs" />

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  icon={<Save className="w-4 h-4" />}
                  onClick={handleSave}
                  className="w-full sm:w-auto"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </>
          )}
        </div>

        <CreateResourceModal
          isOpen={isLabModalOpen}
          onClose={() => setIsLabModalOpen(false)}
          onCreate={handleCreateLab}
          resourceType="lab"
        />

        <CreateResourceModal
          isOpen={isRoomModalOpen}
          onClose={() => setIsRoomModalOpen(false)}
          onCreate={handleCreateRoom}
          resourceType="room"
        />
      </MainLayout>
    </ProtectedRoute>
  )
}
