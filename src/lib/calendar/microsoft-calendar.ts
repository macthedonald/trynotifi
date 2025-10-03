import { Client } from '@microsoft/microsoft-graph-client'
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials'
import { ClientSecretCredential } from '@azure/identity'

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID!
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET!
const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID || 'common'
const MICROSOFT_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/calendar/microsoft/callback'

const SCOPES = [
  'https://graph.microsoft.com/Calendars.ReadWrite',
  'https://graph.microsoft.com/Calendars.Read',
  'offline_access'
]

/**
 * Generate Microsoft OAuth URL for calendar authorization
 */
export function getMicrosoftAuthUrl(userId: string): string {
  const params = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    response_type: 'code',
    redirect_uri: MICROSOFT_REDIRECT_URI,
    response_mode: 'query',
    scope: SCOPES.join(' '),
    state: userId,
    prompt: 'consent'
  })

  return `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`
}

/**
 * Exchange authorization code for tokens
 */
export async function getMicrosoftTokens(code: string) {
  const tokenEndpoint = `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`

  const params = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    client_secret: MICROSOFT_CLIENT_SECRET,
    code,
    redirect_uri: MICROSOFT_REDIRECT_URI,
    grant_type: 'authorization_code',
    scope: SCOPES.join(' ')
  })

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to get tokens: ${error.error_description}`)
  }

  return await response.json()
}

/**
 * Create Microsoft Graph client with access token
 */
function createGraphClient(accessToken: string): Client {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken)
    }
  })
}

/**
 * Fetch calendar events from Microsoft Calendar
 */
export async function fetchMicrosoftCalendarEvents(
  accessToken: string,
  calendarId?: string,
  timeMin?: Date,
  timeMax?: Date
) {
  const client = createGraphClient(accessToken)

  const endpoint = calendarId
    ? `/me/calendars/${calendarId}/events`
    : '/me/calendar/events'

  let query = client
    .api(endpoint)
    .select('subject,start,end,bodyPreview,isAllDay,id,webLink')
    .orderby('start/dateTime')
    .top(250)

  if (timeMin) {
    query = query.filter(`start/dateTime ge '${timeMin.toISOString()}'`)
  }

  if (timeMax) {
    query = query.filter(`end/dateTime le '${timeMax.toISOString()}'`)
  }

  const response = await query.get()
  return response.value || []
}

/**
 * Create event in Microsoft Calendar
 */
export async function createMicrosoftCalendarEvent(
  accessToken: string,
  eventData: {
    subject: string
    body?: { contentType: 'HTML' | 'Text'; content: string }
    start: { dateTime: string; timeZone: string }
    end: { dateTime: string; timeZone: string }
    isReminderOn?: boolean
    reminderMinutesBeforeStart?: number
  },
  calendarId?: string
) {
  const client = createGraphClient(accessToken)

  const endpoint = calendarId
    ? `/me/calendars/${calendarId}/events`
    : '/me/calendar/events'

  const response = await client.api(endpoint).post(eventData)

  return response
}

/**
 * Update event in Microsoft Calendar
 */
export async function updateMicrosoftCalendarEvent(
  accessToken: string,
  eventId: string,
  eventData: {
    subject?: string
    body?: { contentType: 'HTML' | 'Text'; content: string }
    start?: { dateTime: string; timeZone: string }
    end?: { dateTime: string; timeZone: string }
    isReminderOn?: boolean
    reminderMinutesBeforeStart?: number
  },
  calendarId?: string
) {
  const client = createGraphClient(accessToken)

  const endpoint = calendarId
    ? `/me/calendars/${calendarId}/events/${eventId}`
    : `/me/events/${eventId}`

  const response = await client.api(endpoint).patch(eventData)

  return response
}

/**
 * Delete event from Microsoft Calendar
 */
export async function deleteMicrosoftCalendarEvent(
  accessToken: string,
  eventId: string,
  calendarId?: string
) {
  const client = createGraphClient(accessToken)

  const endpoint = calendarId
    ? `/me/calendars/${calendarId}/events/${eventId}`
    : `/me/events/${eventId}`

  await client.api(endpoint).delete()
}

/**
 * List all user's calendars
 */
export async function listMicrosoftCalendars(accessToken: string) {
  const client = createGraphClient(accessToken)

  const response = await client
    .api('/me/calendars')
    .select('id,name,color,canEdit,isDefaultCalendar')
    .get()

  return response.value || []
}

/**
 * Refresh access token using refresh token
 */
export async function refreshMicrosoftAccessToken(refreshToken: string) {
  const tokenEndpoint = `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`

  const params = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    client_secret: MICROSOFT_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    scope: SCOPES.join(' ')
  })

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to refresh token: ${error.error_description}`)
  }

  const data = await response.json()
  return data.access_token
}
