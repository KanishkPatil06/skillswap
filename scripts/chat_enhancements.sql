-- Add reply support
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL;

-- Add index for replies
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to_id ON public.chat_messages(reply_to_id);

-- Create pinned_chats table
CREATE TABLE IF NOT EXISTS public.pinned_chats (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    connection_id UUID REFERENCES public.connections(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, connection_id)
);

-- Enable RLS
ALTER TABLE public.pinned_chats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pinned_chats
DROP POLICY IF EXISTS "Users can view their own pinned chats" ON public.pinned_chats;
CREATE POLICY "Users can view their own pinned chats" 
    ON public.pinned_chats FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their pinned chats" ON public.pinned_chats;
CREATE POLICY "Users can manage their pinned chats" 
    ON public.pinned_chats FOR ALL 
    USING (auth.uid() = user_id);
