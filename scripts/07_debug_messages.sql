-- Debug script to check chat messages for a connection
-- Run this in your Supabase SQL Editor

-- Check all messages for the connection
SELECT 
    id,
    connection_id,
    sender_id,
    content,
    created_at
FROM chat_messages
WHERE connection_id = 'd5d1e54d-59cd-4179-8eff-51a1ecc0e0bb'
ORDER BY created_at DESC
LIMIT 20;

-- Check the connection details
SELECT 
    id,
    user_id,
    connected_user_id,
    status,
    created_at
FROM connections
WHERE id = 'd5d1e54d-59cd-4179-8eff-51a1ecc0e0bb';

-- Check what connections exist between the two users
-- Replace these IDs with the actual user IDs from your auth.users table
SELECT 
    c.id as connection_id,
    c.user_id,
    c.connected_user_id,
    c.status,
    p1.full_name as user_name,
    p2.full_name as connected_user_name
FROM connections c
LEFT JOIN profiles p1 ON c.user_id = p1.id
LEFT JOIN profiles p2 ON c.connected_user_id = p2.id
WHERE c.status = 'accepted';

-- Check profiles for both email addresses
SELECT id, full_name, email
FROM profiles
WHERE email IN ('kanishkpatil06@gmail.com', 'kanishk3patil@gmail.com');
