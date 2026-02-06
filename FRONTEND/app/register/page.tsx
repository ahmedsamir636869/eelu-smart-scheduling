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

const expatriateOptions = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
]

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('INSTRUCTOR')
  const [isExpatriate, setIsExpatriate] = useState<string>('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate isExpatriate is selected for TA role
    if (role === 'TA' && isExpatriate === '') {
      setError('Please select your expatriate status.')
      return
    }

    setLoading(true)

    try {
      // Convert string to boolean, only send isExpatriate if role is TA
      const expatriateValue = role === 'TA' ? isExpatriate === 'true' : false
      await register(email, password, name, role, expatriateValue)
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
                onChange={(e) => {
                  setRole(e.target.value)
                  // Reset isExpatriate when role changes
                  if (e.target.value !== 'TA') {
                    setIsExpatriate('')
                  }
                }}
                disabled={loading}
              />
            </div>

            {/* Show isExpatriate select only for Teaching Assistants */}
            {role === 'TA' && (
              <div>
                <label htmlFor="isExpatriate" className="block text-sm font-medium text-gray-300 mb-2">
                  Expatriate Status <span className="text-red-400">*</span>
                </label>
                <Select
                  options={expatriateOptions}
                  value={isExpatriate}
                  onChange={(e) => setIsExpatriate(e.target.value)}
                  disabled={loading}
                  placeholder="Select your status"
                />
              </div>
            )}

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

