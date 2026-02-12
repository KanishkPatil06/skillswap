
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

const DAILY_API_KEY = process.env.DAILY_API_KEY

export async function POST(req: NextRequest) {
    try {
        const { sessionId } = await req.json()
        const supabase = await createClient()

        // 1. Check auth
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // 2. Fetch session to verify participation and check existing room
        const { data: session, error: sessionError } = await supabase
            .from("sessions")
            .select("*")
            .eq("id", sessionId)
            .single()

        if (sessionError || !session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 })
        }

        // Verify user is part of the session
        if (session.mentor_id !== user.id && session.mentee_id !== user.id) {
            return NextResponse.json({ error: "Unauthorized access to this session" }, { status: 403 })
        }

        // 3. If room already exists, return it
        if (session.meeting_link) {
            return NextResponse.json({ url: session.meeting_link })
        }

        // 4. Create new room in Daily.co
        if (!DAILY_API_KEY) {
            console.warn("DAILY_API_KEY not set. Returning mock URL for development.")
            // Update DB with mock URL so we don't keep "creating" it
            const mockUrl = `https://demo.daily.co/skillswap-${sessionId}`
            await supabase
                .from("sessions")
                .update({ meeting_link: mockUrl })
                .eq("id", sessionId)
            return NextResponse.json({ url: mockUrl })
        }

        const response = await fetch("https://api.daily.co/v1/rooms", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${DAILY_API_KEY}`,
            },
            body: JSON.stringify({
                name: `skillswap-${sessionId}`,
                privacy: "public", // For simplicity, or use 'private' and generate tokens
                properties: {
                    enable_chat: true,
                    start_video_off: false,
                    start_audio_off: false,
                }
            }),
        })

        if (!response.ok) {
            const error = await response.json()
            // If room already exists (400), simpler to just construct URL
            if (response.status === 400 && error.info?.includes("already exists")) {
                // Fallback to constructing URL if we know the domain
                // But better to just update our DB if we missed it.
                // Let's assume for now we just handle fresh creation or existing DB link.
            }
            console.error("Daily API Error:", error)
            throw new Error("Failed to create video room")
        }

        const room = await response.json()

        // 5. Update session with meeting link
        const { error: updateError } = await supabase
            .from("sessions")
            .update({ meeting_link: room.url })
            .eq("id", sessionId)

        if (updateError) throw updateError

        return NextResponse.json({ url: room.url })

    } catch (error: any) {
        console.error("Error in video creation:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
