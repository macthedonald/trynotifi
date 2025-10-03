-- Setup Cron Job for Notification Processing
-- Run this SQL script in your Supabase SQL Editor to schedule the notification processor

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the notification processor to run every minute
-- This will check for pending notifications and send them via email/push/SMS

SELECT cron.schedule(
  'process-notifications', -- Job name
  '* * * * *',            -- Every minute (cron format: minute hour day month weekday)
  $$
    SELECT net.http_post(
      url := 'https://your-project-ref.supabase.co/functions/v1/process-notifications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ) AS request_id;
  $$
);

-- To check if the cron job was created successfully:
-- SELECT * FROM cron.job;

-- To see cron job execution history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- To unschedule the cron job (if needed):
-- SELECT cron.unschedule('process-notifications');

-- To manually trigger the notification processor (for testing):
-- SELECT net.http_post(
--   url := 'https://your-project-ref.supabase.co/functions/v1/process-notifications',
--   headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
-- ) AS request_id;

-- IMPORTANT SETUP INSTRUCTIONS:
-- 1. Replace 'your-project-ref' with your actual Supabase project reference
-- 2. Replace 'YOUR_ANON_KEY' with your actual Supabase anon key
-- 3. Ensure the process-notifications Edge Function is deployed
-- 4. Ensure all environment variables are set in Supabase Edge Functions:
--    - SUPABASE_URL
--    - SUPABASE_SERVICE_ROLE_KEY
--    - RESEND_API_KEY
--    - TWILIO_ACCOUNT_SID (optional, for SMS)
--    - TWILIO_AUTH_TOKEN (optional, for SMS)
--    - TWILIO_PHONE_NUMBER (optional, for SMS)
--    - NEXT_PUBLIC_APP_URL

-- MONITORING:
-- You can monitor the cron job execution with:
SELECT
  j.jobid,
  j.jobname,
  jrd.runid,
  jrd.job_pid,
  jrd.status,
  jrd.return_message,
  jrd.start_time,
  jrd.end_time
FROM cron.job_run_details jrd
JOIN cron.job j ON jrd.jobid = j.jobid
WHERE j.jobname = 'process-notifications'
ORDER BY jrd.start_time DESC
LIMIT 20;
