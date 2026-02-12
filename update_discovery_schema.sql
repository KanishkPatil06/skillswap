-- ============================================================================
-- SEARCH & DISCOVERY UPDATE SCRIPT
-- ============================================================================
-- Run this script in the Supabase SQL Editor to add the necessary tables and 
-- columns for the Search & Discovery features.
-- ============================================================================

-- 1. Add Location Fields to Profiles
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- 2. Create Saved Users Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  saved_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, saved_user_id),
  CHECK (user_id != saved_user_id)
);

-- RLS for Saved Users
ALTER TABLE public.saved_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their saved users" 
  ON public.saved_users FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save profiles" 
  ON public.saved_users FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove saved profiles" 
  ON public.saved_users FOR DELETE 
  USING (auth.uid() = user_id);

-- 3. Create Availability Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS for Availability
ALTER TABLE public.user_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Availability is publicly readable" 
  ON public.user_availability FOR SELECT 
  USING (true);

CREATE POLICY "Users can manage their own availability" 
  ON public.user_availability FOR ALL 
  USING (auth.uid() = user_id);

-- 4. Create Indexes for Performance
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(city, country);
-- Note: PostGIS would be better for lat/long, but simple index helps for now
CREATE INDEX IF NOT EXISTS idx_profiles_lat_long ON public.profiles(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_saved_users_user_id ON public.saved_users(user_id);
CREATE INDEX IF NOT EXISTS idx_user_availability_user_id ON public.user_availability(user_id);
CREATE INDEX IF NOT EXISTS idx_user_availability_day ON public.user_availability(day_of_week);

-- 5. Verification
-- ----------------------------------------------------------------------------
-- SELECT * FROM information_schema.columns WHERE table_name = 'profiles' AND column_name IN ('city', 'latitude');
