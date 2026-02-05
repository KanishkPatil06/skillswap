"use client"

import { useEffect, useState } from "react"
import { Phone, PhoneOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface IncomingCallNotificationProps {
    isOpen: boolean
    callerName: string
    callerAvatar?: string
    onAccept: () => void
    onDecline: () => void
}

export function IncomingCallNotification({
    isOpen,
    callerName,
    callerAvatar,
    onAccept,
    onDecline
}: IncomingCallNotificationProps) {
    const [isRinging, setIsRinging] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setIsRinging(true)
            // Play ringtone (optional)
            // const audio = new Audio('/ringtone.mp3')
            // audio.loop = true
            // audio.play()
        } else {
            setIsRinging(false)
        }
    }, [isOpen])

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <Dialog open={isOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center text-lg">Incoming Call</DialogTitle>
                    <DialogDescription className="text-center">
                        {callerName} is calling you
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-6 py-4">
                    {/* Caller Avatar with Ring Animation */}
                    <div className="relative">
                        <Avatar className="w-24 h-24">
                            {callerAvatar ? (
                                <AvatarImage src={callerAvatar} alt={callerName} />
                            ) : (
                                <AvatarFallback className="text-2xl">
                                    {getInitials(callerName)}
                                </AvatarFallback>
                            )}
                        </Avatar>
                        {isRinging && (
                            <>
                                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                                <div
                                    className="absolute inset-0 rounded-full bg-primary/20 animate-ping"
                                    style={{ animationDuration: '1.5s' }}
                                />
                            </>
                        )}
                    </div>

                    {/* Caller Name */}
                    <div className="text-center">
                        <h3 className="text-xl font-semibold">{callerName}</h3>
                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mt-1">
                            <Phone className="w-4 h-4 animate-pulse" />
                            Voice Call
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-6 mt-2">
                        <div className="flex flex-col items-center gap-2">
                            <Button
                                size="icon"
                                variant="destructive"
                                onClick={onDecline}
                                className="rounded-full h-16 w-16"
                            >
                                <PhoneOff className="w-6 h-6" />
                            </Button>
                            <span className="text-xs text-muted-foreground">Decline</span>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <Button
                                size="icon"
                                onClick={onAccept}
                                className="rounded-full h-16 w-16 bg-green-600 hover:bg-green-700"
                            >
                                <Phone className="w-6 h-6" />
                            </Button>
                            <span className="text-xs text-muted-foreground">Accept</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
