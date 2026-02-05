-- ============================================================================
-- FILE AND NOTES SHARING MIGRATION
-- ============================================================================
-- This script adds file and notes sharing functionality to the chat system
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Add new columns to chat_messages table for file and notes support
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'note'));

ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS file_url TEXT;

ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS file_name TEXT;

ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS file_size BIGINT;

ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS file_type TEXT;

ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS note_title TEXT;

ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS note_content TEXT;

-- Add index for message_type for efficient querying
CREATE INDEX IF NOT EXISTS idx_chat_messages_message_type 
ON public.chat_messages(message_type);

-- ============================================================================
-- STORAGE BUCKET SETUP
-- ============================================================================
-- Note: Storage bucket creation must be done via Supabase Dashboard or API
-- The following policies apply to a bucket named 'chat-files'
-- Make sure to create the bucket in Supabase Dashboard with these settings:
-- - Bucket name: chat-files
-- - Public: false
-- - File size limit: 10MB
-- - Allowed MIME types: (optional, configure as needed)
-- ============================================================================

-- Create storage policies for chat files
-- Users can upload files to their own connection folders
INSERT INTO storage.policies (name, bucket_id, definition, check_expression)
VALUES (
  'Users can upload files to their connections',
  'chat-files',
  '(
    EXISTS (
      SELECT 1 FROM public.connections c
      WHERE (c.user_id = auth.uid() OR c.connected_user_id = auth.uid())
      AND c.status = ''accepted''
    )
  )',
  '(
    EXISTS (
      SELECT 1 FROM public.connections c
      WHERE (c.user_id = auth.uid() OR c.connected_user_id = auth.uid())
      AND c.status = ''accepted''
    )
  )'
)
ON CONFLICT (bucket_id, name) DO NOTHING;

-- Users can view files in their connections
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Users can view files in their connections',
  'chat-files',
  '(
    EXISTS (
      SELECT 1 FROM public.connections c
      WHERE (c.user_id = auth.uid() OR c.connected_user_id = auth.uid())
      AND c.status = ''accepted''
    )
  )'
)
ON CONFLICT (bucket_id, name) DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify new columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'chat_messages' 
AND table_schema = 'public'
AND column_name IN ('message_type', 'file_url', 'file_name', 'file_size', 'file_type', 'note_title', 'note_content')
ORDER BY column_name;

-- Verify index was created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'chat_messages'
AND indexname = 'idx_chat_messages_message_type';
