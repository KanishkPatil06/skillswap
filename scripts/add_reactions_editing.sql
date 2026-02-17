-- Add editing/deletion flags to chat_messages
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON public.message_reactions(user_id);

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- RLS Policies for Message Reactions
-- ----------------------------------------------------------------------------

-- Users can view reactions for messages they can see
-- (Simplified: If you can see the message (checked via join), you can see reactions)
CREATE POLICY "Users can view reactions"
  ON public.message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_messages m
      WHERE m.id = message_reactions.message_id
      AND (m.sender_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.connections c 
        WHERE c.id = m.connection_id 
        AND (c.user_id = auth.uid() OR c.connected_user_id = auth.uid())
      ))
    )
  );

-- Users can add their own reactions
CREATE POLICY "Users can add reactions"
  ON public.message_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reactions
CREATE POLICY "Users can delete their own reactions"
  ON public.message_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Realtime Publication
-- ----------------------------------------------------------------------------
-- Add message_reactions to publication for realtime updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'message_reactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
  END IF;
END $$;
