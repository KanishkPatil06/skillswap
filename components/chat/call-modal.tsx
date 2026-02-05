"use client"

import { useEffect, useState, useRef } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface CallModalProps {
    isOpen: boolean
    onClose: () => void
    roomUrl: string
    callId: string
    remoteName: string
    remoteAvatar?: string
    isIncoming?: boolean
}

export function CallModal({
    isOpen,
    onClose,
    roomUrl,
    callId,
    remoteName,
    remoteAvatar,
    isIncoming = false
}: CallModalProps) {
    const [isMuted, setIsMuted] = useState(false)
    const [isSpeakerOn, setIsSpeakerOn] = useState(true)
    const [callDuration, setCallDuration] = useState(0)
    const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting')
    const callStartTime = useRef<number | null>(null)
    const durationInterval = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (isOpen) {
            // Simulate connecting then connected
            console.log('📞 Call modal opened')
            setTimeout(() => {
                console.log('✅ Call connected')
                setCallStatus('connected')
                callStartTime.current = Date.now()
                startDurationTimer()
            }, 2000)
        } else {
            if (durationInterval.current) {
                clearInterval(durationInterval.current)
            }
        }

        return () => {
            if (durationInterval.current) {
                clearInterval(durationInterval.current)
            }
        }
    }, [isOpen])

    const startDurationTimer = () => {
        durationInterval.current = setInterval(() => {
            if (callStartTime.current) {
                const duration = Math.floor((Date.now() - callStartTime.current) / 1000)
                setCallDuration(duration)
            }
        }, 1000)
    }

    const endCall = async (status: string) => {
        try {
            await fetch('/api/calls/end', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    callId,
                    status,
                    duration: callDuration,
                }),
            })
        } catch (error) {
            console.error('Error updating call record:', error)
        }

        if (durationInterval.current) {
            clearInterval(durationInterval.current)
        }
        onClose()
    }

    const toggleMute = () => {
        setIsMuted(!isMuted)
    }

    const toggleSpeaker = () => {
        setIsSpeakerOn(!isSpeakerOn)
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && endCall('ended')}>
            <DialogContent className="sm:max-w-lg border-2 bg-card">
                <DialogHeader className="pb-2">
                    <DialogTitle className="text-center text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        {callStatus === 'connecting' ? '📞 Connecting...' :
                            callStatus === 'connected' ? `⏱️ ${formatDuration(callDuration)}` :
                                '📵 Call Ended'}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center gap-8 py-6 px-4">
                    {/* Caller Avatar with Glow Effect */}
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
                        {callStatus === 'connecting' && (
                            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                        )}
                    </div>

                    {/* Caller Name & Status */}
                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-bold">{remoteName}</h3>
                        <div className="flex items-center justify-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${callStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                            <p className="text-sm font-medium text-muted-foreground">
                                {callStatus === 'connecting' ? 'Establishing connection...' :
                                    callStatus === 'connected' ? 'Connected • Voice call' :
                                        'Call ended'}
                            </p>
                        </div>
                    </div>

                    {/* Call Controls */}
                    <div className="flex gap-6 mt-4">
                        <div className="flex flex-col items-center gap-2">
                            <Button
                                size="icon"
                                variant={isMuted ? "default" : "outline"}
                                onClick={toggleMute}
                                className="rounded-full h-16 w-16 shadow-lg hover:scale-110 transition-transform"
                                disabled={callStatus !== 'connected'}
                            >
                                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                            </Button>
                            <span className="text-xs font-medium text-muted-foreground">
                                {isMuted ? 'Unmute' : 'Mute'}
                            </span>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <Button
                                size="icon"
                                variant="destructive"
                                onClick={() => endCall('ended')}
                                className="rounded-full h-18 w-18 shadow-2xl hover:scale-110 transition-transform bg-gradient-to-r from-red-600 to-red-500"
                            >
                                <PhoneOff className="w-7 h-7" />
                            </Button>
                            <span className="text-xs font-medium text-destructive">End Call</span>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <Button
                                size="icon"
                                variant={isSpeakerOn ? "default" : "outline"}
                                onClick={toggleSpeaker}
                                className="rounded-full h-16 w-16 shadow-lg hover:scale-110 transition-transform"
                                disabled={callStatus !== 'connected'}
                            >
                                {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                            </Button>
                            <span className="text-xs font-medium text-muted-foreground">
                                Speaker
                            </span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
