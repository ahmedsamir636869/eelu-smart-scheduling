'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { MainLayout } from '@/components/layout/MainLayout'
import Link from 'next/link'

const roleOptions = [
  { value: 'INSTRUCTOR', label: 'Instructor' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'TA', label: 'Teaching Assistant' },
]

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('INSTRUCTOR')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await register(email, password, name, role)
      // Registration successful - user will be redirected to OTP page
      // No need to set loading to false as we're navigating away
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <MainLayout title="Register">
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <h1 className="text-2xl font-bold text-white mb-6">Create Account</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter your full name"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Enter your password (min 6 characters)"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
                Role
              </label>
              <Select
                options={roleOptions}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Register'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 underline">
                Login here
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}

