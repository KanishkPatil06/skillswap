import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const supabase = await createClient()

        const { data: profiles, error } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url, points, user_badges(badges(icon_url, name))")
            .order("points", { ascending: false })
            .limit(20)

        if (error) throw error

        return NextResponse.json(profiles)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
    }
}
