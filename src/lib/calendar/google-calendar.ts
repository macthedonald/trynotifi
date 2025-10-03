import { google } from 'googleapis'
import { supabase } from '@/lib/database/supabase'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/calendar/google/callback'

export const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
)

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events'
]

/**
 * Generate Google OAuth URL for calendar authorization
 */
export function getGoogleAuthUrl(userId: string): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: userId, // Pass user ID to identify on callback
    prompt: 'consent' // Force consent screen to get refresh token
  })
}

/**
 * Exchange authorization code for tokens
 */
export async function getGoogleTokens(code: string) {
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

/**
 * Set credentials for authenticated requests
 */
export function setGoogleCredentials(accessToken: string, refreshToken: string) {
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  })
}

/**
 * Fetch calendar events from Google Calendar
 */
export async function fetchGoogleCalendarEvents(
  accessToken: string,
  refreshToken: string,
  calendarId: string = 'primary',
  timeMin?: Date,
  timeMax?: Date
) {
  setGoogleCredentials(accessToken, refreshToken)

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  const response = await calendar.events.list({
    calendarId,
    timeMin: (timeMin || new Date()).toISOString(),
    timeMax: timeMax?.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 250
  })

  return response.data.items || []
}

/**
 * Create event in Google Calendar
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventData: {
    summary: string
    description?: string
    start: { dateTime: string; timeZone?: string }
    end: { dateTime: string; timeZone?: string }
    reminders?: {
      useDefault: boolean
      overrides?: Array<{ method: 'email' | 'popup'; minutes: number }>
    }
  },
  calendarId: string = 'primary'
) {
  setGoogleCredentials(accessToken, refreshToken)

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  const response = await calendar.events.insert({
    calendarId,
    requestBody: eventData
  })

  return response.data
}

/**
 * Update event in Google Calendar
 */
export async function updateGoogleCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventId: string,
  eventData: {
    summary?: string
    description?: string
    start?: { dateTime: string; timeZone?: string }
    end?: { dateTime: string; timeZone?: string }
    reminders?: {
      useDefault: boolean
      overrides?: Array<{ method: 'email' | 'popup'; minutes: number }>
    }
  },
  calendarId: string = 'primary'
) {
  setGoogleCredentials(accessToken, refreshToken)

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  const response = await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: eventData
  })

  return response.data
}

/**
 * Delete event from Google Calendar
 */
export async function deleteGoogleCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventId: string,
  calendarId: string = 'primary'
) {
  setGoogleCredentials(accessToken, refreshToken)

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  await calendar.events.delete({
    calendarId,
    eventId
  })
}

/**
 * List all user's calendars
 */
export async function listGoogleCalendars(
  accessToken: string,
  refreshToken: string
) {
  setGoogleCredentials(accessToken, refreshToken)

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  const response = await calendar.calendarList.list()

  return response.data.items || []
}

/**
 * Refresh access token using refresh token
 */
export async function refreshGoogleAccessToken(refreshToken: string) {
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  })

  const { credentials } = await oauth2Client.refreshAccessToken()
  return credentials.access_token
}
