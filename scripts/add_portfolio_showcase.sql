-- Create user_portfolio_items table
CREATE TABLE IF NOT EXISTS public.user_portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    item_url TEXT,
    image_url TEXT,
    item_type TEXT NOT NULL DEFAULT 'project' CHECK (item_type IN ('project', 'github', 'certification', 'other')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON public.user_portfolio_items(user_id);

-- Enable RLS
ALTER TABLE public.user_portfolio_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public portfolio items are viewable by everyone"
    ON public.user_portfolio_items FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own portfolio items"
    ON public.user_portfolio_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolio items"
    ON public.user_portfolio_items FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolio items"
    ON public.user_portfolio_items FOR DELETE
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.user_portfolio_items TO authenticated;
GRANT SELECT ON public.user_portfolio_items TO anon;
