-- Fix Realtime for Chat Messages
-- This script ensures the chat_messages table is properly configured for Supabase Realtime
-- IMPORTANT: Run this in your Supabase SQL Editor (https://supabase.com/dashboard)

-- Step 1: Set REPLICA IDENTITY to FULL
-- This is REQUIRED for realtime subscriptions with filters to work properly
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

-- Step 2: Ensure the table is added to the realtime publication
-- This might error if already added, which is fine
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Table chat_messages already in publication';
END $$;

-- Step 3: Verify the configuration
SELECT 
    'chat_messages' as table_name,
    CASE 
        WHEN relreplident = 'f' THEN 'FULL ✓'
        WHEN relreplident = 'd' THEN 'DEFAULT (needs to be FULL!)'
        WHEN relreplident = 'n' THEN 'NOTHING (needs to be FULL!)'
        ELSE relreplident::text
    END as replica_identity
FROM pg_class 
WHERE relname = 'chat_messages';

-- Step 4: Verify it's in the realtime publication
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages';

-- If the above returns a row with 'FULL ✓' and shows chat_messages in the publication,
-- realtime is properly configured!
