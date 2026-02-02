'use client'

import { ReactNode, useState } from 'react'
import { cn } from '@/lib/utils'

interface TabsProps {
  tabs: { id: string; label: string; content: ReactNode }[]
  defaultTab?: string
}

export function Tabs({ tabs, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const activeContent = tabs.find(tab => tab.id === activeTab)?.content

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-teal-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{activeContent}</div>
    </div>
  )
}

