-- ============================================================================
-- USER RATING AND RANKING SYSTEM
-- ============================================================================
-- This script implements a gamified rating system where users earn points
-- and levels based on their activity and helpfulness.
-- ============================================================================

-- Step 1: Add rating columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rating_score INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level_name TEXT DEFAULT 'Newcomer';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_helps_given INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_helps_received INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0;

-- Create index for faster sorting by rating
CREATE INDEX IF NOT EXISTS idx_profiles_rating ON profiles(rating_score DESC);

-- Step 2: Create user_activities table to track point-earning actions
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  points_earned INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activities_user ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created ON user_activities(created_at DESC);

-- Step 3: Create function to automatically update user level based on rating
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
DECLARE
  new_level INTEGER;
  new_level_name TEXT;
BEGIN
  -- Calculate level based on rating_score
  IF NEW.rating_score >= 4000 THEN
    new_level := 7;
    new_level_name := 'Legend';
  ELSIF NEW.rating_score >= 2000 THEN
    new_level := 6;
    new_level_name := 'Master';
  ELSIF NEW.rating_score >= 1000 THEN
    new_level := 5;
    new_level_name := 'Expert';
  ELSIF NEW.rating_score >= 500 THEN
    new_level := 4;
    new_level_name := 'Helper';
  ELSIF NEW.rating_score >= 250 THEN
    new_level := 3;
    new_level_name := 'Contributor';
  ELSIF NEW.rating_score >= 100 THEN
    new_level := 2;
    new_level_name := 'Explorer';
  ELSE
    new_level := 1;
    new_level_name := 'Newcomer';
  END IF;
  
  NEW.level := new_level;
  NEW.level_name := new_level_name;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger to update level when rating changes
DROP TRIGGER IF EXISTS trigger_update_user_level ON profiles;
CREATE TRIGGER trigger_update_user_level
  BEFORE UPDATE OF rating_score ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_level();

-- Step 5: Create function to award points
CREATE OR REPLACE FUNCTION award_points(
  p_user_id UUID,
  p_activity_type TEXT,
  p_points INTEGER,
  p_description TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Insert activity record
  INSERT INTO user_activities (user_id, activity_type, points_earned, description)
  VALUES (p_user_id, p_activity_type, p_points, p_description);
  
  -- Update user's rating score (this will trigger level update)
  UPDATE profiles
  SET rating_score = GREATEST(0, rating_score + p_points)
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Calculate profile completeness for existing users
CREATE OR REPLACE FUNCTION calculate_profile_completeness()
RETURNS TRIGGER AS $$
DECLARE
  completeness INTEGER;
BEGIN
  -- Calculate completeness percentage (0-100)
  completeness := 0;
  
  IF NEW.full_name IS NOT NULL AND NEW.full_name != '' THEN
    completeness := completeness + 25;
  END IF;
  
  IF NEW.bio IS NOT NULL AND NEW.bio != '' THEN
    completeness := completeness + 25;
  END IF;
  
  IF NEW.linkedin_url IS NOT NULL AND NEW.linkedin_url != '' THEN
    completeness := completeness + 25;
  END IF;
  
  IF NEW.avatar_url IS NOT NULL AND NEW.avatar_url != '' THEN
    completeness := completeness + 25;
  END IF;
  
  NEW.profile_completeness := completeness;
  
  -- Award points for completing profile (one-time bonus)
  IF completeness = 100 AND (OLD.profile_completeness IS NULL OR OLD.profile_completeness < 100) THEN
    PERFORM award_points(NEW.id, 'profile_complete', 50, 'Completed profile');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger for profile completeness
DROP TRIGGER IF EXISTS trigger_calculate_profile_completeness ON profiles;
CREATE TRIGGER trigger_calculate_profile_completeness
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION calculate_profile_completeness();

-- Step 8: Initialize existing users
-- Set profile completeness for all existing users
UPDATE profiles
SET profile_completeness = (
  CASE WHEN full_name IS NOT NULL AND full_name != '' THEN 25 ELSE 0 END +
  CASE WHEN bio IS NOT NULL AND bio != '' THEN 25 ELSE 0 END +
  CASE WHEN linkedin_url IS NOT NULL AND linkedin_url != '' THEN 25 ELSE 0 END +
  CASE WHEN avatar_url IS NOT NULL AND avatar_url != '' THEN 25 ELSE 0 END
);

-- Give all existing users a base 20 points to start
INSERT INTO user_activities (user_id, activity_type, points_earned, description)
SELECT 
  id,
  'initial_bonus',
  20,
  'Welcome bonus'
FROM profiles
WHERE rating_score = 0;

UPDATE profiles
SET rating_score = 20
WHERE rating_score = 0;

-- Step 9: Update RLS policies for user_activities table
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Users can view their own activities
CREATE POLICY "Users can view own activities"
  ON user_activities FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view others' activities (for leaderboard transparency)
CREATE POLICY "Users can view all activities"
  ON user_activities FOR SELECT
  USING (true);

-- Only system (via RPC) can insert activities
CREATE POLICY "Only RPC can insert activities"
  ON user_activities FOR INSERT
  WITH CHECK (false);

-- Step 10: Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION award_points TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_level TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_profile_completeness TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check top rated users
-- SELECT full_name, level_name, level, rating_score, profile_completeness
-- FROM profiles
-- ORDER BY rating_score DESC
-- LIMIT 10;

-- Check recent activities
-- SELECT ua.*, p.full_name
-- FROM user_activities ua
-- JOIN profiles p ON ua.user_id = p.id
-- ORDER BY ua.created_at DESC
-- LIMIT 20;

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- Rating system is now active!
-- Users will earn points for:
-- - Completing profile: 50 points
-- - Adding skills: 10 points each (implement in app)
-- - Accepting connections: 5 points each (implement in app)
-- - Helping others: 50 points (implement in app)
-- ============================================================================
