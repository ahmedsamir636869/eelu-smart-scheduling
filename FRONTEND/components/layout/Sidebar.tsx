'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Zap, 
  Database, 
  Upload, 
  Clock, 
  Settings, 
  LogOut,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/generate', label: 'Generate', icon: Zap },
  { href: '/data', label: 'Data', icon: Database },
  { href: '/published', label: 'Published', icon: Upload },
  { href: '/reports', label: 'Reports', icon: Clock },
]

const generalItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/logout', label: 'Logout', icon: LogOut },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-900 flex flex-col border-r border-gray-800 transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h1 className="text-white font-bold text-lg">EELU Smart Scheduling</h1>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          <div>
            <p className="text-gray-500 text-xs uppercase mb-2 px-2">MENU</p>
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                      isActive
                        ? 'bg-teal-600/20 text-teal-400 border border-teal-600/30'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-gray-500 text-xs uppercase mb-2 px-2">GENERAL</p>
            <div className="space-y-1">
              {generalItems.map((item) => {
                const Icon = item.icon
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>
      </div>
    </>
  )
}

