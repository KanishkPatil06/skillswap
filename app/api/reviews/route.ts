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
        const { data: reviews, error } = await supabase
            .from("reviews")
            .select(`
        *,
        reviewer:reviewer_id (
          id,
          full_name,
          avatar_url
        )
      `)
            .eq("reviewee_id", userId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching reviews:", error);
            return NextResponse.json(
                { error: "Failed to fetch reviews" },
                { status: 500 }
            );
        }

        return NextResponse.json(reviews);
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
        const { reviewee_id, rating, comment } = body;

        // Validate input
        if (!reviewee_id || !rating) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (user.id === reviewee_id) {
            return NextResponse.json(
                { error: "You cannot review yourself" },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("reviews")
            .insert({
                reviewer_id: user.id,
                reviewee_id,
                rating,
                comment,
            })
            .select()
            .single();

        if (error) {
            console.error("Error submitting review:", error);
            return NextResponse.json(
                { error: "Failed to submit review" },
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
