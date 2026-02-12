import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json(
            { error: "User ID is required" },
            { status: 400 }
        );
    }

    try {
        const { data: endorsements, error } = await supabase
            .from("skill_endorsements")
            .select(`
        *,
        endorser:endorser_id (
          id,
          full_name,
          avatar_url
        ),
        skill:skill_id (
          id,
          name,
          category
        )
      `)
            .eq("endorsed_user_id", userId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching endorsements:", error);
            return NextResponse.json(
                { error: "Failed to fetch endorsements" },
                { status: 500 }
            );
        }

        return NextResponse.json(endorsements);
    } catch (err) {
        console.error("Unexpected error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const body = await request.json();
        const { endorsed_user_id, skill_id } = body;

        // Validate input
        if (!endorsed_user_id || !skill_id) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (user.id === endorsed_user_id) {
            return NextResponse.json(
                { error: "You cannot endorse yourself" },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("skill_endorsements")
            .insert({
                endorser_id: user.id,
                endorsed_user_id,
                skill_id,
            })
            .select()
            .single();

        if (error) {
            // Check for unique constraint violation
            if (error.code === '23505') { // Postgres unique_violation code
                return NextResponse.json(
                    { error: "You have already endorsed this skill for this user" },
                    { status: 409 } // Conflict
                );
            }
            console.error("Error submitting endorsement:", error);
            return NextResponse.json(
                { error: "Failed to submit endorsement" },
                { status: 500 }
            );
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error("Unexpected error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
