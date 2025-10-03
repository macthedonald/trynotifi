'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { AuthForm } from '@/components/auth/AuthForm'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && user) {
      // Check if there's a redirect parameter
      const redirect = searchParams?.get('redirect')
      if (redirect && redirect.startsWith('/')) {
        router.push(redirect)
      } else {
        router.push('/dashboard')
      }
    }

    // Check for error from callback
    const errorParam = searchParams?.get('error')
    if (errorParam === 'callback_error') {
      setError('There was an error verifying your email. Please try signing in again.')
    }
  }, [user, loading, router, searchParams])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 lg:p-8 transition-colors duration-300">
      <div className="w-full max-w-md">
        {/* Back to Home Link */}
        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to home</span>
        </Link>

        {/* Card */}
        <div className="bg-gray-50 rounded-3xl shadow-2xl p-8 lg:p-10 border border-gray-200
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold">N</span>
            </div>
            <span className="text-xl font-bold text-gray-900
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3">Welcome back</h1>
            <p className="text-gray-600 in to your account to continue</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <AuthForm
            mode="signin"
            onSuccess={() => {
              const redirect = searchParams?.get('redirect')
              if (redirect && redirect.startsWith('/')) {
                router.push(redirect)
              } else {
                router.push('/dashboard')
              }
            }}
          />

          {/* Forgot Password Link */}
          <div className="mt-4 text-center">
            <Link href="/auth/forgot-password" className="text-sm text-gray-900 hover:text-gray-700 font-medium transition-colors">
              Forgot your password?
            </Link>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="font-bold text-gray-900 hover:text-gray-700 transition-colors">
                Sign up for free
              </Link>
            </p>
          </div>

          {/* Terms and Privacy */}
          <div className="mt-8 pt-6 border-t border-gray-200
            <p className="text-xs text-gray-500 text-center">
              By continuing, you agree to our{' '}
              <Link href="/terms" className="text-gray-900 hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-gray-900 hover:underline">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}