-- Check if any sessions exist
SELECT COUNT(*) as total_sessions FROM sessions;

-- List last 5 sessions with user details to see if RLS hides them
SELECT 
  s.id, 
  s.status, 
  s.scheduled_at,
  m.full_name as mentor_name,
  l.full_name as learner_name
FROM sessions s
LEFT JOIN profiles m ON s.mentor_id = m.id
LEFT JOIN profiles l ON s.learner_id = l.id
LIMIT 5;

-- Check if current user (you) can see them is hard via SQL script without auth context
-- But verifying data existence is step 1.
