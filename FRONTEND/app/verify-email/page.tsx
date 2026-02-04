'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MainLayout } from '@/components/layout/MainLayout'
import { api, ApiError } from '@/lib/api'
import { Mail, RefreshCw } from 'lucide-react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    // Get email from query params or localStorage
    const emailParam = searchParams.get('email')
    const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('pendingVerificationEmail') : null
    
    if (emailParam) {
      setEmail(emailParam)
      if (typeof window !== 'undefined') {
        localStorage.setItem('pendingVerificationEmail', emailParam)
      }
    } else if (storedEmail) {
      setEmail(storedEmail)
    } else {
      // No email found, redirect to register
      router.push('/register')
    }
  }, [searchParams, router])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }

    try {
      setLoading(true)
      await api.post(
        '/auth/verify-email',
        { email, otp },
        undefined,
        false // Don't require auth for verification
      )
      
      setSuccess('Email verified successfully! Redirecting to login...')
      
      // Clear stored email
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pendingVerificationEmail')
      }
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login?verified=true')
      }, 2000)
    } catch (err: any) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Verification failed. Please check your OTP and try again.'
      setError(errorMessage)
      setOtp('') // Clear OTP on error
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (!email) {
      setError('Email is required')
      return
    }

    try {
      setResending(true)
      setError('')
      await api.post(
        '/auth/resend-verification-otp',
        { email },
        undefined,
        false
      )
      setSuccess('OTP has been resent to your email. Please check your inbox.')
    } catch (err: any) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to resend OTP. Please try again.'
      setError(errorMessage)
    } finally {
      setResending(false)
    }
  }

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6) // Only numbers, max 6 digits
    setOtp(value)
    setError('')
  }

  if (!email) {
    return (
      <MainLayout title="Verify Email">
        <div className="max-w-md mx-auto mt-8">
          <Card>
            <div className="text-center text-gray-400">Loading...</div>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Verify Email">
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-full mb-4">
              <Mail className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Verify Your Email</h1>
            <p className="text-gray-400 text-sm">
              We've sent a 6-digit verification code to
            </p>
            <p className="text-white font-medium mt-1">{email}</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-lg text-green-200 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-300 mb-2">
                Enter Verification Code
              </label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={handleOtpChange}
                required
                placeholder="000000"
                disabled={loading}
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
                autoComplete="one-time-code"
                autoFocus
              />
              <p className="text-gray-500 text-xs mt-2">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-gray-400 text-sm text-center mb-4">
              Didn't receive the code?
            </p>
            <Button
              type="button"
              variant="secondary"
              icon={<RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />}
              onClick={handleResendOtp}
              disabled={resending}
              className="w-full"
            >
              {resending ? 'Sending...' : 'Resend OTP'}
            </Button>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => router.push('/register')}
              className="text-gray-400 hover:text-gray-300 text-sm underline"
            >
              Use a different email
            </button>
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <MainLayout title="Verify Email">
        <div className="max-w-md mx-auto mt-8">
          <Card>
            <div className="text-center text-gray-400">Loading...</div>
          </Card>
        </div>
      </MainLayout>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}

