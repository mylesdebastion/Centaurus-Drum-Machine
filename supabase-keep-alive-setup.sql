-- Supabase Keep-Alive Table Setup
-- Run this SQL in Supabase SQL Editor to create the keep-alive table

-- Create _keep_alive table
CREATE TABLE IF NOT EXISTS _keep_alive (
  id INTEGER PRIMARY KEY,
  last_ping TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial row
INSERT INTO _keep_alive (id, last_ping, created_at) 
VALUES (1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Add comment
COMMENT ON TABLE _keep_alive IS 'Keeps Supabase free tier project active by daily cron reads/writes';

-- Grant access to service role (for cron job)
GRANT SELECT, INSERT, UPDATE ON _keep_alive TO service_role;

-- Grant access to anon role (optional - for manual testing)
GRANT SELECT ON _keep_alive TO anon;
