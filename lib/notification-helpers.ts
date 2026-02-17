import { createClient } from "@/lib/supabase/server"

type NotificationType =
    | "connection_request"
    | "connection_accepted"
    | "message"
    | "session_reminder"
    | "session_booked"
    | "rating_received"
    | "endorsement"
    | "help_request"
    | "system"

interface CreateNotificationParams {
    userId: string
    type: NotificationType
    title: string
    message: string
    link?: string
    metadata?: Record<string, unknown>
}

/** Low-level helper — inserts a row into the notifications table. */
export async function createNotification(params: CreateNotificationParams) {
    const supabase = await createClient()
    const { error } = await supabase.from("notifications").insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link ?? null,
        metadata: params.metadata ?? null,
    })
    if (error) console.error("Failed to create notification:", error)
    return !error
}

// ── Convenience wrappers ────────────────────────────────────────────

export async function notifyConnectionRequest(
    fromName: string,
    toUserId: string
) {
    return createNotification({
        userId: toUserId,
        type: "connection_request",
        title: "New Connection Request",
        message: `${fromName} wants to connect with you.`,
        link: "/connections",
    })
}

export async function notifyConnectionAccepted(
    accepterName: string,
    toUserId: string
) {
    return createNotification({
        userId: toUserId,
        type: "connection_accepted",
        title: "Connection Accepted",
        message: `${accepterName} accepted your connection request!`,
        link: "/connections",
    })
}

export async function notifyNewMessage(
    senderName: string,
    recipientId: string,
    preview: string
) {
    return createNotification({
        userId: recipientId,
        type: "message",
        title: "New Message",
        message: `${senderName}: ${preview.slice(0, 80)}${preview.length > 80 ? "…" : ""}`,
        link: "/chat",
    })
}

export async function notifySessionBooked(
    bookerName: string,
    recipientId: string,
    skillName: string
) {
    return createNotification({
        userId: recipientId,
        type: "session_booked",
        title: "Session Booked",
        message: `${bookerName} booked a session for "${skillName}".`,
        link: "/sessions",
    })
}

export async function notifySessionReminder(
    userId: string,
    partnerName: string,
    minutesUntil: number
) {
    return createNotification({
        userId,
        type: "session_reminder",
        title: "Session Starting Soon",
        message: `Your session with ${partnerName} starts in ${minutesUntil} minutes.`,
        link: "/sessions",
    })
}

export async function notifyRatingReceived(
    raterName: string,
    userId: string,
    rating: number
) {
    return createNotification({
        userId,
        type: "rating_received",
        title: "New Rating Received",
        message: `${raterName} rated you ${rating}★.`,
        link: "/profile",
    })
}

export async function notifyEndorsement(
    endorserName: string,
    userId: string,
    skillName: string
) {
    return createNotification({
        userId,
        type: "endorsement",
        title: "Skill Endorsed",
        message: `${endorserName} endorsed your "${skillName}" skill!`,
        link: "/profile",
    })
}
