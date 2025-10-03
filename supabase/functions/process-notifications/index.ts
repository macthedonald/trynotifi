import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')

interface Notification {
  id: string
  user_id: string
  reminder_id?: string
  event_id?: string
  send_at: string
  lead_time_minutes: number
  channels: string[]
  status: string
  retry_count: number
  users: {
    email: string
    full_name?: string
    phone_number?: string
    timezone: string
  }
  reminders?: {
    id: string
    title: string
    description?: string
    datetime: string
    priority: string
  }
  events?: {
    id: string
    title: string
    description?: string
    datetime: string
    end_datetime?: string
    location?: string
  }
}

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const now = new Date()

    console.log(`[${now.toISOString()}] Starting notification processor...`)

    // Fetch pending notifications that should be sent now
    const { data: notifications, error: fetchError } = await supabase
      .from('scheduled_notifications')
      .select(`
        *,
        users!scheduled_notifications_user_id_fkey (
          email,
          full_name,
          phone_number,
          timezone
        ),
        reminders (
          id,
          title,
          description,
          datetime,
          priority
        ),
        events (
          id,
          title,
          description,
          datetime,
          end_datetime,
          location
        )
      `)
      .eq('status', 'pending')
      .lte('send_at', now.toISOString())
      .limit(100) // Process in batches

    if (fetchError) throw fetchError

    console.log(`Found ${notifications?.length || 0} notifications to process`)

    let successCount = 0
    let failureCount = 0

    for (const notification of notifications || []) {
      try {
        const item = notification.reminders || notification.events
        const user = notification.users

        if (!item || !user) {
          console.error(`Skipping notification ${notification.id}: missing item or user data`)
          continue
        }

        console.log(`Processing notification ${notification.id} for user ${user.email}`)

        // Send via each requested channel
        const results = await Promise.allSettled([
          notification.channels.includes('email') && sendEmailNotification(user, item, notification.lead_time_minutes),
          notification.channels.includes('push') && sendPushNotification(supabase, user, item, notification.lead_time_minutes, notification.user_id),
          notification.channels.includes('sms') && sendSMSNotification(user, item, notification.lead_time_minutes)
        ])

        // Check if all succeeded
        const allSucceeded = results.every(r => r.status === 'fulfilled')

        // Update notification status
        await supabase
          .from('scheduled_notifications')
          .update({
            status: allSucceeded ? 'sent' : 'failed',
            sent_at: now.toISOString(),
            error_message: allSucceeded ? null : JSON.stringify(
              results
                .filter(r => r.status === 'rejected')
                .map(r => (r as PromiseRejectedResult).reason)
            )
          })
          .eq('id', notification.id)

        // Log each channel
        for (let i = 0; i < notification.channels.length; i++) {
          const channel = notification.channels[i]
          const result = results[i]

          await supabase.from('notification_logs').insert({
            user_id: notification.user_id,
            reminder_id: notification.reminder_id,
            event_id: notification.event_id,
            channel,
            status: result?.status === 'fulfilled' ? 'sent' : 'failed',
            error_message: result?.status === 'rejected' ? (result as PromiseRejectedResult).reason : null,
            sent_at: now.toISOString()
          })
        }

        if (allSucceeded) {
          successCount++
        } else {
          failureCount++
        }

      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error)

        // Handle error with retry logic
        await supabase
          .from('scheduled_notifications')
          .update({
            status: 'failed',
            error_message: (error as Error).message,
            retry_count: notification.retry_count + 1
          })
          .eq('id', notification.id)

        // Retry logic: reschedule if retry_count < 3
        if (notification.retry_count < 3) {
          const retryTime = new Date(now.getTime() + 5 * 60000) // Retry in 5 minutes

          await supabase.from('scheduled_notifications').insert({
            user_id: notification.user_id,
            reminder_id: notification.reminder_id,
            event_id: notification.event_id,
            send_at: retryTime.toISOString(),
            lead_time_minutes: notification.lead_time_minutes,
            channels: notification.channels,
            retry_count: notification.retry_count + 1,
            status: 'pending'
          })

          console.log(`Scheduled retry for notification ${notification.id} at ${retryTime.toISOString()}`)
        }

        failureCount++
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: notifications?.length || 0,
        successful: successCount,
        failed: failureCount,
        timestamp: now.toISOString()
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Notification processor error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// Helper functions

async function sendEmailNotification(user: any, item: any, leadTime: number) {
  const isReminder = 'priority' in item
  const timePhrase = getTimePhrase(leadTime)

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Notifi <notifications@notifi.app>',
      to: user.email,
      subject: isReminder ? `⏰ Reminder: ${item.title}` : `📅 Upcoming: ${item.title}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${isReminder ? '⏰' : '📅'} ${item.title}</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 18px; color: #374151; margin-top: 0;"><strong>This is ${timePhrase}!</strong></p>
            ${item.description ? `<p style="color: #6b7280; font-size: 16px; line-height: 1.6;">${item.description}</p>` : ''}
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0; color: #374151;"><strong>⏰ Time:</strong> ${formatTimeForUser(item.datetime, user.timezone)}</p>
              ${!isReminder && item.location ? `<p style="margin: 5px 0; color: #374151;"><strong>📍 Location:</strong> ${item.location}</p>` : ''}
              ${!isReminder && item.end_datetime ? `<p style="margin: 5px 0; color: #374151;"><strong>⏱️ Duration:</strong> ${formatTimeForUser(item.datetime, user.timezone)} - ${formatTimeForUser(item.end_datetime, user.timezone)}</p>` : ''}
            </div>
            <a href="${Deno.env.get('NEXT_PUBLIC_APP_URL') || 'https://notifi.app'}/dashboard" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; margin-top: 16px; font-weight: 600;">
              View in Notifi
            </a>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>You're receiving this because you set up a notification in Notifi.</p>
            <p>Notifi - Never miss what matters</p>
          </div>
        </div>
      `
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to send email: ${error}`)
  }

  return response.json()
}

async function sendPushNotification(supabase: any, user: any, item: any, leadTime: number, userId: string) {
  const isReminder = 'priority' in item
  const timePhrase = getTimePhrase(leadTime, true) // Short version

  // Get user's Expo push token from profile
  const { data: profile } = await supabase
    .from('users')
    .select('expo_push_token')
    .eq('id', userId)
    .single()

  if (!profile?.expo_push_token) {
    console.log(`No push token for user ${user.email}, skipping push notification`)
    return null
  }

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      to: profile.expo_push_token,
      title: isReminder ? `⏰ ${item.title}` : `📅 ${item.title}`,
      body: `${timePhrase} • ${item.description || 'Tap to view details'}`,
      data: {
        type: isReminder ? 'reminder' : 'event',
        id: item.id,
        screen: 'Dashboard'
      },
      sound: 'default',
      priority: isReminder && item.priority === 'urgent' ? 'high' : 'normal',
      badge: 1
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to send push notification: ${error}`)
  }

  return response.json()
}

