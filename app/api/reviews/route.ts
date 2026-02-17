import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// POST /api/reviews - Create a new review
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { session_id, reviewee_id, rating, comment } = body

        // Validate input
        if (!session_id || !reviewee_id || !rating) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            )
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json(
                { error: "Rating must be between 1 and 5" },
                { status: 400 }
            )
        }

        // Verify the user was a participant in the session and it is completed
        const { data: session, error: sessionError } = await supabase
            .from("sessions")
            .select("mentor_id, learner_id, status")
            .eq("id", session_id)
            .single()

        if (sessionError || !session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 })
        }

        if (session.status !== "completed") {
            return NextResponse.json(
                { error: "Session must be completed to leave a review" },
                { status: 400 }
            )
        }

        if (session.mentor_id !== user.id && session.learner_id !== user.id) {
            return NextResponse.json(
                { error: "You were not a participant in this session" },
                { status: 403 }
            )
        }

        // Insert review
        const { data: review, error: reviewError } = await supabase
            .from("reviews")
            .insert({
                reviewer_id: user.id,
                reviewee_id,
                session_id,
                rating,
                comment,
            })
            .select()
            .single()

        if (reviewError) {
            if (reviewError.code === "23505") {
                return NextResponse.json(
                    { error: "You have already reviewed this session" },
                    { status: 409 }
                )
            }
            console.error("Error creating review:", reviewError)
            return NextResponse.json(
                { error: "Failed to create review" },
                { status: 500 }
            )
        }

        return NextResponse.json(review)
    } catch (err) {
        console.error("Review creation error:", err)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

// GET /api/reviews - Get reviews for a user or session
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get("userId")
        const sessionId = searchParams.get("sessionId")

        let query = supabase
            .from("reviews")
            .select(`
                *,
                reviewer:reviewer_id (
                    id,
                    full_name,
                    avatar_url
                )
            `)

        if (sessionId) {
            query = query.eq("session_id", sessionId)
        } else if (userId) {
            query = query.eq("reviewee_id", userId).order("created_at", { ascending: false })
        } else {
            return NextResponse.json(
                { error: "UserId or SessionId required" },
                { status: 400 }
            )
        }

        const { data: reviews, error } = await query

        if (error) {
            console.error("Error fetching reviews:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(reviews)
    } catch (err) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
