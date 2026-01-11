export function TypingIndicator({ userName }: { userName?: string }) {
    return (
        <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-2xl rounded-bl-sm max-w-fit">
            <span className="text-sm text-muted-foreground">
                {userName || "User"} is typing
            </span>
            <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
            </div>
        </div>
    )
}
