import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options)
          },
          remove(name: string, options: any) {
            cookieStore.delete(name)
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=callback_error`)
    }

    // Check if this is a new user (first time sign in after email verification)
    if (data?.session?.user) {
      const { data: userData } = await supabase
        .from('users')
        .select('created_at')
        .eq('id', data.session.user.id)
        .single()

      // If user was created recently (within last 5 minutes), redirect to welcome page
      if (userData?.created_at) {
        const createdAt = new Date(userData.created_at)
        const now = new Date()
        const timeDiff = now.getTime() - createdAt.getTime()
        const fiveMinutes = 5 * 60 * 1000

        if (timeDiff < fiveMinutes) {
          return NextResponse.redirect(`${requestUrl.origin}/auth/welcome`)
        }
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}${next}`)
}