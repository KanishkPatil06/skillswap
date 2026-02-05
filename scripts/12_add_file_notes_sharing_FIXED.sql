-- ============================================================================
-- FILE AND NOTES SHARING MIGRATION (CORRECTED)
-- ============================================================================
-- This script adds file and notes sharing functionality to chat_messages table
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
