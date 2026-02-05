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
            <DialogContent className="sm:max-w-lg border-2 bg-white dark:bg-gray-950">
                <DialogHeader className="pb-2">
                    <DialogTitle className="text-center text-xl font-bold bg-gradient-to-r from-green-600 to-primary bg-clip-text text-transparent">
                        📞 Incoming Call
                    </DialogTitle>
                    <DialogDescription className="text-center text-base">
                        {callerName} is calling you
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-8 py-6 px-4">
                    {/* Caller Avatar with Ring Animation & Glow */}
                    <div className="relative">
                        <div className="absolute -inset-6 bg-gradient-to-r from-green-500/40 to-primary/40 rounded-full blur-2xl opacity-75 animate-pulse" />
                        <Avatar className="relative w-32 h-32 border-4 border-background shadow-2xl">
                            {callerAvatar ? (
                                <AvatarImage src={callerAvatar} alt={callerName} />
                            ) : (
                                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-green-600 to-primary">
                                    {getInitials(callerName)}
                                </AvatarFallback>
                            )}
                        </Avatar>
                        {isRinging && (
                            <>
                                <div className="absolute inset-0 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
                                <div className="absolute -inset-2 rounded-full border-2 border-green-400/30 animate-ping" style={{ animationDuration: '1.5s' }} />
                            </>
                        )}
                    </div>

                    {/* Caller Name & Voice Call Badge */}
                    <div className="text-center space-y-3">
                        <h3 className="text-2xl font-bold">{callerName}</h3>
                        <div className="flex items-center justify-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                            <Phone className="w-4 h-4 text-green-600 animate-pulse" />
                            <p className="text-sm font-semibold text-foreground">
                                Voice Call
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons - Improved Layout */}
                    <div className="flex gap-8 mt-4">
                        <div className="flex flex-col items-center gap-3">
                            <Button
                                size="icon"
                                variant="destructive"
                                onClick={onDecline}
                                className="rounded-full h-18 w-18 shadow-xl hover:scale-110 transition-transform"
                            >
                                <PhoneOff className="w-7 h-7" />
                            </Button>
                            <span className="text-sm font-medium text-destructive">Decline</span>
                        </div>

                        <div className="flex flex-col items-center gap-3">
                            <Button
                                size="icon"
                                onClick={onAccept}
                                className="rounded-full h-20 w-20 shadow-2xl hover:scale-110 transition-all bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 animate-pulse"
                            >
                                <Phone className="w-8 h-8" />
                            </Button>
                            <span className="text-sm font-medium text-green-600">Accept</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
