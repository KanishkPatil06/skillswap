"use client"

import { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PhoneOff, Mic, MicOff, AlertCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useWebRTC } from "@/hooks/useWebRTC"

interface CallModalProps {
    isOpen: boolean
    onClose: () => void
    callChannelId: string
    callId: string
    remoteName: string
    remoteAvatar?: string
    role: "caller" | "receiver"
    userId: string
}

export function CallModal({
    isOpen,
    onClose,
    callChannelId,
    callId,
    remoteName,
    remoteAvatar,
    role,
    userId,
}: CallModalProps) {
    const [hasStarted, setHasStarted] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const {
        callStatus,
        isMuted,
        callDuration,
        error,
        startCall,
        endCall,
        toggleMute,
    } = useWebRTC({
        callChannelId,
        callId,
        role,
        userId,
        onCallEnded: onClose,
    })

    // Start the call when the modal opens (only after client mount)
    useEffect(() => {
        if (!mounted) return
        if (isOpen && !hasStarted && callChannelId && callId) {
            setHasStarted(true)
            startCall()
        }
        if (!isOpen) {
            setHasStarted(false)
        }
    }, [isOpen, hasStarted, callChannelId, callId, startCall, mounted])

    const handleEndCall = async () => {
        await endCall()
        onClose()
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    const getStatusText = () => {
        switch (callStatus) {
            case "connecting":
                return "Establishing connection..."
            case "connected":
                return "Connected • Voice call"
            case "ended":
                return "Call ended"
            case "ringing":
                return "Ringing..."
            default:
                return "Initializing..."
        }
    }

    const getStatusDot = () => {
        switch (callStatus) {
            case "connected":
                return "bg-purple-500 animate-pulse"
            case "connecting":
            case "ringing":
                return "bg-yellow-500 animate-pulse"
            case "ended":
                return "bg-red-500"
            default:
                return "bg-gray-400"
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleEndCall()}>
            <DialogContent className="sm:max-w-lg border-2 bg-white dark:bg-gray-950">
                <DialogHeader className="pb-2">
                    <DialogTitle className="text-center text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        {callStatus === "connecting" || callStatus === "ringing"
                            ? "📞 Connecting..."
                            : callStatus === "connected"
                                ? `⏱️ ${formatDuration(callDuration)}`
                                : "📵 Call Ended"}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center gap-8 py-6 px-4">
                    {/* Remote Avatar with Glow Effect */}
                    <div className="relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-purple-500/30 rounded-full blur-xl opacity-75 animate-pulse" />
                        <Avatar className="relative w-32 h-32 border-4 border-background shadow-2xl">
                            {remoteAvatar ? (
                                <AvatarImage src={remoteAvatar} alt={remoteName} />
                            ) : (
                                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/60">
                                    {getInitials(remoteName)}
                                </AvatarFallback>
                            )}
                        </Avatar>
                        {(callStatus === "connecting" || callStatus === "ringing") && (
                            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                        )}
                    </div>

                    {/* Remote Name & Status */}
                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-bold">{remoteName}</h3>
                        <div className="flex items-center justify-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getStatusDot()}`} />
                            <p className="text-sm font-medium text-muted-foreground">
                                {getStatusText()}
                            </p>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 text-destructive bg-destructive/10 px-4 py-2 rounded-lg">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {/* Call Controls */}
                    <div className="flex gap-6 mt-4">
                        <div className="flex flex-col items-center gap-2">
                            <Button
                                size="icon"
                                variant={isMuted ? "default" : "outline"}
                                onClick={toggleMute}
                                className="rounded-full h-16 w-16 shadow-lg hover:scale-110 transition-transform"
                                disabled={callStatus !== "connected"}
                            >
                                {isMuted ? (
                                    <MicOff className="w-6 h-6" />
                                ) : (
                                    <Mic className="w-6 h-6" />
                                )}
                            </Button>
                            <span className="text-xs font-medium text-muted-foreground">
                                {isMuted ? "Unmute" : "Mute"}
                            </span>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <Button
                                size="icon"
                                variant="destructive"
                                onClick={handleEndCall}
                                className="rounded-full h-18 w-18 shadow-2xl hover:scale-110 transition-transform bg-gradient-to-r from-red-600 to-red-500"
                            >
                                <PhoneOff className="w-7 h-7" />
                            </Button>
                            <span className="text-xs font-medium text-destructive">
                                End Call
                            </span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
