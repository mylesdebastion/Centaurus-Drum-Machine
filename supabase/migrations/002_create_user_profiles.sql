-- Story 18.0: User Profiles Table and RLS Policies
-- Epic 18 - Intelligent WLED Visualization Routing
-- Created: 2025-10-18
-- Purpose: Enable persistent user identity for WLED device registry and feature gating

-- ============================================================================
-- USER PROFILES TABLE
-- ============================================================================

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT username_min_length CHECK (char_length(username) >= 1),
  CONSTRAINT username_max_length CHECK (char_length(username) <= 50)
);

-- Add index for username lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can insert own profile (allows manual profile creation)
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- AUTO-CREATE PROFILE ON SIGN UP
-- ============================================================================

-- Function: Auto-create profile when new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new profile with email as default username
  -- User can change this later via profile update
  INSERT INTO public.user_profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',  -- Use username from metadata if provided
      SPLIT_PART(NEW.email, '@', 1)         -- Otherwise use email prefix
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Execute handle_new_user after user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Function: Check if current user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN AS $$
  SELECT auth.uid() IS NOT NULL;
$$ LANGUAGE SQL STABLE;

-- Function: Get current user's profile
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS user_profiles AS $$
  SELECT * FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at on profile changes
DROP TRIGGER IF EXISTS on_user_profile_updated ON user_profiles;
CREATE TRIGGER on_user_profile_updated
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ============================================================================
-- COMMENTS (DOCUMENTATION)
-- ============================================================================

COMMENT ON TABLE user_profiles IS 'User profile data for authenticated users. Stores username and metadata.';
COMMENT ON COLUMN user_profiles.id IS 'Foreign key to auth.users.id';
COMMENT ON COLUMN user_profiles.username IS 'Display name shown in jam sessions and UI (1-50 characters)';
COMMENT ON COLUMN user_profiles.created_at IS 'Profile creation timestamp (auto-set)';
COMMENT ON COLUMN user_profiles.updated_at IS 'Last profile update timestamp (auto-updated)';

COMMENT ON FUNCTION public.handle_new_user() IS 'Auto-creates user profile when new auth user is created';
COMMENT ON FUNCTION public.is_authenticated() IS 'Returns true if user is authenticated (has valid session)';
COMMENT ON FUNCTION public.get_my_profile() IS 'Returns current user''s profile (null if not authenticated)';
