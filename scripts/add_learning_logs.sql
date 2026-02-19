-- Create learning_logs table
CREATE TABLE IF NOT EXISTS public.learning_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    learned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.learning_logs ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own learning logs" ON public.learning_logs;
CREATE POLICY "Users can view their own learning logs"
    ON public.learning_logs FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own learning logs" ON public.learning_logs;
CREATE POLICY "Users can insert their own learning logs"
    ON public.learning_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own learning logs" ON public.learning_logs;
CREATE POLICY "Users can delete their own learning logs"
    ON public.learning_logs FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_learning_logs_user_id ON public.learning_logs(user_id);
