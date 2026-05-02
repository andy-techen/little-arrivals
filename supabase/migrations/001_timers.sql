-- Enable required extensions (do this once in the Supabase dashboard)
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;

-- Push subscriptions: one row per browser/device
create table push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now()
);

-- Scheduled notifications: one row per timer fire
create table scheduled_notifications (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references push_subscriptions(id) on delete cascade,
  send_at         timestamptz not null,
  title           text not null,
  body            text not null,
  data            jsonb,         -- { patientId, timerId } for deep-linking on tap
  claimed_at      timestamptz,   -- set atomically by dispatch function to prevent double-send
  sent_at         timestamptz,
  error           text,
  created_at      timestamptz not null default now()
);

-- Partial index keeps the dispatch query fast as the table grows
create index on scheduled_notifications (send_at)
  where claimed_at is null and sent_at is null;

-- pg_cron job: call the edge function every minute
-- Run this after deploying the dispatch-timers edge function.
-- Replace <PROJECT_REF> and <SERVICE_ROLE_KEY> with your actual values.
--
-- select cron.schedule(
--   'dispatch-timers',
--   '* * * * *',
--   $$
--     select net.http_post(
--       url := 'https://<PROJECT_REF>.supabase.co/functions/v1/dispatch-timers',
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
--       ),
--       body := '{}'::jsonb
--     );
--   $$
-- );
