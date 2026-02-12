-- Fix RLS policies to ensure users can be seen
-- Run this in your Supabase SQL Editor

-- 1. Make PROFILES publicly readable
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;
CREATE POLICY "Profiles are publicly readable" 
  ON public.profiles FOR SELECT 
  USING (true);

-- 2. Make SESSIONS readable by participants
-- (This should already be there, but re-applying to be safe)
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their sessions" ON public.sessions;
CREATE POLICY "Users can view their sessions" 
  ON public.sessions FOR SELECT 
  USING (auth.uid() = mentor_id OR auth.uid() = learner_id);

-- 3. Make AVAILABILITIES publicly readable
ALTER TABLE public.availabilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Availabilities are publicly readable" ON public.availabilities;
CREATE POLICY "Availabilities are publicly readable" 
  ON public.availabilities FOR SELECT 
  USING (true);
