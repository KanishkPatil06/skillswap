import { cn } from "@/lib/utils"

interface OnlineIndicatorProps {
    isOnline?: boolean
    size?: "sm" | "md" | "lg"
    className?: string
}

export function OnlineIndicator({ isOnline = false, size = "md", className }: OnlineIndicatorProps) {
    const sizeClasses = {
        sm: "w-2 h-2",
        md: "w-2.5 h-2.5",
        lg: "w-3 h-3"
    }

    if (!isOnline) return null

    return (
        <div className={cn("relative", className)}>
            <div className={cn(
                "rounded-full bg-emerald-500 border-2 border-background",
                sizeClasses[size]
            )} />
            <div className={cn(
                "absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75",
                sizeClasses[size]
            )} />
        </div>
    )
}
