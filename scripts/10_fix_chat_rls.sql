-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to be safe (safely, if they exist)
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update messages" ON chat_messages;

-- Create comprehensive SELECT policy
CREATE POLICY "Users can view messages in their connections"
ON chat_messages FOR SELECT
USING (
  auth.uid() = sender_id 
  OR 
  EXISTS (
    SELECT 1 FROM connections c
    WHERE c.id = chat_messages.connection_id
    AND (c.user_id = auth.uid() OR c.connected_user_id = auth.uid())
  )
);

-- Create INSERT policy
CREATE POLICY "Users can insert messages in their connections"
ON chat_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id 
  AND 
  EXISTS (
    SELECT 1 FROM connections c
    WHERE c.id = connection_id
    AND (c.user_id = auth.uid() OR c.connected_user_id = auth.uid())
    AND c.status = 'accepted'
  )
);

-- Create UPDATE policy (for marking as read)
CREATE POLICY "Users can update messages in their connections"
ON chat_messages FOR UPDATE
USING (
   EXISTS (
    SELECT 1 FROM connections c
    WHERE c.id = chat_messages.connection_id
    AND (c.user_id = auth.uid() OR c.connected_user_id = auth.uid())
  )
)
WITH CHECK (
   EXISTS (
    SELECT 1 FROM connections c
    WHERE c.id = chat_messages.connection_id
    AND (c.user_id = auth.uid() OR c.connected_user_id = auth.uid())
  )
);
