-- Add last_seen and online status columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

-- Create index for faster online status queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen);
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON profiles(is_online);

-- Function to update last_seen timestamp
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen = NOW();
  -- Consider user online if they were active in the last 5 minutes
  NEW.is_online = (NOW() - NEW.last_seen) < INTERVAL '5 minutes';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to mark user as online
CREATE OR REPLACE FUNCTION mark_user_online(user_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET last_seen = NOW(),
      is_online = true
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to check and update online status for all users
CREATE OR REPLACE FUNCTION update_online_statuses()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET is_online = (NOW() - last_seen) < INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Comment: This script adds online status tracking to the profiles table
-- Users are considered online if their last_seen was within the last 5 minutes
