import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Protected routes - require authentication
  const protectedPaths = ['/dashboard', '/create', '/profile', '/schedule', '/history', '/settings', '/help', '/analytics', '/achievements', '/integrations', '/billing']
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath) {
    if (!session) {
      // Store the original URL to redirect back after login
      const redirectUrl = new URL('/auth/signin', request.url)
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Auth routes - redirect to dashboard if already logged in
  const authPaths = ['/auth/signin', '/auth/signup']
  const isAuthPath = authPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isAuthPath) {
    if (session) {
      // Check if there's a redirect parameter
      const redirect = request.nextUrl.searchParams.get('redirect')
      if (redirect && redirect.startsWith('/')) {
        return NextResponse.redirect(new URL(redirect, request.url))
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Verify email route - only accessible without active session
  if (request.nextUrl.pathname.startsWith('/auth/verify-email')) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/create',
    '/profile',
    '/schedule/:path*',
    '/history',
    '/settings',
    '/help',
    '/analytics',
    '/achievements',
    '/integrations',
    '/billing',
    '/auth/signin',
    '/auth/signup',
    '/auth/verify-email'
  ]
}

