'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Save } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ToggleButton } from '@/components/data/Students/ToggleButton'
import { SectionCard } from '@/components/data/Students/SectionCard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface StudentsPageProps {
  params: {
    branchId: string
  }
}

interface Section {
  id: number
  numberOfStudents: number
  assignedGroup: string
}

// Mock branch data
const branchNames: Record<string, string> = {
  '1': 'Ain Shams',
  '2': 'Assiut',
  '3': 'Alexandria',
}

// Mock initial sections data
const initialSections: Section[] = [
  { id: 1, numberOfStudents: 25, assignedGroup: 'Group A' },
  { id: 2, numberOfStudents: 25, assignedGroup: 'Group A' },
  { id: 3, numberOfStudents: 25, assignedGroup: 'Group B' },
  { id: 4, numberOfStudents: 27, assignedGroup: 'Group B' },
  { id: 5, numberOfStudents: 30, assignedGroup: 'Group B' },
]

export default function StudentsPage({ params }: StudentsPageProps) {
  const branchName = branchNames[params.branchId] || `Branch ${params.branchId}`
  const [selectedCollege, setSelectedCollege] = useState<'IT' | 'Business'>('IT')
  const [selectedLevel, setSelectedLevel] = useState<number>(1)
  const [sections, setSections] = useState<Section[]>(initialSections)

  const totalEnrollment = sections.reduce((sum, section) => sum + section.numberOfStudents, 0)

  const handleStudentsChange = (sectionNumber: number, value: number) => {
    setSections(sections.map(s => s.id === sectionNumber ? { ...s, numberOfStudents: value } : s))
  }

  const handleGroupChange = (sectionNumber: number, value: string) => {
    setSections(sections.map(s => s.id === sectionNumber ? { ...s, assignedGroup: value } : s))
  }

  const handleSave = () => {
    // In real app, this would call the API to save changes
    console.log('Saving students data:', {
      branchId: params.branchId,
      college: selectedCollege,
      level: selectedLevel,
      sections,
    })
    // api.put(`/branches/${params.branchId}/students`, { college: selectedCollege, level: selectedLevel, sections })
  }

  return (
    <MainLayout title={`Data: Students' Data - ${branchName}`}>
      <div className="space-y-4 sm:space-y-6">
        <Link
          href={`/data/${params.branchId}`}
          className="text-teal-400 hover:text-teal-300 transition-colors inline-flex items-center gap-2 text-sm sm:text-base"
        >
          ← Back to Data Management ({branchName})
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="text-white text-lg sm:text-xl font-bold mb-2">Students' Data</h2>
          </div>
          <Card className="bg-gray-800 w-full sm:w-auto">
            <p className="text-gray-400 text-xs sm:text-sm mb-1">TOTAL BRANCH ENROLLMENT</p>
            <p className="text-blue-400 text-xl sm:text-2xl font-bold">{totalEnrollment} Students</p>
          </Card>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-white font-medium mb-3 text-sm sm:text-base">SELECT COLLEGE</h3>
            <div className="flex flex-wrap gap-2">
              <ToggleButton
                label="IT"
                isSelected={selectedCollege === 'IT'}
                onClick={() => setSelectedCollege('IT')}
              />
              <ToggleButton
                label="Business"
                isSelected={selectedCollege === 'Business'}
                onClick={() => setSelectedCollege('Business')}
              />
            </div>
          </div>

          <div>
            <h3 className="text-white font-medium mb-3 text-sm sm:text-base">ACADEMIC LEVEL</h3>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((level) => (
                <ToggleButton
                  key={level}
                  label={`Level ${level}`}
                  isSelected={selectedLevel === level}
                  onClick={() => setSelectedLevel(level)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((section) => (
            <SectionCard
              key={section.id}
              sectionNumber={section.id}
              numberOfStudents={section.numberOfStudents}
              assignedGroup={section.assignedGroup}
              onStudentsChange={handleStudentsChange}
              onGroupChange={handleGroupChange}
            />
          ))}
        </div>

        <div className="flex justify-end">
          <Button variant="primary" icon={<Save className="w-4 h-4" />} onClick={handleSave} className="w-full sm:w-auto">
            Save Changes
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}

