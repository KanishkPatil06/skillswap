-- Fix Duplicate Connections Between Users
-- IMPORTANT: Run this in your Supabase SQL Editor
-- This script helps identify and fix duplicate connections between users

-- Step 1: Find duplicate connections (where the same pair of users have multiple connections)
SELECT 
    LEAST(user_id, connected_user_id) as user_a,
    GREATEST(user_id, connected_user_id) as user_b,
    COUNT(*) as connection_count,
    array_agg(id) as connection_ids,
    array_agg(status) as statuses
FROM connections
GROUP BY LEAST(user_id, connected_user_id), GREATEST(user_id, connected_user_id)
HAVING COUNT(*) > 1;

-- Step 2: View all connections with user details
SELECT 
    c.id as connection_id,
    c.status,
    c.user_id,
    c.connected_user_id,
    p1.full_name as requester_name,
    p1.email as requester_email,
    p2.full_name as target_name,
    p2.email as target_email,
    c.created_at
FROM connections c
LEFT JOIN profiles p1 ON c.user_id = p1.id
LEFT JOIN profiles p2 ON c.connected_user_id = p2.id
ORDER BY c.created_at DESC;

-- Step 3: Merge messages from duplicate connections
-- FIRST: Identify which connection to keep (the one with messages, or the older one)
-- Replace 'CONNECTION_ID_TO_KEEP' and 'CONNECTION_ID_TO_DELETE' with actual IDs

-- Example: Move all messages from duplicate connection to the primary one
-- UPDATE chat_messages 
-- SET connection_id = 'CONNECTION_ID_TO_KEEP'
-- WHERE connection_id = 'CONNECTION_ID_TO_DELETE';

-- Then delete the duplicate connection
-- DELETE FROM connections WHERE id = 'CONNECTION_ID_TO_DELETE';

-- Step 4: Add a unique constraint to prevent future duplicates
-- This creates a constraint where only one connection can exist between any two users
-- Note: This requires no duplicates to exist first!

-- CREATE UNIQUE INDEX IF NOT EXISTS unique_connection_pair 
-- ON connections (LEAST(user_id, connected_user_id), GREATEST(user_id, connected_user_id));

-- Step 5: Check messages for a specific connection
SELECT 
    cm.id,
    cm.connection_id,
    cm.sender_id,
    p.full_name as sender_name,
    cm.content,
    cm.created_at
FROM chat_messages cm
LEFT JOIN profiles p ON cm.sender_id = p.id
WHERE cm.connection_id IN (
    SELECT id FROM connections 
    WHERE (user_id = (SELECT id FROM profiles WHERE email = 'kanishkpatil06@gmail.com')
           OR connected_user_id = (SELECT id FROM profiles WHERE email = 'kanishkpatil06@gmail.com'))
)
ORDER BY cm.created_at DESC
LIMIT 30;
