-- Check RLS policies on chat_messages
SELECT * FROM pg_policies WHERE tablename = 'chat_messages';

-- Check if any messages exist for the current user's connections
-- Replace 'USER_ID_HERE' with the actual user ID you are testing with if running manually
-- For this script, we'll just select some messages to see if we can read them
SELECT 
    id, 
    content, 
    sender_id, 
    connection_id, 
    read_at 
FROM chat_messages 
LIMIT 10;

-- Check exact count of unread messages for a specific scenario to verify the query logic
-- (Simulating the query used in MainNav)
-- We need to know a valid connection_id and sender_id to test this effectively