async function sendSMSNotification(user: any, item: any, leadTime: number) {
  if (!user.phone_number) {
    console.log(`No phone number for user ${user.email}, skipping SMS`)
    return null
  }

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.log('Twilio credentials not configured, skipping SMS')
    return null
  }

  const isReminder = 'priority' in item
  const timePhrase = getTimePhrase(leadTime, true)
  const time = formatTimeForUser(item.datetime, user.timezone)

  const message = `🔔 Notifi: ${item.title} ${timePhrase} (${time}). ${item.description || ''} - View: ${Deno.env.get('NEXT_PUBLIC_APP_URL') || 'notifi.app'}`

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: user.phone_number,
        From: TWILIO_PHONE_NUMBER,
        Body: message.substring(0, 160) // SMS character limit
      })
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to send SMS: ${error}`)
  }

  return response.json()
}

function getTimePhrase(leadTimeMinutes: number, short = false): string {
  if (leadTimeMinutes === 0) return short ? 'NOW' : 'now'
  if (leadTimeMinutes < 60) return short ? `in ${leadTimeMinutes}m` : `in ${leadTimeMinutes} minutes`
  if (leadTimeMinutes < 1440) {
    const hours = Math.floor(leadTimeMinutes / 60)
    return short ? `in ${hours}h` : `in ${hours} hour${hours > 1 ? 's' : ''}`
  }
  const days = Math.floor(leadTimeMinutes / 1440)
  return short ? `in ${days}d` : `in ${days} day${days > 1 ? 's' : ''}`
}

function formatTimeForUser(dateTime: string, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone || 'UTC',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(dateTime))
}
