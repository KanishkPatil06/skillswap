-- Create users table (extends Supabase auth users)
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

-- Create chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_skills_user_id ON public.user_skills(user_id);
CREATE INDEX idx_user_skills_skill_id ON public.user_skills(skill_id);
CREATE INDEX idx_connections_user_id ON public.connections(user_id);
CREATE INDEX idx_connections_status ON public.connections(status);
CREATE INDEX idx_help_requests_user_id ON public.help_requests(user_id);
CREATE INDEX idx_help_requests_skill_id ON public.help_requests(skill_id);
CREATE INDEX idx_chat_messages_connection_id ON public.chat_messages(connection_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles: Users can read all profiles but only update their own
CREATE POLICY "Profiles are publicly readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User Skills: Users can read all but only update their own
CREATE POLICY "User skills are publicly readable" ON public.user_skills FOR SELECT USING (true);
CREATE POLICY "Users can manage their own skills" ON public.user_skills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own skills" ON public.user_skills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own skills" ON public.user_skills FOR DELETE USING (auth.uid() = user_id);

-- Connections: Users can read and manage only their own connections
CREATE POLICY "Users can see their connections" ON public.connections FOR SELECT USING (auth.uid() = user_id OR auth.uid() = connected_user_id);
CREATE POLICY "Users can create connections" ON public.connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their connections" ON public.connections FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = connected_user_id);
CREATE POLICY "Users can delete their connections" ON public.connections FOR DELETE USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

-- Help Requests: Users can read all but only manage their own
CREATE POLICY "Help requests are publicly readable" ON public.help_requests FOR SELECT USING (true);
CREATE POLICY "Users can create help requests" ON public.help_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own requests" ON public.help_requests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own requests" ON public.help_requests FOR DELETE USING (auth.uid() = user_id);

-- Chat Messages: Users can read messages from their connections
CREATE POLICY "Users can read connected messages" ON public.chat_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.connections c
    WHERE c.id = chat_messages.connection_id
    AND (c.user_id = auth.uid() OR c.connected_user_id = auth.uid())
    AND c.status = 'accepted'
  )
);
CREATE POLICY "Users can send messages to connections" ON public.chat_messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.connections c
    WHERE c.id = chat_messages.connection_id
    AND (c.user_id = auth.uid() OR c.connected_user_id = auth.uid())
    AND c.status = 'accepted'
  )
  AND auth.uid() = sender_id
);

-- Insert initial skills
INSERT INTO public.skills (name, category) VALUES
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
