"use client"

import { cn } from "@/lib/utils"
import { Check, CheckCheck } from "lucide-react"
import { useState, useEffect } from "react"

interface MessageBubbleProps {
    content: string
    timestamp: Date
    isOwn: boolean
    senderName?: string
    isRead?: boolean
}

export function MessageBubble({
    content,
    timestamp,
    isOwn,
    senderName,
    isRead,
}: MessageBubbleProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('en-IN', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata'
        }).format(date)
    }

    return (
        <div className={cn("flex w-full", isOwn ? "justify-end" : "justify-start")}>
            <div className={cn("flex flex-col max-w-[70%] sm:max-w-md")}>
                {!isOwn && senderName && (
                    <span className="text-xs text-muted-foreground mb-1 px-1">
                        {senderName}
                    </span>
                )}
                <div
                    className={cn(
                        "rounded-2xl px-4 py-2 shadow-sm",
                        isOwn
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm"
                    )}
                >
                    <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
                    <div
                        className={cn(
                            "flex items-center gap-1 mt-1",
                            isOwn ? "justify-end" : "justify-start"
                        )}
                    >
                        <span
                            className={cn(
                                "text-xs",
                                isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}
                            suppressHydrationWarning
                        >
                            {mounted ? formatTime(timestamp) : "..."}
                        </span>
                        {isOwn && (
                            <span className="text-primary-foreground/70">
                                {isRead ? (
                                    <CheckCheck className="w-3 h-3" />
                                ) : (
                                    <Check className="w-3 h-3" />
                                )}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
