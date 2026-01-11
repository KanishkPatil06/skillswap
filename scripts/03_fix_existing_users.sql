-- Fix existing users by creating profiles for them
-- This script creates profiles for users who signed up before the trigger was created

-- Insert profiles for all users in auth.users who don't have a profile yet
INSERT INTO public.profiles (id, full_name, created_at, updated_at)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
  created_at,
  NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Verify the profiles were created
SELECT 
  u.email,
  p.id,
  p.full_name,
  p.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
