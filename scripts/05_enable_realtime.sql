-- Enable Realtime for Chat Messages
-- This script adds the chat_messages table to the supabase_realtime publication
-- to enable real-time message delivery

-- Add chat_messages table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Verify the change
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
