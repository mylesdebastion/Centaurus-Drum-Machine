-- Migration 003: Create WLED Devices Table
-- Story 18.1: WLED Device Registry
-- Purpose: Store WLED device configurations per user with real-time sync

-- Drop table if exists (for development/testing)
DROP TABLE IF EXISTS public.wled_devices CASCADE;

-- Create wled_devices table
CREATE TABLE public.wled_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Device identification
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  ip TEXT NOT NULL CHECK (ip ~ '^([0-9]{1,3}\.){3}[0-9]{1,3}$'),
  location TEXT,

  -- Device capabilities (JSONB for flexibility)
  capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Expected structure:
  -- {
  --   "dimensions": "1D" | "2D",
  --   "ledCount": number,
  --   "gridConfig": { "width": number, "height": number, "serpentine": boolean, "orientation": "horizontal" | "vertical" } (optional),
  --   "supportedVisualizations": string[]
  -- }

  -- Device settings
  priority INTEGER DEFAULT 50 CHECK (priority >= 0 AND priority <= 100),
  brightness INTEGER DEFAULT 204 CHECK (brightness >= 0 AND brightness <= 255),
  reverse_direction BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE(user_id, name), -- Device names must be unique per user
  UNIQUE(user_id, ip)    -- IP addresses must be unique per user
);

-- Create indexes for performance
CREATE INDEX idx_wled_devices_user_id ON public.wled_devices(user_id);
CREATE INDEX idx_wled_devices_enabled ON public.wled_devices(enabled) WHERE enabled = true;
CREATE INDEX idx_wled_devices_created_at ON public.wled_devices(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.wled_devices ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy 1: Users can view their own devices
CREATE POLICY "Users can view their own WLED devices"
  ON public.wled_devices
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own devices
CREATE POLICY "Users can insert their own WLED devices"
  ON public.wled_devices
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own devices
CREATE POLICY "Users can update their own WLED devices"
  ON public.wled_devices
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own devices
CREATE POLICY "Users can delete their own WLED devices"
  ON public.wled_devices
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function: Update updated_at timestamp on row modification
CREATE OR REPLACE FUNCTION public.update_wled_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Automatically update updated_at
CREATE TRIGGER update_wled_devices_updated_at_trigger
  BEFORE UPDATE ON public.wled_devices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_wled_devices_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wled_devices TO authenticated;
GRANT USAGE ON SEQUENCE wled_devices_id_seq TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.wled_devices IS 'User-owned WLED device configurations for intelligent visualization routing';
COMMENT ON COLUMN public.wled_devices.capabilities IS 'JSONB containing device dimensions, LED count, grid config, and supported visualizations';
COMMENT ON COLUMN public.wled_devices.priority IS 'Device priority (0-100, higher = preferred for routing)';
COMMENT ON COLUMN public.wled_devices.brightness IS 'Global brightness setting (0-255)';
COMMENT ON COLUMN public.wled_devices.reverse_direction IS 'Reverse LED strip direction (useful for physical wiring)';
COMMENT ON COLUMN public.wled_devices.last_seen_at IS 'Last successful connection timestamp (updated by test connection)';
