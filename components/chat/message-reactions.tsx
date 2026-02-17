"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Smile, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface Reaction {
    id: string
    message_id: string
    user_id: string
    emoji: string
}

interface MessageReactionsProps {
    messageId: string
    reactions: Reaction[]
    currentUserId: string
    onReactionUpdate?: () => void
}

const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡"]

export function MessageReactions({ messageId, reactions, currentUserId, onReactionUpdate }: MessageReactionsProps) {
    const [isOpen, setIsOpen] = useState(false)
    const supabase = createClient()

    // Group reactions by emoji
    const reactionCounts = reactions.reduce((acc, reaction) => {
        acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    // Check which emojis the current user has reacted with
    const userReactions = new Set(
        reactions
            .filter((r) => r.user_id === currentUserId)
            .map((r) => r.emoji)
    )

    const handleToggleReaction = async (emoji: string) => {
        try {
            if (userReactions.has(emoji)) {
                // Remove reaction
                await supabase
                    .from("message_reactions")
                    .delete()
                    .match({ message_id: messageId, user_id: currentUserId, emoji })
            } else {
                // Add reaction
                await supabase
                    .from("message_reactions")
                    .insert({ message_id: messageId, user_id: currentUserId, emoji })
            }
            onReactionUpdate?.()
            setIsOpen(false)
        } catch (error) {
            console.error("Error toggling reaction:", error)
        }
    }

    return (
        <div className="flex flex-wrap items-center gap-1 mt-1">
            {Object.entries(reactionCounts).map(([emoji, count]) => (
                <button
                    key={emoji}
                    onClick={() => handleToggleReaction(emoji)}
                    className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-full border transition-colors",
                        userReactions.has(emoji)
                            ? "bg-primary/10 border-primary/50 text-primary"
                            : "bg-muted border-transparent hover:border-border"
                    )}
                >
                    <span>{emoji}</span>
                    <span>{count}</span>
                </button>
            ))}

            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Smile className="h-3 w-3 text-muted-foreground" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start">
                    <div className="flex gap-1">
                        {COMMON_EMOJIS.map((emoji) => (
                            <button
                                key={emoji}
                                onClick={() => handleToggleReaction(emoji)}
                                className={cn(
                                    "p-2 text-lg hover:bg-muted rounded-md transition-colors",
                                    userReactions.has(emoji) && "bg-primary/10"
                                )}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
