-- Add verified_at column to user_skills if it doesn't exist
ALTER TABLE public.user_skills 
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;

-- Create an assessments table to track attempts (optional but good for history)
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  score INT NOT NULL,
  max_score INT NOT NULL,
  passed BOOLEAN NOT NULL DEFAULT false,
  questions JSONB, -- Store questions asked
  answers JSONB,   -- Store user answers
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on assessments
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assessments
CREATE POLICY "Users can view their own assessments" 
  ON public.assessments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assessments" 
  ON public.assessments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
