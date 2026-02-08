'use client'

import { useState } from 'react'
import { Search, Bell, Moon, User, ChevronDown, Menu, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface HeaderProps {
  title: string
  subtitle?: string
  onMenuClick: () => void
}

export function Header({ title, subtitle, onMenuClick }: HeaderProps) {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const { logout } = useAuth()

  return (
    <div className="bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-white text-xl sm:text-2xl font-bold truncate">{title}</h1>
            {subtitle && <p className="text-gray-400 text-xs sm:text-sm mt-1 truncate">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 lg:w-64"
            />
          </div>

          <button className="text-gray-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
          </button>

          <button className="text-gray-400 hover:text-white transition-colors hidden sm:block">
            <Moon className="w-5 h-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <User className="w-5 h-5" />
              <ChevronDown className="w-4 h-4 hidden sm:block" />
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-gray-700">
                  <p className="text-white text-sm font-medium">User ic...</p>
                </div>
                <div className="p-1">
                  <Link
                    href="/profile"
                    className="block px-3 py-2 text-gray-300 hover:bg-gray-700 rounded text-sm transition-colors"
                    onClick={() => setShowProfileDropdown(false)}
                  >
                    My Profile
                  </Link>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-gray-700 rounded text-sm transition-colors text-left"
                    onClick={() => {
                      setShowProfileDropdown(false)
                      logout()
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

