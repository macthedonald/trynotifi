import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Import Google Calendar helpers
async function fetchGoogleCalendarEvents(
  accessToken: string,
  refreshToken: string,
  calendarId: string,
  timeMin: Date
) {
  // Refresh token if needed
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  })

  const { access_token } = await tokenResponse.json()

  // Fetch events from Google Calendar
  const eventsUrl = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`)
  eventsUrl.searchParams.set('timeMin', timeMin.toISOString())
  eventsUrl.searchParams.set('maxResults', '250')
  eventsUrl.searchParams.set('singleEvents', 'true')
  eventsUrl.searchParams.set('orderBy', 'startTime')

  const eventsResponse = await fetch(eventsUrl.toString(), {
    headers: { Authorization: `Bearer ${access_token}` }
  })

  const data = await eventsResponse.json()
  return { events: data.items || [], newAccessToken: access_token }
}

// Import Microsoft Calendar helpers
async function fetchMicrosoftCalendarEvents(
  accessToken: string,
  refreshToken: string,
  calendarId: string | undefined,
  timeMin: Date
) {
  // Refresh token if needed
  const tokenResponse = await fetch(
    `https://login.microsoftonline.com/${Deno.env.get('MICROSOFT_TENANT_ID') || 'common'}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: Deno.env.get('MICROSOFT_CLIENT_ID')!,
        client_secret: Deno.env.get('MICROSOFT_CLIENT_SECRET')!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/Calendars.ReadWrite offline_access'
      })
    }
  )

  const { access_token } = await tokenResponse.json()

  // Fetch events from Microsoft Calendar
  const endpoint = calendarId
    ? `https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/events`
    : 'https://graph.microsoft.com/v1.0/me/calendar/events'

  const eventsUrl = new URL(endpoint)
  eventsUrl.searchParams.set('$select', 'subject,start,end,bodyPreview,isAllDay,id,webLink')
  eventsUrl.searchParams.set('$orderby', 'start/dateTime')
  eventsUrl.searchParams.set('$top', '250')
  eventsUrl.searchParams.set('$filter', `start/dateTime ge '${timeMin.toISOString()}'`)

  const eventsResponse = await fetch(eventsUrl.toString(), {
    headers: { Authorization: `Bearer ${access_token}` }
  })

  const data = await eventsResponse.json()
  return { events: data.value || [], newAccessToken: access_token }
}

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get all active calendar connections
    const { data: connections, error: connectionsError } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('is_connected', true)
      .eq('sync_enabled', true)

    if (connectionsError) throw connectionsError

    console.log(`Found ${connections?.length || 0} active calendar connections`)

    const results = []

    for (const connection of connections || []) {
      try {
        console.log(`Syncing ${connection.provider} calendar for user ${connection.user_id}`)

        // Fetch events from the last 7 days to today + 90 days
        const timeMin = new Date()
        timeMin.setDate(timeMin.getDate() - 7)

        let events: any[] = []
        let newAccessToken = connection.access_token

        if (connection.provider === 'google') {
          const result = await fetchGoogleCalendarEvents(
            connection.access_token,
            connection.refresh_token,
            connection.calendar_id,
            timeMin
          )
          events = result.events
          newAccessToken = result.newAccessToken
        } else if (connection.provider === 'microsoft') {
          const result = await fetchMicrosoftCalendarEvents(
            connection.access_token,
            connection.refresh_token,
            connection.calendar_id === 'primary' ? undefined : connection.calendar_id,
            timeMin
          )
          events = result.events
          newAccessToken = result.newAccessToken
        }

        // Update access token if refreshed
        if (newAccessToken !== connection.access_token) {
          await supabase
            .from('calendar_connections')
            .update({ access_token: newAccessToken })
            .eq('id', connection.id)
        }

        console.log(`Fetched ${events.length} events from ${connection.provider}`)

        // Upsert events to database
        for (const event of events) {
          const eventData = connection.provider === 'google'
            ? {
                user_id: connection.user_id,
                connection_id: connection.id,
                source: 'google' as const,
                external_id: event.id,
                title: event.summary || 'Untitled Event',
                description: event.description || '',
                datetime: event.start?.dateTime || event.start?.date,
                end_datetime: event.end?.dateTime || event.end?.date,
                is_all_day: !event.start?.dateTime,
                timezone: event.start?.timeZone || 'UTC',
                event_url: event.htmlLink,
                last_synced_at: new Date().toISOString(),
                is_synced: true
              }
            : {
                user_id: connection.user_id,
                connection_id: connection.id,
                source: 'outlook' as const,
                external_id: event.id,
                title: event.subject || 'Untitled Event',
                description: event.bodyPreview || '',
                datetime: event.start?.dateTime,
                end_datetime: event.end?.dateTime,
                is_all_day: event.isAllDay || false,
                timezone: event.start?.timeZone || 'UTC',
                event_url: event.webLink,
                last_synced_at: new Date().toISOString(),
                is_synced: true
              }

          // Upsert event (insert or update if exists)
          const { error: upsertError } = await supabase
            .from('events')
            .upsert(eventData, {
              onConflict: 'connection_id,external_id',
              ignoreDuplicates: false
            })

          if (upsertError) {
            console.error('Error upserting event:', upsertError)
          }
        }

        // Update last synced timestamp
        await supabase
          .from('calendar_connections')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', connection.id)

        results.push({
          connection_id: connection.id,
          provider: connection.provider,
          user_id: connection.user_id,
          events_synced: events.length,
          success: true
        })

      } catch (error) {
        console.error(`Error syncing connection ${connection.id}:`, error)
        results.push({
          connection_id: connection.id,
          provider: connection.provider,
          user_id: connection.user_id,
          success: false,
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced_connections: results.length,
        results
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
