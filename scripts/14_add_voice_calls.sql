-- ============================================================================
-- VOICE CALL FEATURE MIGRATION
-- ============================================================================
-- This script adds voice call functionality with call history tracking
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Create call_history table
CREATE TABLE IF NOT EXISTS public.call_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID REFERENCES public.connections(id) ON DELETE CASCADE,
  caller_id UUID REFERENCES auth.users(id),
  receiver_id UUID REFERENCES auth.users(id),
  call_type TEXT DEFAULT 'voice' CHECK (call_type IN ('voice', 'video')),
  status TEXT DEFAULT 'ringing' CHECK (status IN ('ringing', 'accepted', 'rejected', 'missed', 'ended')),
  room_url TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_call_history_connection 
ON public.call_history(connection_id);

CREATE INDEX IF NOT EXISTS idx_call_history_caller 
ON public.call_history(caller_id);

CREATE INDEX IF NOT EXISTS idx_call_history_receiver 
ON public.call_history(receiver_id);

-- Enable RLS
ALTER TABLE public.call_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their call history"
ON public.call_history FOR SELECT
USING (caller_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can insert call records"
ON public.call_history FOR INSERT
WITH CHECK (caller_id = auth.uid());

CREATE POLICY "Users can update their calls"
ON public.call_history FOR UPDATE
USING (caller_id = auth.uid() OR receiver_id = auth.uid());

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify table was created
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'call_history' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify indexes were created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'call_history';
