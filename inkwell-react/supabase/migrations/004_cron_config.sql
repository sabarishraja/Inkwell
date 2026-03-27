-- ============================================================
-- 004_cron_config.sql — Fix pg_cron configuration
--
-- Supabase restricts ALTER DATABASE SET in the SQL Editor.
-- This migration stores the cron config in a regular table
-- and rewires trigger_pending_deliveries() to read from it.
--
-- Run this AFTER 002_seal_and_send.sql.
-- ============================================================

-- ---- 1. Config table (replaces ALTER DATABASE SET) ---------

CREATE TABLE IF NOT EXISTS inkwell_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Restrict reads to service role only
ALTER TABLE inkwell_config ENABLE ROW LEVEL SECURITY;

-- No client-facing RLS policies — only service role (edge functions) can read.

-- ---- 2. Insert your project values -------------------------
-- Replace the placeholders below with your actual values,
-- then run this block once.
--
-- Find them in: Supabase Dashboard → Project Settings → API

INSERT INTO inkwell_config (key, value) VALUES
  ('supabase_url',      'https://YOUR_PROJECT_REF.supabase.co'),
  ('service_role_key',  'YOUR_SERVICE_ROLE_KEY_HERE')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ---- 3. Rewrite trigger_pending_deliveries() ---------------

CREATE OR REPLACE FUNCTION trigger_pending_deliveries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_url TEXT;
  v_key TEXT;
BEGIN
  SELECT value INTO v_url FROM inkwell_config WHERE key = 'supabase_url';
  SELECT value INTO v_key FROM inkwell_config WHERE key = 'service_role_key';

  IF v_url IS NULL OR v_key IS NULL THEN
    RAISE WARNING 'trigger_pending_deliveries: config values missing in inkwell_config.';
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
