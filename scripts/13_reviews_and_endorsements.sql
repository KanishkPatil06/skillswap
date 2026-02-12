-- ============================================================================
-- REVIEWS AND ENDORSEMENTS SYSTEM
-- ============================================================================
-- This script adds tables for user reviews (text-based) and skill endorsements.
-- It complements the existing gamified rating system.
-- ============================================================================

-- ============================================================================
-- 1. REVIEWS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT no_self_review CHECK (reviewer_id != reviewee_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON public.reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);

-- RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Reviews are public
CREATE POLICY "Reviews are public" ON public.reviews
  FOR SELECT USING (true);

-- Policy: Authenticated users can create reviews
CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Policy: Users can delete their own reviews
CREATE POLICY "Users can delete own reviews" ON public.reviews
  FOR DELETE USING (auth.uid() = reviewer_id);

-- ============================================================================
-- 2. SKILL ENDORSEMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.skill_endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endorser_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endorsed_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT no_self_endorsement CHECK (endorser_id != endorsed_user_id),
  UNIQUE(endorser_id, endorsed_user_id, skill_id) -- One endorsement per pair per skill
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_endorsements_endorser ON public.skill_endorsements(endorser_id);
CREATE INDEX IF NOT EXISTS idx_endorsements_endorsed ON public.skill_endorsements(endorsed_user_id);
CREATE INDEX IF NOT EXISTS idx_endorsements_skill ON public.skill_endorsements(skill_id);

-- RLS
ALTER TABLE public.skill_endorsements ENABLE ROW LEVEL SECURITY;

-- Policy: Endorsements are public
CREATE POLICY "Endorsements are public" ON public.skill_endorsements
  FOR SELECT USING (true);

-- Policy: Authenticated users can create endorsements
CREATE POLICY "Users can create endorsements" ON public.skill_endorsements
  FOR INSERT WITH CHECK (auth.uid() = endorser_id);

-- Policy: Users can delete their own endorsements
CREATE POLICY "Users can delete own endorsements" ON public.skill_endorsements
  FOR DELETE USING (auth.uid() = endorser_id);

-- ============================================================================
-- 3. INTEGRATION WITH RATING SYSTEM (OPTIONAL TRIGGERS)
-- ============================================================================
-- (Optional) You can add triggers here to award points via user_activities
-- when a review is received or a skill is endorsed.
-- For now, we keep it simple.

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
