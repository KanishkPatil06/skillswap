"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
    NotificationItem,
    type Notification,
} from "@/components/notifications/notification-item"

interface NotificationBellProps {
    userId: string
}

export function NotificationBell({ userId }: NotificationBellProps) {
    const [open, setOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(false)
    const [markingAll, setMarkingAll] = useState(false)
    const panelRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const supabase = createClient()

    // ── Fetch notifications ───────────────────────────────────────────
    const fetchNotifications = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/notifications?limit=10")
            if (res.ok) {
                const data = await res.json()
                setNotifications(data.notifications)
                setUnreadCount(data.unreadCount)
            }
        } catch (err) {
            console.error("Failed to fetch notifications:", err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchNotifications()
    }, [fetchNotifications])

    // ── Realtime subscription ─────────────────────────────────────────
    useEffect(() => {
        const channel = supabase
            .channel("notifications_realtime")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    const newNotif = payload.new as Notification
                    setNotifications((prev) => [newNotif, ...prev].slice(0, 10))
                    setUnreadCount((prev) => prev + 1)
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    // On any update (e.g. mark as read), refetch counts
                    fetchNotifications()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId, supabase, fetchNotifications])

    // ── Close on outside click ────────────────────────────────────────
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        if (open) document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [open])

    // ── Actions ───────────────────────────────────────────────────────
    const handleNotificationClick = async (n: Notification) => {
        // Mark as read
        if (!n.read_at) {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: n.id }),
            })
            setUnreadCount((prev) => Math.max(0, prev - 1))
            setNotifications((prev) =>
                prev.map((item) =>
                    item.id === n.id
                        ? { ...item, read_at: new Date().toISOString() }
                        : item
                )
            )
        }
        setOpen(false)
        if (n.link) router.push(n.link)
    }

    const handleDelete = async (id: string) => {
        const n = notifications.find((x) => x.id === id)
        setNotifications((prev) => prev.filter((x) => x.id !== id))
        if (n && !n.read_at) setUnreadCount((prev) => Math.max(0, prev - 1))
        await fetch(`/api/notifications?id=${id}`, { method: "DELETE" })
    }

    const handleMarkAllRead = async () => {
        setMarkingAll(true)
        await fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ markAllRead: true }),
        })
        setNotifications((prev) =>
            prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
        )
        setUnreadCount(0)
        setMarkingAll(false)
    }

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell button */}
            <button
                onClick={() => {
                    setOpen((prev) => !prev)
                    if (!open) fetchNotifications()
                }}
                className={cn(
                    "relative p-2 rounded-full transition-all duration-300",
                    "hover:bg-primary/10 active:scale-95",
                    open && "bg-primary/10"
                )}
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5 text-foreground/80" />

                {/* Unread badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-gradient-to-br from-primary to-accent rounded-full shadow-lg shadow-primary/30 animate-pulse">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            {open && (
                <div
                    className={cn(
                        "absolute right-0 top-12 w-[380px] max-h-[480px] rounded-2xl overflow-hidden",
                        "bg-card border border-border/60 shadow-2xl shadow-primary/10",
                        "animate-in fade-in slide-in-from-top-2 duration-200",
                        "flex flex-col z-50"
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
                        <h3 className="text-sm font-semibold text-foreground">
                            Notifications
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                disabled={markingAll}
                                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                            >
                                {markingAll ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <CheckCheck className="w-3.5 h-3.5" />
                                )}
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto overscroll-contain">
                        {loading && notifications.length === 0 ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                                    <Bell className="w-6 h-6 text-muted-foreground/50" />
                                </div>
                                <p className="text-sm text-muted-foreground font-medium">
                                    No notifications yet
                                </p>
                                <p className="text-xs text-muted-foreground/60 mt-1">
                                    You&apos;ll see updates about connections, messages &amp;
                                    sessions here.
                                </p>
                            </div>
                        ) : (
                            <div className="py-1">
                                {notifications.map((n) => (
                                    <NotificationItem
                                        key={n.id}
                                        notification={n}
                                        onClick={handleNotificationClick}
                                        onDelete={handleDelete}
                                        compact
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="border-t border-border/50 px-4 py-2.5 bg-muted/20">
                            <Link
                                href="/notifications"
                                onClick={() => setOpen(false)}
                                className="block text-center text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                            >
                                View All Notifications →
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
