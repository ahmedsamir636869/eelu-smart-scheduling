'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { setAccessToken, getAccessToken, removeAccessToken, isTokenExpired } from '@/lib/auth'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string, role?: string) => Promise<void>
  register: (email: string, password: string, name: string, role: string, isExpatriate?: boolean) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check for existing token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getAccessToken()
      if (token && !isTokenExpired(token)) {
        // Token exists and is valid, try to get user info
        try {
          const userInfo = await api.get<User>('/auth/me')
          setUser(userInfo)
        } catch (error) {
          // If fetching user info fails, clear token
          removeAccessToken()
        }
        setLoading(false)
      } else if (token && isTokenExpired(token)) {
        // Token expired, try to refresh
        try {
          await refreshToken()
          // After refresh, try to get user info
          const userInfo = await api.get<User>('/auth/me')
          setUser(userInfo)
        } catch (error) {
          // Refresh failed, already handled in refreshToken
        }
        setLoading(false)
      } else {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string, role?: string) => {
    try {
      const response = await api.post<{ accessToken: string; user: User }>(
        '/auth/login',
        { email, password, role },
        undefined,
        false // Don't require auth for login
      )

      setAccessToken(response.accessToken)
      setUser(response.user)
      router.push('/dashboard')
    } catch (error: any) {
      throw new Error(error.message || 'Login failed')
    }
  }

  const register = async (email: string, password: string, name: string, role: string, isExpatriate: boolean = false) => {
    try {
      const response = await api.post<{ message: string; user: User }>(
        '/auth/register',
        { email, password, name, role, isExpatriate },
        undefined,
        false // Don't require auth for register
      )

      // Store email for OTP verification
      if (typeof window !== 'undefined') {
        localStorage.setItem('pendingVerificationEmail', email)
      }

      // Redirect to OTP verification page instead of auto-login
      router.push(`/verify-email?email=${encodeURIComponent(email)}`)
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed')
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout', undefined, undefined, true)
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error)
    } finally {
      removeAccessToken()
      setUser(null)
      router.push('/login')
    }
  }

  const refreshToken = async () => {
    try {
      const response = await api.post<{ accessToken: string }>(
        '/auth/refresh',
        undefined,
        undefined,
        false // Don't require auth token for refresh (uses cookie)
      )
      setAccessToken(response.accessToken)
    } catch (error) {
      // Refresh failed, clear token and redirect to login
      removeAccessToken()
      setUser(null)
      router.push('/login')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshToken,
        isAuthenticated: !!user && !!getAccessToken(),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

