"use client"

import { useEffect, useState, useRef } from "react"
import DailyIframe from "@daily-co/daily-js"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react"
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
    const [callFrame, setCallFrame] = useState<any>(null)
    const [isMuted, setIsMuted] = useState(false)
    const [isSpeakerOn, setIsSpeakerOn] = useState(true)
    const [callDuration, setCallDuration] = useState(0)
    const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting')
    const callStartTime = useRef<number | null>(null)
    const durationInterval = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (isOpen && roomUrl) {
            joinCall()
        }

        return () => {
            leaveCall()
        }
    }, [isOpen, roomUrl])

    const joinCall = async () => {
        try {
            const frame = DailyIframe.createFrame({
                showLeaveButton: false,
                showFullscreenButton: false,
                iframeStyle: {
                    position: 'absolute',
                    width: '1px',
                    height: '1px',
                    visibility: 'hidden',
                },
            })

            await frame.join({ url: roomUrl, showParticipantsBar: false })

            setCallFrame(frame)

            // Listen for events
            frame.on('joined-meeting', () => {
                console.log('Joined call')
                setCallStatus('connecting')
            })

            frame.on('participant-joined', () => {
                console.log('Other participant joined')
                setCallStatus('connected')
                callStartTime.current = Date.now()
                startDurationTimer()
            })

            frame.on('participant-left', () => {
                console.log('Other participant left')
                endCall('ended')
            })

            frame.on('left-meeting', () => {
                console.log('Left call')
                setCallStatus('ended')
            })

            frame.on('error', (error: any) => {
                console.error('Call error:', error)
                endCall('ended')
            })
        } catch (error) {
            console.error('Error joining call:', error)
            endCall('ended')
        }
    }

    const startDurationTimer = () => {
        durationInterval.current = setInterval(() => {
            if (callStartTime.current) {
                const duration = Math.floor((Date.now() - callStartTime.current) / 1000)
                setCallDuration(duration)
            }
        }, 1000)
    }

    const leaveCall = async () => {
        if (durationInterval.current) {
            clearInterval(durationInterval.current)
        }

        if (callFrame) {
            await callFrame.leave()
            await callFrame.destroy()
            setCallFrame(null)
        }
    }

    const endCall = async (status: string) => {
        try {
            // Update call record in database
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

        await leaveCall()
        onClose()
    }

    const toggleMute = () => {
        if (callFrame) {
            callFrame.setLocalAudio(!isMuted)
            setIsMuted(!isMuted)
        }
    }

    const toggleSpeaker = () => {
        // Note: Browser limitations - speaker control is limited on web
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center">
                        {callStatus === 'connecting' ? 'Connecting...' :
                            callStatus === 'connected' ? formatDuration(callDuration) :
                                'Call Ended'}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center gap-6 py-8">
                    {/* Caller Avatar */}
                    <div className="relative">
                        <Avatar className="w-24 h-24">
                            {remoteAvatar ? (
                                <AvatarImage src={remoteAvatar} alt={remoteName} />
                            ) : (
                                <AvatarFallback className="text-2xl">
                                    {getInitials(remoteName)}
                                </AvatarFallback>
                            )}
                        </Avatar>
                        {callStatus === 'connecting' && (
                            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                        )}
                    </div>

                    {/* Caller Name */}
                    <div className="text-center">
                        <h3 className="text-xl font-semibold">{remoteName}</h3>
                        <p className="text-sm text-muted-foreground">
                            {callStatus === 'connecting' ? 'Calling...' :
                                callStatus === 'connected' ? 'On call' :
                                    'Call ended'}
                        </p>
                    </div>

                    {/* Call Controls */}
                    <div className="flex gap-4">
                        <Button
                            size="icon"
                            variant={isMuted ? "default" : "outline"}
                            onClick={toggleMute}
                            className="rounded-full h-14 w-14"
                            disabled={callStatus !== 'connected'}
                        >
                            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </Button>

                        <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => endCall('ended')}
                            className="rounded-full h-14 w-14"
                        >
                            <PhoneOff className="w-5 h-5" />
                        </Button>

                        <Button
                            size="icon"
                            variant={isSpeakerOn ? "default" : "outline"}
                            onClick={toggleSpeaker}
                            className="rounded-full h-14 w-14"
                            disabled={callStatus !== 'connected'}
                        >
                            {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
