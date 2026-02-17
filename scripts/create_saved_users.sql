-- Create saved_users table for bookmarking/favoriting profiles
CREATE TABLE IF NOT EXISTS public.saved_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  saved_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, saved_user_id),
  CHECK (user_id != saved_user_id)
);

-- Index for quick lookups
CREATE INDEX idx_saved_users_user_id ON public.saved_users(user_id);
CREATE INDEX idx_saved_users_saved_user_id ON public.saved_users(saved_user_id);

-- Enable RLS
ALTER TABLE public.saved_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can see their own saved list
CREATE POLICY "Users can view their saved users"
  ON public.saved_users FOR SELECT
  USING (auth.uid() = user_id);

-- Anyone can see if they've been saved (needed for the join in discover query)
CREATE POLICY "Users can see if they are saved"
  ON public.saved_users FOR SELECT
  USING (auth.uid() = saved_user_id);

-- Users can save others
CREATE POLICY "Users can save other users"
  ON public.saved_users FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unsave (delete their own saves)
CREATE POLICY "Users can unsave users"
  ON public.saved_users FOR DELETE
  USING (auth.uid() = user_id);
