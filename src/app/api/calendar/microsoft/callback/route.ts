import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getMicrosoftTokens } from '@/lib/calendar/microsoft-calendar'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state') // user_id
  const error = searchParams.get('error')

  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(
      new URL('/integrations?error=oauth_cancelled', request.url)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/integrations?error=invalid_callback', request.url)
    )
  }

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    const userId = state

    // Exchange code for tokens
    const tokens = await getMicrosoftTokens(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to obtain tokens')
    }

    // Get primary calendar info
    const calendarResponse = await fetch(
      'https://graph.microsoft.com/v1.0/me/calendar',
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      }
    )

    const primaryCalendar = await calendarResponse.json()

    // Calculate token expiry
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokens.expires_in || 3600))

    // Store connection in database
    const { error: insertError } = await supabase
      .from('calendar_connections')
      .upsert({
        user_id: userId,
        provider: 'microsoft',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt.toISOString(),
        calendar_id: 'primary',
        calendar_name: primaryCalendar.name || 'Calendar',
        is_connected: true,
        sync_enabled: true,
        sync_direction: 'both',
        auto_sync: true
      }, {
        onConflict: 'user_id,provider,calendar_id'
      })

    if (insertError) {
      console.error('Database error:', insertError)
      throw insertError
    }

    // Trigger initial sync
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      await fetch(`${supabaseUrl}/functions/v1/sync-calendar-events`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      })
    } catch (syncError) {
      console.error('Initial sync failed (non-blocking):', syncError)
    }

    return NextResponse.redirect(
      new URL('/integrations?success=microsoft_connected', request.url)
    )

  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(
      new URL('/integrations?error=connection_failed', request.url)
    )
  }
}
