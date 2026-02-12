-- Ensure profiles are publicly readable
-- This fixes the issue where "No profiles found" is shown even when profiles exist

-- Enable RLS (idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;

-- Create the policy
CREATE POLICY "Profiles are publicly readable" 
  ON public.profiles FOR SELECT 
  USING (true);

-- Also ensure user_skills are readable
DROP POLICY IF EXISTS "User skills are publicly readable" ON public.user_skills;
CREATE POLICY "User skills are publicly readable" 
  ON public.user_skills FOR SELECT 
  USING (true);
