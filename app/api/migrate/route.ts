import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
    const supabase = await createClient()

    // Check if tables already exist
    const { data: existingReviews } = await supabase
        .from("reviews")
        .select("id")
        .limit(1)

    if (existingReviews !== null) {
        return NextResponse.json({ message: "Tables already exist!" })
    }

    // Run migrations using Supabase RPC or raw SQL
    // Since supabase-js doesn't support raw DDL, we use rpc with a helper function
    // Instead, we'll create tables one by one using the REST approach

    const migrations = [
        // 1. Create reviews table
        `CREATE TABLE IF NOT EXISTS public.reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      CONSTRAINT no_self_review CHECK (reviewer_id != reviewee_id)
    )`,
        // 2. Create indexes for reviews
        `CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON public.reviews(reviewer_id)`,
        `CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON public.reviews(reviewee_id)`,
        `CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating)`,
        // 3. Enable RLS
        `ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY`,
        // 4. RLS Policies for reviews
        `CREATE POLICY "Reviews are public" ON public.reviews FOR SELECT USING (true)`,
        `CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id)`,
        `CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = reviewer_id)`,
        // 5. Create skill_endorsements table
        `CREATE TABLE IF NOT EXISTS public.skill_endorsements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      endorser_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      endorsed_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      CONSTRAINT no_self_endorsement CHECK (endorser_id != endorsed_user_id),
      UNIQUE(endorser_id, endorsed_user_id, skill_id)
    )`,
        // 6. Create indexes for endorsements
        `CREATE INDEX IF NOT EXISTS idx_endorsements_endorser ON public.skill_endorsements(endorser_id)`,
        `CREATE INDEX IF NOT EXISTS idx_endorsements_endorsed ON public.skill_endorsements(endorsed_user_id)`,
        `CREATE INDEX IF NOT EXISTS idx_endorsements_skill ON public.skill_endorsements(skill_id)`,
        // 7. Enable RLS
        `ALTER TABLE public.skill_endorsements ENABLE ROW LEVEL SECURITY`,
        // 8. RLS Policies for endorsements
        `CREATE POLICY "Endorsements are public" ON public.skill_endorsements FOR SELECT USING (true)`,
        `CREATE POLICY "Users can create endorsements" ON public.skill_endorsements FOR INSERT WITH CHECK (auth.uid() = endorser_id)`,
        `CREATE POLICY "Users can delete own endorsements" ON public.skill_endorsements FOR DELETE USING (auth.uid() = endorser_id)`,
    ]

    const results: { sql: string; success: boolean; error?: string }[] = []

    for (const sql of migrations) {
        const { error } = await supabase.rpc("exec_sql", { sql_query: sql })
        results.push({
            sql: sql.substring(0, 60) + "...",
            success: !error,
            error: error?.message,
        })
    }

    return NextResponse.json({ results })
}

export async function GET() {
    return NextResponse.json({
        message: "Migration endpoint. Send a POST request to run migrations.",
        instructions: "You can also run the SQL manually in Supabase Dashboard > SQL Editor.",
    })
}
