import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { VideoRoom } from "@/components/video/video-room"

export default async function VideoPage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/auth")

    // Fetch session to get the meeting link
    const { data: session } = await supabase
        .from("sessions")
        .select("meeting_link, mentor_id, learner_id")
        .eq("id", sessionId)
        .single()

    if (!session) notFound()

    // Verify access
    if (session.mentor_id !== user.id && session.learner_id !== user.id) {
        redirect("/sessions")
    }

    // If no link, we might need to create it client-side or error out.
    // Ideally, the "Join" button creates it before navigating here.
    // But if we are here and link exists, use it.

    if (!session.meeting_link) {
        // Redirect back to sessions with error? Or handle creation here?
        // Let's redirect for now as the button logic handles creation.
        redirect("/sessions?error=no-link")
    }

    return (
        <VideoRoom url={session.meeting_link} sessionId={sessionId} />
    )
}
