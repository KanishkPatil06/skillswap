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
    messageType?: 'text' | 'file' | 'note'
    fileUrl?: string
    fileName?: string
    fileSize?: number
    fileType?: string
    noteTitle?: string
    noteContent?: string
}

export function MessageBubble({
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
}: MessageBubbleProps) {
    const [mounted, setMounted] = useState(false)
    const [noteExpanded, setNoteExpanded] = useState(false)

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
                    {messageType === 'file' && fileUrl && fileName && (
                        <div className="space-y-2">
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
                                {noteExpanded ? (
                                    <>
                                        {noteContent}
                                        {noteContent.length > 150 && (
                                            <button
                                                onClick={() => setNoteExpanded(false)}
                                                className={cn(
                                                    "text-xs mt-2 underline",
                                                    isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                                                )}
                                            >
                                                Show less
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {noteContent.length > 150 ? noteContent.substring(0, 150) + '...' : noteContent}
                                        {noteContent.length > 150 && (
                                            <button
                                                onClick={() => setNoteExpanded(true)}
                                                className={cn(
                                                    "text-xs mt-2 underline block",
                                                    isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                                                )}
                                            >
                                                Show more
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {messageType === 'text' && (
                        <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
                    )}

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
