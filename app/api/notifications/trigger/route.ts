import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { NextRequest, NextResponse } from "next/server"
import { sendNotificationEmail, getEmailPreferenceKey } from "@/lib/email"

/**
 * POST /api/notifications/trigger
 * Creates an in-app notification and optionally sends an email.
 * Body: { type, recipientId, message?, metadata? }
 */
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
        const { type, recipientId, message, metadata } = body

        if (!type || !recipientId) {
            return NextResponse.json(
                { error: "type and recipientId are required" },
                { status: 400 }
            )
        }

        // Don't notify yourself
        if (recipientId === user.id) {
            return NextResponse.json({ success: true, skipped: true })
        }

        // Get sender's name
        const { data: senderProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single()

        const senderName = senderProfile?.full_name || user.email || "Someone"

        // Build notification based on type
        let title = ""
        let body_message = ""
        let link = ""

        switch (type) {
            case "message":
                title = "New Message"
                body_message = `${senderName}: ${(message || "sent you a message").slice(0, 80)}`
                link = "/chat"
                break

            case "file_shared":
                title = "File Shared"
                body_message = `${senderName} shared a file with you.`
                link = "/chat"
                break

            case "connection_request":
                title = "New Connection Request"
                body_message = `${senderName} wants to connect with you.`
                link = "/connections"
                break

            case "connection_accepted":
                title = "Connection Accepted"
                body_message = `${senderName} accepted your connection request!`
                link = "/connections"
                break

            case "session_booked":
                title = "Session Booked"
                body_message = `${senderName} booked a session with you.`
                link = "/sessions"
                break

            case "rating_received":
                title = "New Rating"
                body_message = `${senderName} left you a rating.`
                link = "/profile"
                break

            default:
                title = "Notification"
                body_message = message || `${senderName} performed an action.`
                link = "/dashboard"
        }

        // Insert in-app notification
        const { error } = await supabase.from("notifications").insert({
            user_id: recipientId,
            type,
            title,
            message: body_message,
            link,
            metadata: metadata || null,
        })

        if (error) {
            console.error("Failed to create notification:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // --- Email notification (fire-and-forget) ---
        const emailPrefKey = getEmailPreferenceKey(type)

        if (emailPrefKey) {
            // Run email logic without blocking the response
            ; (async () => {
                try {
                    // Use service-role client to look up recipient email from auth.users
                    const adminClient = createServiceRoleClient()
                    if (!adminClient) {
                        console.log("[Email] Service role key not configured, skipping email")
                        return
                    }

                    const { data: recipientAuth } = await adminClient.auth.admin.getUserById(recipientId)
                    const recipientEmail = recipientAuth?.user?.email

                    if (!recipientEmail) {
                        console.log("[Email] No email found for recipient", recipientId)
                        return
                    }

                    // Check user's email preference for this notification type
                    const { data: prefs } = await supabase
                        .from("notification_preferences")
                        .select("*")
                        .eq("user_id", recipientId)
                        .single()

                    // Default to true if no preferences row exists
                    const emailEnabled = prefs ? (prefs as any)[emailPrefKey] !== false : true

                    if (!emailEnabled) {
                        console.log(`[Email] User ${recipientId} has ${emailPrefKey} disabled`)
                        return
                    }

                    await sendNotificationEmail(recipientEmail, type, title, body_message, link)
                } catch (emailErr) {
                    console.error("[Email] Error in email dispatch:", emailErr)
                }
            })()
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error("Notification trigger error:", err)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

