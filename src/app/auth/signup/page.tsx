'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { AuthForm } from '@/components/auth/AuthForm'
import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function SignUpPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600
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
            <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3">Create your account</h1>
            <p className="text-gray-600 started with Notifi. Free plan available, no credit card required.</p>
          </div>

          <AuthForm
            mode="signup"
            onSuccess={() => router.push('/auth/verify-email')}
          />

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <Link href="/auth/signin" className="font-bold text-gray-900 hover:text-gray-700 transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          {/* Terms and Privacy */}
          <div className="mt-8 pt-6 border-t border-gray-200
            <p className="text-xs text-gray-500 text-center">
              By signing up, you agree to our{' '}
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