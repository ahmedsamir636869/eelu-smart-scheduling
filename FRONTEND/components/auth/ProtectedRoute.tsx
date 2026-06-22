'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

function getRoleDashboard(role?: string): string {
  switch (role) {
    case 'INSTRUCTOR':
      return '/doctor'
    case 'TA':
      return '/ta'
    case 'ADMIN':
    default:
      return '/dashboard'
  }
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    } else if (!loading && isAuthenticated && allowedRoles && user) {
      // If allowedRoles is specified, check if user's role is allowed
      if (!allowedRoles.includes(user.role)) {
        router.push(getRoleDashboard(user.role))
      }
    }
  }, [isAuthenticated, loading, router, allowedRoles, user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}
