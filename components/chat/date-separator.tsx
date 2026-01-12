"use client"

import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface DateSeparatorProps {
    date: Date
}

export function DateSeparator({ date }: DateSeparatorProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const formatDate = (date: Date) => {
        // Get current date in IST
        const nowIST = new Date().toLocaleDateString("en-IN", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        })

        // Get the message date in IST
        const messageDateIST = date.toLocaleDateString("en-IN", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        })

        // Get yesterday's date in IST
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayIST = yesterday.toLocaleDateString("en-IN", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        })

        const isToday = messageDateIST === nowIST
        const isYesterday = messageDateIST === yesterdayIST

        if (isToday) return "Today"
        if (isYesterday) return "Yesterday"

        return date.toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
            year: new Date().getFullYear() !== date.getFullYear() ? "numeric" : undefined,
            timeZone: "Asia/Kolkata",
        })
    }

    return (
        <div className="flex items-center justify-center my-6">
            <div className="flex-1 border-t border-border" />
            <span className="px-4 text-xs text-muted-foreground font-medium" suppressHydrationWarning>
                {mounted ? formatDate(date) : "..."}
            </span>
            <div className="flex-1 border-t border-border" />
        </div>
    )
}
