'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Save } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { SummaryCards } from '@/components/data/PhysicalResources/SummaryCards'
import { Tabs } from '@/components/data/PhysicalResources/Tabs'
import { ResourceCard } from '@/components/data/PhysicalResources/ResourceCard'
import { Button } from '@/components/ui/Button'
import { PhysicalResource } from '@/types/api'

interface PhysicalResourcesPageProps {
  params: {
    branchId: string
  }
}

// Mock branch data
const branchNames: Record<string, string> = {
  '1': 'Ain Shams',
  '2': 'Assiut',
  '3': 'Alexandria',
}

// Mock data - will be replaced with API calls
const initialLabs: PhysicalResource[] = [
  { id: 'lab1', name: 'Lab 1', type: 'lab', capacity: 24 },
  { id: 'lab2', name: 'Lab 2', type: 'lab', capacity: 27 },
]

const initialRooms: PhysicalResource[] = [
  { id: 'room1', name: 'Room 1', type: 'room', capacity: 25 },
  { id: 'room2', name: 'Room 2', type: 'room', capacity: 25 },
  { id: 'room3', name: 'Room 3', type: 'room', capacity: 25 },
  { id: 'room4', name: 'Room 4', type: 'room', capacity: 25 },
  { id: 'room5', name: 'Room 5', type: 'room', capacity: 25 },
]

export default function PhysicalResourcesPage({ params }: PhysicalResourcesPageProps) {
  const branchName = branchNames[params.branchId] || `Branch ${params.branchId}`
  const [labs, setLabs] = useState<PhysicalResource[]>(initialLabs)
  const [rooms, setRooms] = useState<PhysicalResource[]>(initialRooms)

  const totalCapacity = [...labs, ...rooms].reduce((sum, r) => sum + r.capacity, 0)
  const activeLabs = labs.length
  const lectureRooms = rooms.length

  const handleLabCapacityChange = (id: string, capacity: number) => {
    setLabs(labs.map(lab => lab.id === id ? { ...lab, capacity } : lab))
  }

  const handleRoomCapacityChange = (id: string, capacity: number) => {
    setRooms(rooms.map(room => room.id === id ? { ...room, capacity } : room))
  }

  const handleSave = () => {
    // In real app, this would call the API to save changes
    console.log('Saving changes:', { labs, rooms })
    // api.put(`/branches/${params.branchId}/physical-resources`, { labs, rooms })
  }

  const tabs = [
    {
      id: 'labs',
      label: 'Labs(IT)',
      content: (
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
      ),
    },
    {
      id: 'rooms',
      label: 'Lecture Rooms',
      content: (
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
      ),
    },
  ]

  return (
    <MainLayout title={`Data: Physical Resources - ${branchName}`}>
      <div className="space-y-4 sm:space-y-6">
        <Link
          href={`/data/${params.branchId}`}
          className="text-teal-400 hover:text-teal-300 transition-colors inline-flex items-center gap-2 text-sm sm:text-base"
        >
          ← Back to Data Management ({branchName})
        </Link>

        <div>
          <h2 className="text-white text-lg sm:text-xl font-bold uppercase mb-2">PHYSICAL DATA</h2>
        </div>

        <SummaryCards
          totalCapacity={totalCapacity}
          activeLabs={activeLabs}
          lectureRooms={lectureRooms}
        />

        <Tabs tabs={tabs} defaultTab="labs" />

        <div className="flex justify-end">
          <Button variant="primary" icon={<Save className="w-4 h-4" />} onClick={handleSave} className="w-full sm:w-auto">
            Save Changes
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}

