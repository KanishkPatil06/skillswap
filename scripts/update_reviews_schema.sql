-- Add session_id to reviews table
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_reviews_session_id ON public.reviews(session_id);

-- Add unique constraint to prevent duplicate reviews for the same session by the same user
-- existing 'no_self_review' check still applies
ALTER TABLE public.reviews 
ADD CONSTRAINT unique_review_per_session UNIQUE (reviewer_id, session_id);
