'use client'

import { useState, ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface MainLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Header title={title} subtitle={subtitle} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

