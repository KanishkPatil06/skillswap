-- FORCE FIX SESSIONS
-- Run this in Supabase SQL Editor

-- 1. Ensure Foreign Key Names Match Frontend Code
-- We try to drop them by potential names and re-create them with explicit names needed by the API
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_mentor_id_fkey;
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_learner_id_fkey;
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_skill_id_fkey;

-- Re-add with specific names used in the Supabase query:
-- mentor:profiles!sessions_mentor_id_fkey
-- learner:profiles!sessions_learner_id_fkey
ALTER TABLE public.sessions
ADD CONSTRAINT sessions_mentor_id_fkey
FOREIGN KEY (mentor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.sessions
ADD CONSTRAINT sessions_learner_id_fkey
FOREIGN KEY (learner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.sessions
ADD CONSTRAINT sessions_skill_id_fkey
FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE;


-- 2. RESET RLS POLICIES (Make everything readable for now to debug)

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;
CREATE POLICY "Profiles are publicly readable" ON public.profiles FOR SELECT USING (true);

-- Skills
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Skills are publicly readable" ON public.skills;
CREATE POLICY "Skills are publicly readable" ON public.skills FOR SELECT USING (true);

-- Sessions
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their sessions" ON public.sessions;
CREATE POLICY "Users can view their sessions" 
  ON public.sessions FOR SELECT 
  USING (auth.uid() = mentor_id OR auth.uid() = learner_id);

DROP POLICY IF EXISTS "Users can create sessions" ON public.sessions;
CREATE POLICY "Users can create sessions" 
  ON public.sessions FOR INSERT 
  WITH CHECK (auth.uid() = learner_id OR auth.uid() = mentor_id);
  
DROP POLICY IF EXISTS "Users can update their sessions" ON public.sessions;
CREATE POLICY "Users can update their sessions" 
  ON public.sessions FOR UPDATE 
  USING (auth.uid() = mentor_id OR auth.uid() = learner_id);
