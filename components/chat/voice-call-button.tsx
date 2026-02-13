"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Phone, PhoneOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface VoiceCallButtonProps {
    connectionId: string
    receiverId: string
    receiverName: string
    callerName: string
    onCallInitiated: (callChannelId: string, callId: string) => void
    disabled?: boolean
}

export function VoiceCallButton({
    connectionId,
    receiverId,
    receiverName,
    callerName,
    onCallInitiated,
    disabled = false,
}: VoiceCallButtonProps) {
    const [isInitiating, setIsInitiating] = useState(false)
    const { toast } = useToast()

    const handleStartCall = async () => {
        try {
            console.log("🔵 Starting call...")
            setIsInitiating(true)

            // Get current user
            const { createClient } = await import("@/lib/supabase/client")
            const supabase = createClient()
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                throw new Error("Not authenticated")
            }

            console.log("🔵 Creating call room for:", receiverName)

            // Create call room via API
            const response = await fetch("/api/calls/create-room", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    connectionId,
                    callerId: user.id,
                    receiverId,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                console.error("❌ API Error:", errorData)
                throw new Error(errorData.error || "Failed to start call")
            }

            const { callChannelId, callId } = await response.json()
            console.log("✅ Call created:", { callChannelId, callId })

            // Notify the receiver via Supabase Realtime broadcast
            console.log("🔵 Sending call notification to:", receiverId)
            const callNotifChannel = supabase.channel(`user:${receiverId}`)
            await callNotifChannel.subscribe()

            await callNotifChannel.send({
                type: "broadcast",
                event: "incoming_call",
                payload: {
                    callId,
                    callChannelId,
                    callerId: user.id,
                    callerName: callerName,
                    connectionId,
                },
            })

            // Clean up notification channel after sending
            setTimeout(() => {
                supabase.removeChannel(callNotifChannel)
            }, 2000)

            // Open call modal
            console.log("🔵 Opening call modal...")
            onCallInitiated(callChannelId, callId)

            toast({
                title: "Calling...",
                description: `Calling ${receiverName}`,
            })
            console.log("✅ Call initiated successfully")
        } catch (error: any) {
            console.error("❌ Error starting call:", error)
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
