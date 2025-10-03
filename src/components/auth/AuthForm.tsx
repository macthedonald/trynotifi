'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn, signUp, signInWithGoogle, signInWithMicrosoft, signInWithApple } from '@/lib/auth/auth-helpers'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/database/supabase'
import Image from 'next/image'

const baseSchema = {
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
}

const signInSchema = z.object(baseSchema)
const signUpSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  ...baseSchema,
})

type SignInData = z.infer<typeof signInSchema>
type SignUpData = z.infer<typeof signUpSchema>

interface AuthFormProps {
  mode: 'signin' | 'signup'
  onSuccess?: () => void
}

export const AuthForm = ({ mode, onSuccess }: AuthFormProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(mode === 'signin' ? signInSchema : signUpSchema),
  })

  const onSubmit = async (data: any) => {
    setIsLoading(true)
    setError(null)

    try {
      if (mode === 'signin') {
        // Try to sign in
        await signIn(data.email, data.password)
      } else {
        // For signup, check if email already exists
        const { data: existingUsers } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', data.email)
          .limit(1)

        if (existingUsers && existingUsers.length > 0) {
          setError('An account with this email already exists. Please sign in instead.')
          return
        }

        // Email is available, proceed with signup
        await signUp(data.email, data.password, data.firstName, data.lastName)
        // Store email for verification page
        localStorage.setItem('pendingVerificationEmail', data.email)
      }
      onSuccess?.()
    } catch (err: any) {
      // Better error messages
      if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials and try again.')
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Please verify your email address before signing in. Check your inbox for the verification code.')
      } else {
        setError(err.message || 'An error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await signInWithGoogle()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMicrosoftSignIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await signInWithMicrosoft()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAppleSignIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await signInWithApple()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Social Login - Premium */}
      <div className="space-y-3 mb-6">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 rounded-xl px-4 py-4 font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 shadow-sm hover:shadow-md"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <button
          type="button"
          onClick={handleMicrosoftSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 rounded-xl px-4 py-4 font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 shadow-sm hover:shadow-md"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#f25022" d="M1 1h10v10H1z"/>
            <path fill="#00a4ef" d="M13 1h10v10H13z"/>
            <path fill="#7fba00" d="M1 13h10v10H1z"/>
            <path fill="#ffb900" d="M13 13h10v10H13z"/>
          </svg>
          Continue with Microsoft
        </button>

        <button
          type="button"
          onClick={handleAppleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-black border-2 border-black rounded-xl px-4 py-4 font-semibold text-white hover:bg-gray-900 transition-all disabled:opacity-50 shadow-sm hover:shadow-md"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          Continue with Apple
        </button>
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500 font-medium">Or continue with email</span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {mode === 'signup' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                type="text"
                placeholder="First name"
                {...register('firstName')}
                error={errors.firstName?.message as string}
                className="py-6"
              />
            </div>
            <div>
              <Input
                type="text"
                placeholder="Last name"
                {...register('lastName')}
                error={errors.lastName?.message as string}
                className="py-6"
              />
            </div>
          </div>
        )}

        <div>
          <Input
            type="email"
            placeholder="Email address"
            {...register('email')}
            error={errors.email?.message as string}
            className="py-6"
          />
        </div>

        <div>
          <Input
            type="password"
            placeholder="Password"
            {...register('password')}
            error={errors.password?.message as string}
            className="py-6"
          />
        </div>

        <Button
          type="submit"
          className="w-full py-6 font-bold text-base shadow-lg"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
        </Button>
      </form>
    </div>
  )
}