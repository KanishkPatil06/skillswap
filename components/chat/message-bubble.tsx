"use client"

import { cn } from "@/lib/utils"
import { Check, CheckCheck } from "lucide-react"
import { useState, useEffect } from "react"
import { MessageActions } from "./message-actions"
import { MessageReactions } from "./message-reactions"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface MessageBubbleProps {
    id: string
    content: string
    timestamp: Date
    isOwn: boolean
    senderName?: string
    isRead?: boolean
    messageType?: 'text' | 'file' | 'note' | 'audio'
    fileUrl?: string
    fileName?: string
    fileSize?: number
    fileType?: string
    noteTitle?: string
    noteContent?: string
    isEdited?: boolean
    isDeleted?: boolean
    reactions?: any[]
    currentUserId: string
    onEdit?: (newContent: string) => void
    onDelete?: () => void
    onReact?: (emoji: string) => void
    onReply?: () => void
    replyTo?: {
        id: string
        content: string
        sender_id: string
        message_type: string
    }
}

export function MessageBubble({
    id,
    content,
    timestamp,
    isOwn,
    senderName,
    isRead,
    messageType = 'text',
    fileUrl,
    fileName,
    fileSize,
    fileType,
    noteTitle,
    noteContent,
    isEdited,
    isDeleted,
    reactions = [],
    currentUserId,
    onEdit,
    onDelete,
    onReact,
    onReply,
    replyTo
}: MessageBubbleProps) {
    const [mounted, setMounted] = useState(false)
    const [noteExpanded, setNoteExpanded] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editContent, setEditContent] = useState(content)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleSaveEdit = () => {
        if (editContent.trim() !== content) {
            onEdit?.(editContent)
        }
        setIsEditing(false)
    }

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('en-IN', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata'
        }).format(date)
    }

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return ''
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
    }

    const getFileIcon = (type?: string) => {
        if (!type) return '📄'
        if (type.startsWith('image/')) return '🖼️'
        if (type.startsWith('video/')) return '🎥'
        if (type.startsWith('audio/')) return '🎵'
        if (type.includes('pdf')) return '📕'
        if (type.includes('zip') || type.includes('rar')) return '📦'
        return '📄'
    }

    if (isDeleted) {
        return (
            <div className={cn("flex w-full group", isOwn ? "justify-end" : "justify-start")}>
                <div className={cn(
                    "rounded-2xl px-4 py-2 shadow-sm italic text-muted-foreground bg-muted/50 text-sm",
                    isOwn ? "rounded-br-sm" : "rounded-bl-sm"
                )}>
                    This message was deleted
                    <span className="text-[10px] ml-2 opacity-50 block text-right">
                        {mounted ? formatTime(timestamp) : "..."}
                    </span>
                </div>
            </div>
        )
    }

    return (
        <div className={cn("flex w-full group items-start gap-2", isOwn ? "justify-end" : "justify-end flex-row-reverse")}>
            {/* Actions Menu */}
            {!isEditing && !isDeleted && (
                <MessageActions
                    isOwnMessage={isOwn}
                    onEdit={() => {
                        setEditContent(content)
                        setIsEditing(true)
                    }}
                    onReply={() => onReply?.()}
                    onDelete={() => onDelete?.()}
                    onReact={(emoji) => onReact?.(emoji)}
                />
            )}

            <div className={cn("flex flex-col max-w-[70%] sm:max-w-md")}>

                {/* Reply Context */}
                {replyTo && (
                    <div className={cn(
                        "text-xs mb-1 px-3 py-1 rounded-lg border-l-2 bg-muted/30 opacity-80 truncate cursor-pointer hover:opacity-100 transition-opacity",
                        isOwn ? "items-end text-right border-primary/50 self-end" : "items-start text-left border-primary/50 self-start"
                    )}>
                        <span className="font-semibold block opacity-70">
                            Replying to {replyTo.sender_id === currentUserId ? 'You' : (senderName || 'them')}
                        </span>
                        <span className="truncate block max-w-[200px]">
                            {replyTo.message_type === 'text' ? replyTo.content : `[${replyTo.message_type}]`}
                        </span>
                    </div>
                )}

                {!isOwn && senderName && (
                    <span className="text-xs text-muted-foreground mb-1 px-1">
                        {senderName}
                    </span>
                )}

                <div
                    className={cn(
                        "rounded-2xl px-4 py-2 shadow-sm relative",
                        isOwn
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm"
                    )}
                >
                    {isEditing ? (
                        <div className="flex flex-col gap-2 min-w-[200px]">
                            <Input
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="bg-background text-foreground h-8"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit()
                                    if (e.key === 'Escape') setIsEditing(false)
                                }}
                            />
                            <div className="flex justify-end gap-2">
                                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-6 px-2 text-xs">
                                    Cancel
                                </Button>
                                <Button size="sm" onClick={handleSaveEdit} className="h-6 px-2 text-xs bg-background text-foreground hover:bg-background/90">
                                    Save
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* File Display */}
                            {messageType === 'audio' && fileUrl && (
                                <div className="space-y-1 min-w-[200px]">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs opacity-70">Voice Message</span>
                                    </div>
                                    <audio src={fileUrl} controls className="w-full h-8" />
                                </div>
                            )}

                            {messageType === 'file' && fileUrl && fileName && (
                                <div className="space-y-2">
                                    {/* Image Preview */}
                                    {fileType?.startsWith('image/') && (
                                        <div className="relative rounded-lg overflow-hidden border border-border/50 max-w-[240px]">
                                            <img
                                                src={fileUrl}
                                                alt={fileName}
                                                className="w-full h-auto object-contain bg-background/50"
                                                loading="lazy"
                                            />
                                        </div>
                                    )}

                                    {!fileType?.startsWith('image/') && (
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">{getFileIcon(fileType)}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{fileName}</p>
                                                <p className={cn(
                                                    "text-xs",
                                                    isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                                                )}>
                                                    {formatFileSize(fileSize)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <a
                                        href={fileUrl}
                                        download={fileName}
                                        className={cn(
                                            "inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors",
                                            isOwn
                                                ? "bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground"
                                                : "bg-primary/10 hover:bg-primary/20 text-primary"
                                        )}
                                    >
                                        📥 Download
                                    </a>
                                </div>
                            )}

                            {/* Note Display */}
                            {messageType === 'note' && noteTitle && noteContent && (
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <span className="text-lg">📝</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold">{noteTitle}</p>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "text-sm whitespace-pre-wrap break-words rounded p-2",
                                        isOwn ? "bg-primary-foreground/10" : "bg-background/50"
                                    )}>
                                        {/* Note content expansion logic skipped for brevity, keeping simple */}
                                        {noteContent}
                                    </div>
                                </div>
                            )}

                            {/* Text Content */}
                            {messageType === 'text' && (
                                <p className="text-sm whitespace-pre-wrap break-words">
                                    {content}
                                    {isEdited && <span className="text-[10px] ml-1 opacity-70">(edited)</span>}
                                </p>
                            )}

                            {/* Timestamp & Status */}
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
                                        {isRead ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                                    </span>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Reactions */}
                <MessageReactions
                    messageId={id}
                    reactions={reactions}
                    currentUserId={currentUserId}
                    onReactionUpdate={() => onReact?.("")} // Trigger update? The component handles toggle internally but parent might need refresh?
                />
            </div>
        </div>
    )
}
