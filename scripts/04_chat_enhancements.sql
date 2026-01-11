-- Chat System Database Enhancements
-- Add read status and improve message tracking

-- Add read_at column to track when messages are read
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

-- Add index for efficient unread messages queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_read_at 
ON public.chat_messages(connection_id, read_at) 
WHERE read_at IS NULL;

-- Add index for sender queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id 
ON public.chat_messages(sender_id);

-- Update RLS policy to allow users to mark messages as read
DROP POLICY IF EXISTS "Users can mark messages as read" ON public.chat_messages;
CREATE POLICY "Users can mark messages as read" 
ON public.chat_messages 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.connections c
    WHERE c.id = chat_messages.connection_id
    AND (c.user_id = auth.uid() OR c.connected_user_id = auth.uid())
    AND c.status = 'accepted'
  )
);

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chat_messages' 
AND table_schema = 'public';
