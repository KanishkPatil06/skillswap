-- Add missing columns to profiles table for Discovery features
-- Run this script in your Supabase SQL Editor

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS rating_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS level_name TEXT DEFAULT 'Newcomer',
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

-- Create index for rating_score sorting
CREATE INDEX IF NOT EXISTS idx_profiles_rating_score ON public.profiles(rating_score DESC);

-- Update existing profiles with default values if needed
UPDATE public.profiles SET 
  rating_score = 0,
  level = 1,
  level_name = 'Newcomer',
  is_online = false
WHERE rating_score IS NULL;
