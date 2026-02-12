-- ============================================================================
-- SKILLSWAP SESSION & SCHEDULING SYSTEM SCHEMA
-- ============================================================================

-- 1. Add timezone support to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- 2. Create availabilities table
-- Stores recurring weekly availability for users
CREATE TABLE IF NOT EXISTS public.availabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- 3. Create sessions table
-- Stores scheduled sessions between mentor and learner
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INT DEFAULT 60,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  meeting_link TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT different_users CHECK (mentor_id != learner_id)
);

-- 4. Enable RLS
ALTER TABLE public.availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Availabilities

-- Publicly readable so users can see when others are available
DROP POLICY IF EXISTS "Availabilities are publicly readable" ON public.availabilities;
CREATE POLICY "Availabilities are publicly readable" 
  ON public.availabilities FOR SELECT 
  USING (true);

-- Users can manage their own availability
DROP POLICY IF EXISTS "Users can manage their own availability" ON public.availabilities;
CREATE POLICY "Users can manage their own availability" 
  ON public.availabilities FOR ALL 
  USING (auth.uid() = user_id);

-- 6. RLS Policies for Sessions

-- Users can see sessions they are involved in
DROP POLICY IF EXISTS "Users can view their sessions" ON public.sessions;
CREATE POLICY "Users can view their sessions" 
  ON public.sessions FOR SELECT 
  USING (auth.uid() = mentor_id OR auth.uid() = learner_id);

-- Users can create sessions (usually learners booking mentors)
DROP POLICY IF EXISTS "Users can create sessions" ON public.sessions;
CREATE POLICY "Users can create sessions" 
  ON public.sessions FOR INSERT 
  WITH CHECK (auth.uid() = learner_id OR auth.uid() = mentor_id);

-- Users can update sessions they are involved in (e.g., cancel, add link)
DROP POLICY IF EXISTS "Users can update their sessions" ON public.sessions;
CREATE POLICY "Users can update their sessions" 
  ON public.sessions FOR UPDATE 
  USING (auth.uid() = mentor_id OR auth.uid() = learner_id);

-- 7. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_availabilities_user_id ON public.availabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_mentor_id ON public.sessions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_learner_id ON public.sessions(learner_id);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_at ON public.sessions(scheduled_at);
