-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add points to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Badges Table
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT NOT NULL,
    required_points INTEGER DEFAULT 0,
    category TEXT CHECK (category IN ('sessions', 'reviews', 'community')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Badges (Unlocked)
CREATE TABLE IF NOT EXISTS user_badges (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, badge_id)
);

-- Point History (Audit Log)
CREATE TABLE IF NOT EXISTS point_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies

-- Badges: Readable by everyone, insertable by service_role only (seed)
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges are viewable by everyone" ON badges FOR SELECT USING (true);

-- User Badges: Readable by everyone, insertable by service_role (backend logic)
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User badges are viewable by everyone" ON user_badges FOR SELECT USING (true);

-- Point History: Readable by own user, insertable by service_role (backend logic)
ALTER TABLE point_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own point history" ON point_history FOR SELECT USING (auth.uid() = user_id);

-- Seed some initial badges
INSERT INTO badges (name, description, icon_url, required_points, category) VALUES
('First Step', 'Completed your first session', '🎯', 50, 'sessions'),
('Networker', 'Completed 10 sessions', '🤝', 500, 'sessions'),
('Top Rated', 'Received 5 five-star reviews', '⭐', 100, 'reviews'),
('Reviewer', 'Wrote 10 reviews', '📝', 100, 'reviews'),
('Community Pillar', 'Earned 1000 points', '🏆', 1000, 'community')
ON CONFLICT DO NOTHING;
