"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { MainNav } from "@/components/navigation/main-nav"
import {
    NotificationItem,
    type Notification,
} from "@/components/notifications/notification-item"
import {
    Bell,
    CheckCheck,
    Trash2,
    Loader2,
    Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type FilterTab = "all" | "unread"

function groupByDate(notifications: Notification[]) {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const groups: { label: string; items: Notification[] }[] = []
    const todayItems: Notification[] = []
    const yesterdayItems: Notification[] = []
    const earlierItems: Notification[] = []

    for (const n of notifications) {
        const d = new Date(n.created_at)
        if (d.toDateString() === today.toDateString()) {
            todayItems.push(n)
        } else if (d.toDateString() === yesterday.toDateString()) {
            yesterdayItems.push(n)
        } else {
            earlierItems.push(n)
        }
    }

    if (todayItems.length) groups.push({ label: "Today", items: todayItems })
    if (yesterdayItems.length)
        groups.push({ label: "Yesterday", items: yesterdayItems })
    if (earlierItems.length)
        groups.push({ label: "Earlier", items: earlierItems })

    return groups
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
    const [filter, setFilter] = useState<FilterTab>("all")
    const [clearing, setClearing] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    // ── Auth ───────────────────────────────────────────────────────────
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (!data.user) {
                router.push("/auth/login")
            } else {
                setUser(data.user)
            }
        })
    }, [supabase, router])

    // ── Fetch ──────────────────────────────────────────────────────────
    const fetchNotifications = useCallback(async () => {
        setLoading(true)
        try {
            const url =
                filter === "unread"
                    ? "/api/notifications?limit=50&unread=true"
                    : "/api/notifications?limit=50"
            const res = await fetch(url)
            if (res.ok) {
                const data = await res.json()
                setNotifications(data.notifications)
                setUnreadCount(data.unreadCount)
            }
        } catch (err) {
            console.error("Failed:", err)
        } finally {
            setLoading(false)
        }
    }, [filter])

    useEffect(() => {
        if (user) fetchNotifications()
    }, [user, fetchNotifications])

    // ── Realtime ───────────────────────────────────────────────────────
    useEffect(() => {
        if (!user) return
        const channel = supabase
            .channel("notif_page_realtime")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${user.id}`,
                },
                () => fetchNotifications()
            )
            .subscribe()
        return () => {
            supabase.removeChannel(channel)
        }
    }, [user, supabase, fetchNotifications])

    // ── Actions ────────────────────────────────────────────────────────
    const handleClick = async (n: Notification) => {
        if (!n.read_at) {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: n.id }),
            })
            setNotifications((prev) =>
                prev.map((item) =>
                    item.id === n.id
                        ? { ...item, read_at: new Date().toISOString() }
                        : item
                )
            )
            setUnreadCount((prev) => Math.max(0, prev - 1))
        }
        if (n.link) router.push(n.link)
    }

    const handleDelete = async (id: string) => {
        const n = notifications.find((x) => x.id === id)
        setNotifications((prev) => prev.filter((x) => x.id !== id))
        if (n && !n.read_at) setUnreadCount((prev) => Math.max(0, prev - 1))
        await fetch(`/api/notifications?id=${id}`, { method: "DELETE" })
    }

    const handleMarkAllRead = async () => {
        await fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ markAllRead: true }),
        })
        setNotifications((prev) =>
            prev.map((n) => ({
                ...n,
                read_at: n.read_at || new Date().toISOString(),
            }))
        )
        setUnreadCount(0)
    }

    const handleClearAll = async () => {
        setClearing(true)
        // Delete all one by one (API design is per-id, but we batch in the UI)
        await Promise.all(
            notifications.map((n) =>
                fetch(`/api/notifications?id=${n.id}`, { method: "DELETE" })
            )
        )
        setNotifications([])
        setUnreadCount(0)
        setClearing(false)
    }

    const groups = groupByDate(notifications)

    if (!user) return null

    return (
        <div className="min-h-screen bg-background">
            <MainNav user={user as any} />

            <main className="max-w-3xl mx-auto px-4 py-8 animate-fade-in-up">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                            <Bell className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                Notifications
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {unreadCount > 0
                                    ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                                    : "You're all caught up!"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleMarkAllRead}
                                className="gap-1.5 text-xs"
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                Mark all read
                            </Button>
                        )}
                        {notifications.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClearAll}
                                disabled={clearing}
                                className="gap-1.5 text-xs text-destructive hover:text-destructive"
                            >
                                {clearing ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                )}
                                Clear all
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-xl w-fit mb-6">
                    {(["all", "unread"] as FilterTab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                                filter === tab
                                    ? "bg-card text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <span className="flex items-center gap-1.5">
                                {tab === "unread" && <Filter className="w-3.5 h-3.5" />}
                                {tab === "all" ? "All" : "Unread"}
                                {tab === "unread" && unreadCount > 0 && (
                                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-primary-foreground bg-primary rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Notification list */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                            <Bell className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                            {filter === "unread"
                                ? "No unread notifications"
                                : "No notifications yet"}
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            {filter === "unread"
                                ? "You've read all your notifications. Nice!"
                                : "When you receive connection requests, messages, or session updates, they'll appear here."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {groups.map((group) => (
                            <div key={group.label}>
                                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                                    {group.label}
                                </h2>
                                <div className="bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/30">
                                    {group.items.map((n) => (
                                        <NotificationItem
                                            key={n.id}
                                            notification={n}
                                            onClick={handleClick}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
