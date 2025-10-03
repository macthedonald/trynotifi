'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/database/supabase'
import { User } from '@/types'

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('Session error:', sessionError)
        setSupabaseUser(null)
        setUser(null)
        setLoading(false)
        return
      }

      if (session?.user) {
        setSupabaseUser(session.user)

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (userError) {
          console.error('Error fetching user data:', userError)
          // If user doesn't exist in users table, create a basic user object
          setUser({
            id: session.user.id,
            email: session.user.email!,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as User)
        } else {
          setUser(userData)
        }
      } else {
        setSupabaseUser(null)
        setUser(null)
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
      setSupabaseUser(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      // Immediately clear user state (auth state change listener will also handle this)
      setUser(null)
      setSupabaseUser(null)
      setLoading(false)
    } catch (error) {
      console.error('Error signing out:', error)
      setLoading(false)
      throw error
    }
  }

  useEffect(() => {
    // Get initial session
    refreshUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            setSupabaseUser(session.user)

            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (userError) {
              console.error('Error fetching user data:', userError)
              // If user doesn't exist in users table, create a basic user object
              setUser({
                id: session.user.id,
                email: session.user.email!,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              } as User)
            } else {
              setUser(userData)
            }

            // Clear pending verification email from localStorage
            localStorage.removeItem('pendingVerificationEmail')
          }
        } else if (event === 'SIGNED_OUT') {
          setSupabaseUser(null)
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const value: AuthContextType = {
    user,
    supabaseUser,
    loading,
    signOut,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}