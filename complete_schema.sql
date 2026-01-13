-- ============================================================================
-- SKILLSWAP DATABASE SCHEMA - COMPLETE PRODUCTION SCHEMA
-- ============================================================================
-- This is the complete database schema for the SkillSwap application.
-- Run this entire script in your Supabase SQL Editor to create all tables,
-- indexes, RLS policies, triggers, and seed data.
--
-- IMPORTANT: This script is idempotent - it can be run multiple times safely.
-- ============================================================================

-- ============================================================================
-- SECTION 1: TABLES
-- ============================================================================

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  linkedin_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create skills table
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('Technical', 'Non-Technical')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create user_skills junction table with levels
CREATE TABLE IF NOT EXISTS public.user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  level TEXT DEFAULT 'Beginner' CHECK (level IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
  times_helped INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- Create connections table
CREATE TABLE IF NOT EXISTS public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  connected_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CHECK (user_id != connected_user_id),
  UNIQUE(user_id, connected_user_id)
);

-- Create help requests table
CREATE TABLE IF NOT EXISTS public.help_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'closed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create chat_messages table with read tracking
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- SECTION 2: INDEXES FOR PERFORMANCE
-- ============================================================================

-- User Skills Indexes
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON public.user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_id ON public.user_skills(skill_id);

-- Connections Indexes
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON public.connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON public.connections(status);

-- Help Requests Indexes
CREATE INDEX IF NOT EXISTS idx_help_requests_user_id ON public.help_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_skill_id ON public.help_requests(skill_id);

-- Chat Messages Indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_connection_id ON public.chat_messages(connection_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_read_at ON public.chat_messages(connection_id, read_at) WHERE read_at IS NULL;

-- ============================================================================
-- SECTION 3: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 4: RLS POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Profiles Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;
CREATE POLICY "Profiles are publicly readable" 
  ON public.profiles FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- User Skills Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "User skills are publicly readable" ON public.user_skills;
CREATE POLICY "User skills are publicly readable" 
  ON public.user_skills FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can manage their own skills" ON public.user_skills;
CREATE POLICY "Users can manage their own skills" 
  ON public.user_skills FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own skills" ON public.user_skills;
CREATE POLICY "Users can update their own skills" 
  ON public.user_skills FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own skills" ON public.user_skills;
CREATE POLICY "Users can delete their own skills" 
  ON public.user_skills FOR DELETE 
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Connections Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can see their connections" ON public.connections;
CREATE POLICY "Users can see their connections" 
  ON public.connections FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

DROP POLICY IF EXISTS "Users can create connections" ON public.connections;
CREATE POLICY "Users can create connections" 
  ON public.connections FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their connections" ON public.connections;
CREATE POLICY "Users can update their connections" 
  ON public.connections FOR UPDATE 
  USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

DROP POLICY IF EXISTS "Users can delete their connections" ON public.connections;
CREATE POLICY "Users can delete their connections" 
  ON public.connections FOR DELETE 
  USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

-- ----------------------------------------------------------------------------
-- Help Requests Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Help requests are publicly readable" ON public.help_requests;
CREATE POLICY "Help requests are publicly readable" 
  ON public.help_requests FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can create help requests" ON public.help_requests;
CREATE POLICY "Users can create help requests" 
  ON public.help_requests FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own requests" ON public.help_requests;
CREATE POLICY "Users can update their own requests" 
  ON public.help_requests FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own requests" ON public.help_requests;
CREATE POLICY "Users can delete their own requests" 
  ON public.help_requests FOR DELETE 
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Chat Messages Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view messages in their connections" ON public.chat_messages;
CREATE POLICY "Users can view messages in their connections"
  ON public.chat_messages FOR SELECT
  USING (
    auth.uid() = sender_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.connections c
      WHERE c.id = chat_messages.connection_id
      AND (c.user_id = auth.uid() OR c.connected_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert messages in their connections" ON public.chat_messages;
CREATE POLICY "Users can insert messages in their connections"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id 
    AND 
    EXISTS (
      SELECT 1 FROM public.connections c
      WHERE c.id = connection_id
      AND (c.user_id = auth.uid() OR c.connected_user_id = auth.uid())
      AND c.status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "Users can update messages in their connections" ON public.chat_messages;
CREATE POLICY "Users can update messages in their connections"
  ON public.chat_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.connections c
      WHERE c.id = chat_messages.connection_id
      AND (c.user_id = auth.uid() OR c.connected_user_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.connections c
      WHERE c.id = chat_messages.connection_id
      AND (c.user_id = auth.uid() OR c.connected_user_id = auth.uid())
    )
  );

-- ============================================================================
-- SECTION 5: TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- SECTION 6: REALTIME CONFIGURATION
-- ============================================================================

-- Enable realtime for chat messages
DO $$
BEGIN
  -- Check if the table is already in the publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
END $$;

-- ============================================================================
-- SECTION 7: SEED DATA - INITIAL SKILLS
-- ============================================================================

INSERT INTO public.skills (name, category) VALUES
-- Technical Skills
('Web Development', 'Technical'),
('Frontend Development', 'Technical'),
('Backend Development', 'Technical'),
('Full Stack Development', 'Technical'),
('React', 'Technical'),
('Next.js', 'Technical'),
('TypeScript', 'Technical'),
('JavaScript', 'Technical'),
('Python', 'Technical'),
('Node.js', 'Technical'),
('Database Design', 'Technical'),
('DevOps', 'Technical'),
('Cloud Computing', 'Technical'),
('AWS', 'Technical'),
('Docker', 'Technical'),
('Kubernetes', 'Technical'),
('AI/ML', 'Technical'),
('Machine Learning', 'Technical'),
('Deep Learning', 'Technical'),
('Data Science', 'Technical'),
('Mobile Development', 'Technical'),
('iOS Development', 'Technical'),
('Android Development', 'Technical'),
('Game Development', 'Technical'),
-- Non-Technical Skills
('Graphic Design', 'Non-Technical'),
('UI/UX Design', 'Non-Technical'),
('Video Editing', 'Non-Technical'),
('Content Writing', 'Non-Technical'),
('Social Media Marketing', 'Non-Technical'),
('SEO', 'Non-Technical'),
('Digital Marketing', 'Non-Technical'),
('Business Strategy', 'Non-Technical'),
('Project Management', 'Non-Technical'),
('Communication', 'Non-Technical'),
('Leadership', 'Non-Technical'),
('Freelancing', 'Non-Technical'),
('Sales', 'Non-Technical'),
('Customer Service', 'Non-Technical')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SCHEMA VERIFICATION QUERIES
-- ============================================================================
-- Uncomment these to verify your schema after running the script

-- Verify all tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;

-- Verify all indexes
-- SELECT indexname, tablename FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, indexname;

-- Verify RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public';

-- Verify all policies
-- SELECT tablename, policyname, cmd FROM pg_policies 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, policyname;

-- Verify realtime publication
-- SELECT schemaname, tablename FROM pg_publication_tables 
-- WHERE pubname = 'supabase_realtime';

-- Count skills
-- SELECT COUNT(*) as total_skills FROM public.skills;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
