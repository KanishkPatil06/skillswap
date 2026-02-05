-- ============================================================================
-- STORAGE POLICIES FOR FILE SHARING
-- ============================================================================
-- Run this in Supabase SQL Editor AFTER creating the chat-files bucket
-- ============================================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload files to their connections" ON storage.objects;
DROP POLICY IF EXISTS "Users can view files in their connections" ON storage.objects;

-- Policy 1: Allow users to upload files to connections
-- Files are stored as: connectionId/timestamp.ext
-- We extract the connection ID from the path and verify user is part of that connection
CREATE POLICY "Users can upload files to their connections"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-files' AND
  (
    -- Extract connection ID from path (format: connectionId/filename)
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
    -- Extract connection ID from path (format: connectionId/filename)
    EXISTS (
      SELECT 1 FROM public.connections c
      WHERE c.id::text = split_part(name, '/', 1)
      AND (c.user_id = auth.uid() OR c.connected_user_id = auth.uid())
      AND c.status = 'accepted'
    )
  )
);

-- Verification: Check if policies were created successfully
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND (policyname LIKE '%upload%' OR policyname LIKE '%view%')
ORDER BY policyname;
