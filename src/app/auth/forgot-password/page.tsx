'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { resetPassword } from '@/lib/auth/auth-helpers'
import { supabase } from '@/lib/database/supabase'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Check if user exists in the users table
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email)
        .limit(1)

      // If there's an error querying the database
      if (usersError) {
        console.error('Error checking user:', usersError)
        setError('An error occurred. Please try again.')
        return
      }

      // If user doesn't exist, show error
      if (!users || users.length === 0) {
        setError('No account found with this email address. Please check your email or sign up for a new account.')
        return
      }

      // User exists, send reset email
      await resetPassword(email)
      setSuccess(true)
    } catch (err: any) {
      console.error('Reset password error:', err)
      setError(err.message || 'Failed to send reset email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-10 border border-gray-100">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3">Check your email</h1>
              <p className="text-gray-600">
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-blue-800 text-sm">
                <strong>Didn't receive the email?</strong> Check your spam folder or try again in a few minutes.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => router.push('/auth/signin')}
                className="w-full py-6 font-bold text-base"
              >
                Back to Sign In
              </Button>

              <button
                onClick={() => setSuccess(false)}
                className="w-full text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                Try a different email
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-md">
        {/* Back to Sign In Link */}
        <Link href="/auth/signin" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to sign in</span>
        </Link>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-10 border border-gray-100">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold">N</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Notifi</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3">Reset your password</h1>
            <p className="text-gray-600">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="py-6"
                icon={<Mail className="w-5 h-5 text-gray-400" />}
              />
            </div>

            <Button
              type="submit"
              className="w-full py-6 font-bold text-base shadow-lg"
              disabled={isLoading || !email}
            >
              {isLoading ? 'Sending...' : 'Send Reset Instructions'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Remember your password?{' '}
              <Link href="/auth/signin" className="font-bold text-purple-600 hover:text-purple-700 transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          {/* Terms and Privacy */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              By continuing, you agree to our{' '}
              <a href="#" className="text-purple-600 hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-purple-600 hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
