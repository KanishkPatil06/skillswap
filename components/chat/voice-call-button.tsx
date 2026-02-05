"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Phone, PhoneOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface VoiceCallButtonProps {
    connectionId: string
    receiverId: string
    receiverName: string
    onCallInitiated: (roomUrl: string, callId: string) => void
    disabled?: boolean
}

export function VoiceCallButton({
    connectionId,
    receiverId,
    receiverName,
    onCallInitiated,
    disabled = false
}: VoiceCallButtonProps) {
    const [isInitiating, setIsInitiating] = useState(false)
    const { toast } = useToast()

    const handleStartCall = async () => {
        try {
            console.log('🔵 Starting call...')
            setIsInitiating(true)

            // Get current user
            const { createClient } = await import("@/lib/supabase/client")
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                throw new Error("Not authenticated")
            }

            console.log('🔵 Creating call room for:', receiverName)

            // Create call room
            const response = await fetch('/api/calls/create-room', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    connectionId,
                    callerId: user.id,
                    receiverId,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                console.error('❌ API Error:', errorData)
                throw new Error(errorData.error || 'Failed to start call')
            }

            const { roomUrl, callId } = await response.json()
            console.log('✅ Call room created:', { roomUrl, callId })

            // Notify the other user via Supabase Realtime
            console.log('🔵 Sending call notification to:', receiverId)
            await supabase
                .channel(`user:${receiverId}`)
                .send({
                    type: 'broadcast',
                    event: 'incoming_call',
                    payload: {
                        callId,
                        roomUrl,
                        callerId: user.id,
                        callerName: receiverName,
                        connectionId,
                    },
                })

            // Open call modal
            console.log('🔵 Opening call modal...')
            onCallInitiated(roomUrl, callId)

            toast({
                title: "Calling...",
                description: `Calling ${receiverName}`,
            })
            console.log('✅ Call initiated successfully')
        } catch (error: any) {
            console.error('❌ Error starting call:', error)
            toast({
                title: "Call failed",
                description: error.message || "Failed to start call",
                variant: "destructive",
            })
        } finally {
            setIsInitiating(false)
        }
    }

    return (
        <Button
            size="icon"
            variant="outline"
            onClick={handleStartCall}
            disabled={disabled || isInitiating}
            className="hover:bg-primary/10"
            title="Start voice call"
        >
            {isInitiating ? (
                <PhoneOff className="w-4 h-4 animate-pulse" />
            ) : (
                <Phone className="w-4 h-4" />
            )}
        </Button>
    )
}
