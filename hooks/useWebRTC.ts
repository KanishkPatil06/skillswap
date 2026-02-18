"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type CallStatus = "idle" | "ringing" | "connecting" | "connected" | "ended"
type CallRole = "caller" | "receiver"

interface UseWebRTCOptions {
    callChannelId: string
    callId: string
    role: CallRole
    userId: string
    onCallEnded?: () => void
}

export function useWebRTC({
    callChannelId,
    callId,
    role,
    userId,
    onCallEnded,
}: UseWebRTCOptions) {
    const [callStatus, setCallStatus] = useState<CallStatus>("idle")
    const [isMuted, setIsMuted] = useState(false)
    const [isSpeakerOn, setIsSpeakerOn] = useState(false)
    const [callDuration, setCallDuration] = useState(0)
    const [error, setError] = useState<string | null>(null)

    const peerConnection = useRef<RTCPeerConnection | null>(null)
    const localStream = useRef<MediaStream | null>(null)
    const remoteAudio = useRef<HTMLAudioElement | null>(null)
    const callStartTime = useRef<number | null>(null)
    const durationInterval = useRef<NodeJS.Timeout | null>(null)
    const supabaseRef = useRef(createClient())
    const channelRef = useRef<ReturnType<typeof supabaseRef.current.channel> | null>(null)
    const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([])
    const hasRemoteDescription = useRef(false)
    const isCleanedUp = useRef(false)

    // ICE servers — free STUN servers for NAT traversal
    const iceServers: RTCIceServer[] = [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
    ]

    // Start duration timer
    const startDurationTimer = useCallback(() => {
        callStartTime.current = Date.now()
        durationInterval.current = setInterval(() => {
            if (callStartTime.current) {
                setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000))
            }
        }, 1000)
    }, [])

    // Clean up everything
    const cleanup = useCallback(() => {
        if (isCleanedUp.current) return
        isCleanedUp.current = true

        console.log("🧹 Cleaning up WebRTC resources")

        if (durationInterval.current) {
            clearInterval(durationInterval.current)
            durationInterval.current = null
        }

        if (localStream.current) {
            localStream.current.getTracks().forEach((track) => track.stop())
            localStream.current = null
        }

        if (peerConnection.current) {
            peerConnection.current.close()
            peerConnection.current = null
        }

        if (channelRef.current) {
            supabaseRef.current.removeChannel(channelRef.current)
            channelRef.current = null
        }

        hasRemoteDescription.current = false
        iceCandidateQueue.current = []
    }, [])

    // End the call
    const endCall = useCallback(async () => {
        console.log("📵 Ending call")
        setCallStatus("ended")

        // Notify remote peer
        if (channelRef.current) {
            try {
                console.log("📤 Sending call_ended signal")
                await channelRef.current.send({
                    type: "broadcast",
                    event: "call_ended",
                    payload: { callId, userId },
                })
            } catch (e) {
                console.warn("Could not send end signal:", e)
            }
        }

        // Update call history in DB
        try {
            await fetch("/api/calls/end", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    callId,
                    status: "ended",
                    duration: callDuration,
                }),
            })
        } catch (e) {
            console.error("Failed to update call record:", e)
        }

        // Trigger local end callback (closes modal) BEFORE cleanup to avoid race conditions
        onCallEnded?.()

        // Small delay to ensure signal goes out before cutting connection
        setTimeout(() => {
            cleanup()
        }, 100)
    }, [callId, userId, callDuration, cleanup, onCallEnded])

    // Get microphone access
    const getMicrophone = useCallback(async () => {
        try {
            console.log("🎤 Requesting microphone access...")

            // mediaDevices requires a secure context (HTTPS or localhost)
            if (typeof window === "undefined") {
                throw new Error("Not in a browser environment")
            }

            if (!navigator?.mediaDevices?.getUserMedia) {
                // Check if running on insecure context
                const isSecure = window.isSecureContext
                if (!isSecure) {
                    throw new Error(
                        "Microphone requires HTTPS. Please access the app via https:// or localhost."
                    )
                }
                throw new Error("Your browser does not support microphone access.")
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            localStream.current = stream
            console.log("✅ Microphone access granted")
            return stream
        } catch (err: any) {
            console.error("❌ Microphone access error:", err)
            setError(err.message || "Microphone access denied. Please allow microphone access.")
            throw err
        }
    }, [])

    // Create RTCPeerConnection
    const createPeerConnection = useCallback(
        (stream: MediaStream) => {
            console.log("🔗 Creating RTCPeerConnection")
            const pc = new RTCPeerConnection({ iceServers })

            // Add local audio tracks to connection
            stream.getTracks().forEach((track) => {
                pc.addTrack(track, stream)
            })

            // Handle remote audio
            pc.ontrack = (event) => {
                console.log("🔊 Received remote audio track")
                if (!remoteAudio.current) {
                    remoteAudio.current = new Audio()
                    remoteAudio.current.autoplay = true
                }
                remoteAudio.current.srcObject = event.streams[0]
                remoteAudio.current.play().catch(console.error)
            }

            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate && channelRef.current) {
                    console.log("🧊 Sending ICE candidate")
                    channelRef.current.send({
                        type: "broadcast",
                        event: "ice_candidate",
                        payload: {
                            candidate: event.candidate.toJSON(),
                            from: userId,
                        },
                    })
                }
            }

            // Monitor connection state
            pc.oniceconnectionstatechange = () => {
                console.log("🔄 ICE connection state:", pc.iceConnectionState)
                switch (pc.iceConnectionState) {
                    case "connected":
                    case "completed":
                        setCallStatus("connected")
                        startDurationTimer()
                        break
                    case "disconnected":
                        console.warn("⚠️ ICE connection disconnected (may be temporary)")
                        // Do NOT end call immediately, wait for failed or recovery
                        break
                    case "failed":
                        console.error("❌ ICE connection failed")
                        endCall()
                        break
                }
            }

            peerConnection.current = pc
            return pc
        },
        [userId, startDurationTimer, endCall]
    )

    // Process queued ICE candidates
    const processIceCandidateQueue = useCallback(async () => {
        if (!peerConnection.current || !hasRemoteDescription.current) return

        while (iceCandidateQueue.current.length > 0) {
            const candidate = iceCandidateQueue.current.shift()!
            try {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate))
                console.log("🧊 Added queued ICE candidate")
            } catch (e) {
                console.error("Failed to add queued ICE candidate:", e)
            }
        }
    }, [])

    // Caller: create offer and send it
    const createAndSendOffer = useCallback(async () => {
        if (!peerConnection.current || !channelRef.current) return

        try {
            console.log("📤 Creating SDP offer")
            const offer = await peerConnection.current.createOffer()
            await peerConnection.current.setLocalDescription(offer)

            channelRef.current.send({
                type: "broadcast",
                event: "webrtc_offer",
                payload: {
                    sdp: offer,
                    from: userId,
                },
            })
            console.log("✅ SDP offer sent")
        } catch (e) {
            console.error("❌ Failed to create offer:", e)
            setError("Failed to establish call connection")
        }
    }, [userId])

    // Receiver: handle offer, create answer
    const handleOffer = useCallback(
        async (sdp: RTCSessionDescriptionInit) => {
            if (!peerConnection.current || !channelRef.current) return

            try {
                console.log("📥 Received SDP offer, creating answer")
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(sdp))
                hasRemoteDescription.current = true
                await processIceCandidateQueue()

                const answer = await peerConnection.current.createAnswer()
                await peerConnection.current.setLocalDescription(answer)

                channelRef.current.send({
                    type: "broadcast",
                    event: "webrtc_answer",
                    payload: {
                        sdp: answer,
                        from: userId,
                    },
                })
                console.log("✅ SDP answer sent")
            } catch (e) {
                console.error("❌ Failed to handle offer:", e)
                setError("Failed to answer call")
            }
        },
        [userId, processIceCandidateQueue]
    )

    // Caller: handle answer
    const handleAnswer = useCallback(
        async (sdp: RTCSessionDescriptionInit) => {
            if (!peerConnection.current) return

            try {
                console.log("📥 Received SDP answer")
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(sdp))
                hasRemoteDescription.current = true
                await processIceCandidateQueue()
                console.log("✅ Remote description set")
            } catch (e) {
                console.error("❌ Failed to handle answer:", e)
            }
        },
        [processIceCandidateQueue]
    )

    // Handle incoming ICE candidate
    const handleIceCandidate = useCallback(
        async (candidate: RTCIceCandidateInit) => {
            if (!peerConnection.current) return

            if (!hasRemoteDescription.current) {
                console.log("🧊 Queuing ICE candidate (waiting for remote description)")
                iceCandidateQueue.current.push(candidate)
                return
            }

            try {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate))
                console.log("🧊 Added ICE candidate")
            } catch (e) {
                console.error("Failed to add ICE candidate:", e)
            }
        },
        []
    )

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (localStream.current) {
            const audioTrack = localStream.current.getAudioTracks()[0]
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled
                setIsMuted(!audioTrack.enabled)
                console.log(audioTrack.enabled ? "🔊 Unmuted" : "🔇 Muted")
            }
        }
    }, [])

    // Initialize the call
    const startCall = useCallback(async () => {
        isCleanedUp.current = false
        setCallStatus(role === "caller" ? "ringing" : "connecting")
        setError(null)
        setCallDuration(0)

        try {
            // 1. Get microphone
            const stream = await getMicrophone()

            // 2. Create peer connection
            const pc = createPeerConnection(stream)

            // 3. Set up signaling channel
            const channelName = `call:${callChannelId}`
            console.log(`📡 Setting up signaling channel: ${channelName}`)

            const channel = supabaseRef.current.channel(channelName)

            channel
                .on("broadcast", { event: "webrtc_offer" }, ({ payload }) => {
                    if (payload.from !== userId) {
                        handleOffer(payload.sdp)
                    }
                })
                .on("broadcast", { event: "webrtc_answer" }, ({ payload }) => {
                    if (payload.from !== userId) {
                        handleAnswer(payload.sdp)
                    }
                })
                .on("broadcast", { event: "ice_candidate" }, ({ payload }) => {
                    if (payload.from !== userId) {
                        handleIceCandidate(payload.candidate)
                    }
                })
                .on("broadcast", { event: "call_ended" }, ({ payload }) => {
                    if (payload.userId !== userId) {
                        console.log("📵 Remote peer ended the call")
                        setCallStatus("ended")
                        onCallEnded?.() // Close modal immediately
                        cleanup()
                    }
                })
                .on("broadcast", { event: "call_accepted" }, () => {
                    // Caller receives this when the receiver accepts
                    if (role === "caller") {
                        console.log("✅ Receiver accepted! Sending offer...")
                        setTimeout(() => createAndSendOffer(), 500)
                    }
                })
                .on("broadcast", { event: "receiver_ready" }, () => {
                    // Caller receives this when receiver's signaling channel is ready
                    if (role === "caller") {
                        console.log("✅ Receiver ready on signaling channel, sending offer...")
                        setTimeout(() => createAndSendOffer(), 300)
                    }
                })
                .subscribe((status) => {
                    console.log(`📡 Signaling channel status: ${status}`)
                    if (status === "SUBSCRIBED") {
                        if (role === "receiver") {
                            // Tell the caller we're ready to receive the offer
                            console.log("📞 Receiver: signaling ready, notifying caller...")
                            channel.send({
                                type: "broadcast",
                                event: "receiver_ready",
                                payload: { from: userId },
                            })
                        }
                        // Caller waits for call_accepted / receiver_ready before sending offer
                    }
                })

            channelRef.current = channel
        } catch (err) {
            console.error("❌ Failed to start call:", err)
            setCallStatus("ended")
            cleanup()
        }
    }, [
        callChannelId,
        userId,
        role,
        getMicrophone,
        createPeerConnection,
        handleOffer,
        handleAnswer,
        handleIceCandidate,
        createAndSendOffer,
        cleanup,
        onCallEnded,
    ])

    // Toggle speaker
    const toggleSpeaker = useCallback(async () => {
        if (!remoteAudio.current) return

        try {
            const devices = await navigator.mediaDevices.enumerateDevices()
            const audioOutputs = devices.filter((device) => device.kind === "audiooutput")

            if (audioOutputs.length > 0) {
                // If currently on default/earpiece (which usually is default or first), try switching to the next one
                // Note: Without specific "speaker" label ID, we might just toggle between available outputs
                // For mobile, often 'speaker' is a specific sink ID if supported, or we just rely on system default.
                // Here we will toggle between the first two available outputs if > 1.

                // If we are "off" (false), we want to go "on" (true) -> switch to speaker
                // If we are "on" (true), we want to go "off" (false) -> switch to default/earpiece

                const targetDeviceId = !isSpeakerOn
                    ? audioOutputs[1]?.deviceId || audioOutputs[0].deviceId // Try second device (often speaker) or fallback to first
                    : audioOutputs[0].deviceId // Back to first/default


                if ("setSinkId" in remoteAudio.current) {
                    await (remoteAudio.current as any).setSinkId(targetDeviceId)
                    setIsSpeakerOn(!isSpeakerOn)
                    console.log(`🔊 Toggled speaker to ${targetDeviceId}`)
                } else {
                    console.warn("⚠️ setSinkId not supported on this browser")
                    // Still toggle state for UI feedback
                    setIsSpeakerOn(!isSpeakerOn)
                }
            } else {
                setIsSpeakerOn(!isSpeakerOn)
            }
        } catch (e) {
            console.error("Failed to toggle speaker:", e)
        }
    }, [isSpeakerOn])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanup()
        }
    }, [cleanup])

    return {
        callStatus,
        isMuted,
        isSpeakerOn,
        callDuration,
        error,
        startCall,
        endCall,
        toggleMute,
        toggleSpeaker,
    }
}
