import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function ChatIndexPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/")
    }

    // Find the user's most recent chat connection
    const { data: connection } = await supabase
        .from("connections")
        .select("id")
        .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`)
        .eq("status", "accepted")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single()

    if (connection) {
        // Redirect to the most recent conversation
        redirect(`/chat/${connection.id}`)
    }

    // No connections — redirect to connections page
    redirect("/connections")
}
