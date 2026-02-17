"use client"

import {
    UserPlus,
    UserCheck,
    MessageSquare,
    Calendar,
    Star,
    Award,
    HelpCircle,
    Info,
    Trash2,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

export interface Notification {
    id: string
    user_id: string
    type: string
    title: string
    message: string
    link: string | null
    read_at: string | null
    created_at: string
    metadata: Record<string, unknown> | null
}

const typeConfig: Record<
    string,
    { icon: React.ElementType; color: string; bg: string }
> = {
    connection_request: {
        icon: UserPlus,
        color: "text-blue-400",
        bg: "bg-blue-500/15",
    },
    connection_accepted: {
        icon: UserCheck,
        color: "text-emerald-400",
        bg: "bg-emerald-500/15",
    },
    message: {
        icon: MessageSquare,
        color: "text-violet-400",
        bg: "bg-violet-500/15",
    },
    session_booked: {
        icon: Calendar,
        color: "text-amber-400",
        bg: "bg-amber-500/15",
    },
    session_reminder: {
        icon: Calendar,
        color: "text-orange-400",
        bg: "bg-orange-500/15",
    },
    rating_received: {
        icon: Star,
        color: "text-yellow-400",
        bg: "bg-yellow-500/15",
    },
    endorsement: {
        icon: Award,
        color: "text-pink-400",
        bg: "bg-pink-500/15",
    },
    help_request: {
        icon: HelpCircle,
        color: "text-cyan-400",
        bg: "bg-cyan-500/15",
    },
    system: {
        icon: Info,
        color: "text-muted-foreground",
        bg: "bg-muted/40",
    },
}

interface NotificationItemProps {
    notification: Notification
    onClick?: (notification: Notification) => void
    onDelete?: (id: string) => void
    compact?: boolean
}

export function NotificationItem({
    notification,
    onClick,
    onDelete,
    compact = false,
}: NotificationItemProps) {
    const config = typeConfig[notification.type] || typeConfig.system
    const Icon = config.icon
    const isUnread = !notification.read_at

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onClick?.(notification)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(notification) }}
            className={cn(
                "w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative cursor-pointer",
                isUnread
                    ? "bg-primary/[0.04] hover:bg-primary/[0.08]"
                    : "hover:bg-muted/50",
                compact ? "py-2.5 px-3" : ""
            )}
        >
            {/* Type icon */}
            <div
                className={cn(
                    "shrink-0 flex items-center justify-center rounded-lg mt-0.5",
                    config.bg,
                    compact ? "w-8 h-8" : "w-9 h-9"
                )}
            >
                <Icon className={cn(config.color, compact ? "w-4 h-4" : "w-[18px] h-[18px]")} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p
                        className={cn(
                            "text-sm truncate",
                            isUnread ? "font-semibold text-foreground" : "text-foreground/80"
                        )}
                    >
                        {notification.title}
                    </p>
                    {isUnread && (
                        <span className="shrink-0 w-2 h-2 rounded-full bg-primary animate-pulse" />
                    )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {notification.message}
                </p>
                <p className="text-[11px] text-muted-foreground/60 mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                    })}
                </p>
            </div>

            {/* Delete button */}
            {onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete(notification.id)
                    }}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    aria-label="Delete notification"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    )
}
