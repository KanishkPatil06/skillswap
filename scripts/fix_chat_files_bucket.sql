-- Create 'chat-files' bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

-- STORAGE POLICIES (Re-applying to ensure they exist)

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload files to their connections" ON storage.objects;
DROP POLICY IF EXISTS "Users can view files in their connections" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Policy 1: Allow users to upload files to connections
CREATE POLICY "Users can upload files to their connections"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-files' AND
  (
    -- Extract connection ID from path (format: connectionId/filename)
    -- We cast to uuid to ensure safety if possible, or just string compare
    EXISTS (
      SELECT 1 FROM public.connections c
      WHERE c.id::text = split_part(name, '/', 1)
      AND (c.user_id = auth.uid() OR c.connected_user_id = auth.uid())
      AND c.status = 'accepted'
    )
  )
);

-- Policy 2: Allow users to view/download files from their connections
CREATE POLICY "Users can view files in their connections"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-files' AND
  (
    EXISTS (
      SELECT 1 FROM public.connections c
      WHERE c.id::text = split_part(name, '/', 1)
      AND (c.user_id = auth.uid() OR c.connected_user_id = auth.uid())
      AND c.status = 'accepted'
    )
  )
);

-- Allow public access if needed for simple download URLs (Optional, but 'public' bucket usually implies public read)
-- But we want to restrict read.
-- If bucket is public, anyone can read if they guess the URL.
-- Prior policies restrict SELECT.
-- If the bucket is public, RLS might be bypassed for reading?
-- Supabase 'public' buckets allow unauthenticated access IF RLS allows it or if no RLS.
-- Safest is RLS.

