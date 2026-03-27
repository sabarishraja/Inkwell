-- ============================================================
-- 002_seal_and_send.sql — Seal & Send feature
--
-- Run this in the Supabase SQL Editor AFTER 001_initial_schema.sql.
-- ============================================================

-- ---- 1. Add delivery columns to letters -----------------------

ALTER TABLE letters
  ADD COLUMN IF NOT EXISTS recipient_email TEXT          NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS deliver_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status          TEXT          NOT NULL DEFAULT 'pending'
                                           CHECK (status IN ('pending', 'delivered')),
  ADD COLUMN IF NOT EXISTS sealed_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW();

-- Index for the pg_cron delivery job (only scans pending rows)
CREATE INDEX IF NOT EXISTS letters_pending_deliver
  ON letters (deliver_at)
  WHERE status = 'pending';

-- ---- 2. Public read policy for delivered letters --------------
-- Recipients access their letter via the unique UUID link.
-- The UUID is effectively a secret — impossible to guess.
-- We allow SELECT on delivered letters without requiring auth.

CREATE POLICY "select_delivered_letters"
  ON letters FOR SELECT
  USING (status = 'delivered');

-- ---- 3. Enable extensions -------------------------------------

-- pg_net: allows PostgreSQL to make HTTP requests (needed for pg_cron → Edge Function)
CREATE EXTENSION IF NOT EXISTS pg_net  WITH SCHEMA extensions;

-- pg_cron: job scheduler inside Postgres
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA cron;

-- ---- 4. Helper function: call the schedule-deliveries edge function --
-- Reads Supabase URL and service role key from database settings.
--
-- Before enabling the cron job you MUST set these settings once:
--
--   ALTER DATABASE postgres
--     SET app.settings.supabase_url    = 'https://<project>.supabase.co';
--   ALTER DATABASE postgres
--     SET app.settings.service_role_key = '<your-service-role-key>';
--
-- Then reload the settings:
--   SELECT pg_reload_conf();
--
-- These are stored per-database and are NOT exposed to client connections.

CREATE OR REPLACE FUNCTION trigger_pending_deliveries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_url TEXT := current_setting('app.settings.supabase_url',    true);
  v_key TEXT := current_setting('app.settings.service_role_key', true);
BEGIN
  IF v_url IS NULL OR v_key IS NULL THEN
    RAISE WARNING 'trigger_pending_deliveries: supabase_url or service_role_key not configured.';
    RETURN;
  END IF;

  PERFORM extensions.http_post(
    url     := v_url || '/functions/v1/schedule-deliveries',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body    := '{}'::jsonb
  );
END;
$$;

-- ---- 5. Schedule hourly delivery job --------------------------

SELECT cron.schedule(
  'deliver-pending-letters',  -- job name (unique)
  '0 * * * *',                -- every hour at :00
  'SELECT trigger_pending_deliveries()'
);
