'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { verifyOTP, resendOTP } from '@/lib/auth/auth-helpers'
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // If user is already verified, redirect to dashboard
    if (!loading && user) {
      router.push('/dashboard')
    }

    // Get email from URL params or localStorage
    const emailParam = searchParams?.get('email')
    if (emailParam) {
      setEmail(emailParam)
    } else {
      // Try to get from localStorage (set during signup)
      const savedEmail = localStorage.getItem('pendingVerificationEmail')
      if (savedEmail) {
        setEmail(savedEmail)
      }
    }
  }, [user, loading, router, searchParams])

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0]
    }

    if (!/^\d*$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    setError('')

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all fields are filled
    if (index === 5 && value && newCode.every(digit => digit !== '')) {
      handleVerify(newCode.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newCode = pastedData.split('')

    while (newCode.length < 6) {
      newCode.push('')
    }

    setCode(newCode)
    setError('')

    if (newCode.every(digit => digit !== '')) {
      handleVerify(newCode.join(''))
    }
  }

  const handleVerify = async (otp?: string) => {
    const verificationCode = otp || code.join('')

    if (verificationCode.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    if (!email) {
      setError('Email not found. Please try signing up again.')
      return
    }

    setIsVerifying(true)
    setError('')

    try {
      await verifyOTP(email, verificationCode)
      setSuccess(true)

      // Clear pending email from localStorage
      localStorage.removeItem('pendingVerificationEmail')

      // Redirect to dashboard after success
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please try again.')
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    if (!email) {
      setError('Email not found. Please try signing up again.')
      return
    }

    setIsResending(true)
    setError('')

    try {
      await resendOTP(email)
      setResendCooldown(60)
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-10 border border-gray-100">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3">Email verified!</h1>
              <p className="text-gray-600">
                Your email has been successfully verified. Redirecting to dashboard...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <Link href="/auth/signin" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to sign in</span>
        </Link>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-10 border border-gray-100">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3">Verify your email</h1>
            <p className="text-gray-600">
              We sent a 6-digit code to{' '}
              {email && <span className="font-bold text-gray-900">{email}</span>}
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700 text-sm text-center">{error}</p>
            </div>
          )}

          {/* OTP Input */}
          <div className="mb-8">
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 lg:w-14 lg:h-16 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                  disabled={isVerifying}
                />
              ))}
            </div>
          </div>

          {/* Verify Button */}
          <Button
            onClick={() => handleVerify()}
            disabled={isVerifying || code.some(digit => !digit)}
            className="w-full py-6 font-bold text-base shadow-lg mb-4"
          >
            {isVerifying ? 'Verifying...' : 'Verify Email'}
          </Button>

          {/* Resend Section */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Didn't receive the code?
            </p>
            {resendCooldown > 0 ? (
              <p className="text-sm text-gray-500">
                Resend code in {resendCooldown}s
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors disabled:opacity-50"
              >
                {isResending ? 'Sending...' : 'Resend code'}
              </button>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs text-blue-800">
                <strong>Tip:</strong> Check your spam folder if you don't see the email. The code expires in 10 minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}