import { cn } from "@/lib/utils"

interface DateSeparatorProps {
    date: Date
}

export function DateSeparator({ date }: DateSeparatorProps) {
    const formatDate = (date: Date) => {
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        const isToday = date.toDateString() === today.toDateString()
        const isYesterday = date.toDateString() === yesterday.toDateString()

        if (isToday) return "Today"
        if (isYesterday) return "Yesterday"

        return date.toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
            year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
            timeZone: "Asia/Kolkata",
        })
    }

    return (
        <div className="flex items-center justify-center my-6">
            <div className="flex-1 border-t border-border" />
            <span className="px-4 text-xs text-muted-foreground font-medium">
                {formatDate(date)}
            </span>
            <div className="flex-1 border-t border-border" />
        </div>
    )
}
