"use client"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreVertical, Pencil, Trash2, Smile } from "lucide-react"

interface MessageActionsProps {
    isOwnMessage: boolean
    onEdit: () => void
    onDelete: () => void
    onReact: (emoji: string) => void
}

export function MessageActions({ isOwnMessage, onEdit, onDelete, onReact }: MessageActionsProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isOwnMessage ? "end" : "start"}>
                <DropdownMenuItem onClick={() => onReact("👍")}>
                    <Smile className="mr-2 h-4 w-4" />
                    React
                </DropdownMenuItem>

                {isOwnMessage && (
                    <>
                        <DropdownMenuItem onClick={onEdit}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
