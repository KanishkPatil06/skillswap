"use client"

import { cn } from "@/lib/utils"
import { Bot, User, AlertCircle } from "lucide-react"

interface ChatbotMessageProps {
    role: "user" | "assistant"
    content: string
    timestamp?: Date
    isError?: boolean
}

export function ChatbotMessage({ role, content, timestamp, isError }: ChatbotMessageProps) {
    const isAI = role === "assistant"

    return (
        <div className={cn("flex gap-3", isAI ? "flex-row" : "flex-row-reverse")}>
            <div
                className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                    isAI
                        ? isError
                            ? "bg-destructive text-destructive-foreground"
                            : "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                )}
            >
                {isAI ? (
                    isError ? <AlertCircle className="w-4 h-4" /> : <Bot className="w-4 h-4" />
                ) : (
                    <User className="w-4 h-4" />
                )}
            </div>
            <div
                className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5",
                    isAI
                        ? isError
                            ? "bg-destructive/10 text-foreground rounded-tl-sm border border-destructive/20"
                            : "glass-proper !bg-muted/30 backdrop-blur-md rounded-tl-sm border-border/10"
                        : "bg-primary text-primary-foreground rounded-tr-sm"
                )}
            >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
                {timestamp && (
                    <p className={cn(
                        "text-[10px] mt-1",
                        isAI ? "text-muted-foreground" : "text-primary-foreground/70"
                    )}>
                        {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                )}
            </div>
        </div>
    )
}
