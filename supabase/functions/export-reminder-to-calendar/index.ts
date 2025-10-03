import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface RequestBody {
  reminder_id: string
  user_id: string
}

// Create event in Google Calendar
async function createGoogleEvent(
  accessToken: string,
  refreshToken: string,
  calendarId: string,
  eventData: any
) {
  // Refresh token
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

  // Create event
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Google Calendar API error: ${error.error?.message || 'Unknown error'}`)
  }

  return { event: await response.json(), newAccessToken: access_token }
}

// Create event in Microsoft Calendar
async function createMicrosoftEvent(
  accessToken: string,
  refreshToken: string,
  calendarId: string | undefined,
  eventData: any
) {
  // Refresh token
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

  // Create event
  const endpoint = calendarId
    ? `https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/events`
    : 'https://graph.microsoft.com/v1.0/me/calendar/events'

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventData)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Microsoft Calendar API error: ${error.error?.message || 'Unknown error'}`)
  }

  return { event: await response.json(), newAccessToken: access_token }
}

serve(async (req) => {
  try {
    const { reminder_id, user_id }: RequestBody = await req.json()

    if (!reminder_id || !user_id) {
      return new Response(
        JSON.stringify({ error: 'reminder_id and user_id are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Fetch reminder details
    const { data: reminder, error: reminderError } = await supabase
      .from('reminders')
      .select('*')
      .eq('id', reminder_id)
      .eq('user_id', user_id)
      .single()

    if (reminderError || !reminder) {
      return new Response(
        JSON.stringify({ error: 'Reminder not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get all active calendar connections for this user
    const { data: connections, error: connectionsError } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_connected', true)
      .in('sync_direction', ['export', 'both'])

    if (connectionsError) throw connectionsError

    if (!connections || connections.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No calendar connections configured for export' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const results = []

    // Export to each connected calendar
    for (const connection of connections) {
      try {
        // Prepare event data
        const startDateTime = new Date(reminder.datetime)
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000) // 1 hour duration

        let createdEvent
        let newAccessToken = connection.access_token

        if (connection.provider === 'google') {
          const eventData = {
            summary: reminder.title,
            description: reminder.description || '',
            start: {
              dateTime: startDateTime.toISOString(),
              timeZone: 'UTC'
            },
            end: {
              dateTime: endDateTime.toISOString(),
              timeZone: 'UTC'
            },
            reminders: {
              useDefault: false,
              overrides: reminder.notification_channels?.includes('email')
                ? [{ method: 'email', minutes: 30 }]
                : []
            }
          }

          const result = await createGoogleEvent(
            connection.access_token,
            connection.refresh_token,
            connection.calendar_id,
            eventData
          )
          createdEvent = result.event
          newAccessToken = result.newAccessToken

        } else if (connection.provider === 'microsoft') {
          const eventData = {
            subject: reminder.title,
            body: {
              contentType: 'Text',
              content: reminder.description || ''
            },
            start: {
              dateTime: startDateTime.toISOString(),
              timeZone: 'UTC'
            },
            end: {
              dateTime: endDateTime.toISOString(),
              timeZone: 'UTC'
            },
            isReminderOn: reminder.notification_channels?.length > 0,
            reminderMinutesBeforeStart: 30
          }

          const result = await createMicrosoftEvent(
            connection.access_token,
            connection.refresh_token,
            connection.calendar_id === 'primary' ? undefined : connection.calendar_id,
            eventData
          )
          createdEvent = result.event
          newAccessToken = result.newAccessToken
        }

        // Update access token if refreshed
        if (newAccessToken !== connection.access_token) {
          await supabase
            .from('calendar_connections')
            .update({ access_token: newAccessToken })
            .eq('id', connection.id)
        }

        // Create event record in database
        const { data: dbEvent, error: eventError } = await supabase
          .from('events')
          .insert({
            user_id,
            connection_id: connection.id,
            source: connection.provider === 'google' ? 'google' : 'outlook',
            external_id: createdEvent.id,
            title: reminder.title,
            description: reminder.description || '',
            datetime: startDateTime.toISOString(),
            end_datetime: endDateTime.toISOString(),
            is_all_day: false,
            timezone: 'UTC',
            event_url: connection.provider === 'google' ? createdEvent.htmlLink : createdEvent.webLink,
            last_synced_at: new Date().toISOString(),
            is_synced: true
          })
          .select()
          .single()

        if (eventError) throw eventError

        // Link event to reminder in junction table
        await supabase
          .from('event_reminders')
          .insert({
            user_id,
            event_id: dbEvent.id,
            reminder_id,
            sync_status: 'synced'
          })

        // Mark reminder as synced
        await supabase
          .from('reminders')
          .update({ synced_to_calendar: true })
          .eq('id', reminder_id)

        results.push({
          provider: connection.provider,
          calendar_id: connection.calendar_id,
          event_id: createdEvent.id,
          success: true
        })

      } catch (error) {
        console.error(`Error exporting to ${connection.provider}:`, error)
        results.push({
          provider: connection.provider,
          calendar_id: connection.calendar_id,
          success: false,
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reminder_id,
        exports: results
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Export error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
