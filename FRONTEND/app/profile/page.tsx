'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Shield, Calendar, CheckCircle, XCircle, Save, Lock } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { userApi, ApiError } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

interface UserProfile {
  id: string
  name: string
  email: string
  roles: string[]
  isExpatriate: boolean | null
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

export default function ProfilePage() {
  const { user: authUser, refreshToken } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isExpatriate, setIsExpatriate] = useState<boolean | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswordSection, setShowPasswordSection] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setEmail(profile.email || '')
      setIsExpatriate(profile.isExpatriate)
    }
  }, [profile])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError('')
      const userProfile = await userApi.getProfile()
      setProfile(userProfile)
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to load profile. Please try again.'
      setError(errorMessage)
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setError('')
    setSuccess('')

    // Validation
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    // Password validation if changing password
    if (showPasswordSection) {
      if (!currentPassword) {
        setError('Current password is required to change password')
        return
      }
      if (!newPassword) {
        setError('New password is required')
        return
      }
      if (newPassword.length < 6) {
        setError('New password must be at least 6 characters')
        return
      }
      if (newPassword !== confirmPassword) {
        setError('New passwords do not match')
        return
      }
    }

    try {
      setSaving(true)
      
      const updateData: any = {
        name: name.trim(),
        email: email.trim(),
        isExpatriate: isExpatriate,
      }

      if (showPasswordSection && newPassword) {
        updateData.password = newPassword
      }

      const updatedProfile = await userApi.updateProfile(updateData)
      setProfile(updatedProfile)
      setSuccess('Profile updated successfully!')
      setShowPasswordSection(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      // Refresh auth context to update user info
      await refreshToken()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to update profile. Please try again.'
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'INSTRUCTOR':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'TA':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <MainLayout title="Profile">
          <div className="text-center py-12 text-gray-400">Loading profile...</div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  if (!profile) {
    return (
      <ProtectedRoute>
        <MainLayout title="Profile">
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">Failed to load profile.</p>
            <Button variant="primary" onClick={fetchProfile}>
              Retry
            </Button>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <MainLayout title="My Profile">
        <div className="space-y-6 max-w-4xl">
          {error && (
            <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-900/50 border border-green-700 rounded-lg text-green-200">
              {success}
            </div>
          )}

          {/* Profile Header */}
          <Card>
            <div className="p-6">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <User className="w-10 h-10 text-teal-400" />
                </div>
                <div className="flex-1">
                  <h1 className="text-white text-2xl font-bold mb-2">{profile.name}</h1>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {profile.roles.map((role) => (
                      <Badge key={role} className={getRoleBadgeColor(role)}>
                        {role}
                      </Badge>
                    ))}
                    {profile.isExpatriate && (
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                        Expatriate
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Mail className="w-4 h-4" />
                    <span>{profile.email}</span>
                    {profile.emailVerified ? (
                      <span className="flex items-center gap-1 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-yellow-400">
                        <XCircle className="w-4 h-4" />
                        Not Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Profile Information */}
          <Card>
            <div className="p-6">
              <h2 className="text-white text-xl font-bold mb-6">Profile Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Full Name *
                  </label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                  {profile.emailVerified && email !== profile.email && (
                    <p className="text-yellow-400 text-xs mt-1">
                      Changing your email will require verification
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Expatriate Status
                  </label>
                  <select
                    value={isExpatriate === null ? '' : isExpatriate.toString()}
                    onChange={(e) => {
                      const value = e.target.value
                      setIsExpatriate(value === '' ? null : value === 'true')
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Not Specified</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Password Section */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white text-xl font-bold">Change Password</h2>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowPasswordSection(!showPasswordSection)
                    setCurrentPassword('')
                    setNewPassword('')
                    setConfirmPassword('')
                  }}
                >
                  {showPasswordSection ? 'Cancel' : 'Change Password'}
                </Button>
              </div>

              {showPasswordSection && (
                <div className="space-y-4 pt-4 border-t border-gray-700">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Current Password *
                    </label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      New Password *
                    </label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Confirm New Password *
                    </label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Account Information */}
          <Card>
            <div className="p-6">
              <h2 className="text-white text-xl font-bold mb-6">Account Information</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Member Since</p>
                    <p className="text-white">{formatDate(profile.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-gray-400 text-sm">Account ID</p>
                    <p className="text-white font-mono text-sm">{profile.id}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button
              variant="primary"
              icon={<Save className="w-4 h-4" />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}

