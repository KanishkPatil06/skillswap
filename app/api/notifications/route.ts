import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET /api/notifications — fetch user's notifications + unread count
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const limit = parseInt(searchParams.get("limit") || "20")
        const offset = parseInt(searchParams.get("offset") || "0")
        const unreadOnly = searchParams.get("unread") === "true"

        // Build query
        let query = supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1)

        if (unreadOnly) {
            query = query.is("read_at", null)
        }

        const { data: notifications, error } = await query

        if (error) {
            console.error("Error fetching notifications:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Get unread count
        const { count: unreadCount } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .is("read_at", null)

        return NextResponse.json({
            notifications: notifications || [],
            unreadCount: unreadCount || 0,
        })
    } catch (err) {
        console.error("Notifications GET error:", err)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

// PATCH /api/notifications — mark as read
export async function PATCH(req: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { id, markAllRead } = body

        if (markAllRead) {
            // Mark all notifications as read
            const { error } = await supabase
                .from("notifications")
                .update({ read_at: new Date().toISOString() })
                .eq("user_id", user.id)
                .is("read_at", null)

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 })
            }

            return NextResponse.json({ success: true, message: "All marked as read" })
        }

        if (!id) {
            return NextResponse.json(
                { error: "Notification id is required" },
                { status: 400 }
            )
        }

        // Mark single notification as read
        const { error } = await supabase
            .from("notifications")
            .update({ read_at: new Date().toISOString() })
            .eq("id", id)
            .eq("user_id", user.id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error("Notifications PATCH error:", err)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

// DELETE /api/notifications — delete a notification
export async function DELETE(req: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json(
                { error: "Notification id is required" },
                { status: 400 }
            )
        }

        const { error } = await supabase
            .from("notifications")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error("Notifications DELETE error:", err)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
