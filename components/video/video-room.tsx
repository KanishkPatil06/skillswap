"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, MonitorOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

// Free STUN servers for NAT traversal
const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
    ],
}

type SignalPayload =
    | { type: "offer"; sdp: string; from: string }
    | { type: "answer"; sdp: string; from: string }
    | { type: "ice-candidate"; candidate: RTCIceCandidateInit; from: string }
    | { type: "join"; from: string }
    | { type: "leave"; from: string }

export function VideoRoom({ sessionId }: { sessionId: string }) {
    const router = useRouter()
    const supabase = createClient()

    // Media refs
    const localVideoRef = useRef<HTMLVideoElement>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>(null)
    const screenVideoRef = useRef<HTMLVideoElement>(null)
    const remoteStreamRef = useRef<MediaStream | null>(null)

    // WebRTC refs (use refs to avoid stale closures)
    const pcRef = useRef<RTCPeerConnection | null>(null)
    const localStreamRef = useRef<MediaStream | null>(null)
    const channelRef = useRef<any>(null)
    const myIdRef = useRef<string>("")
    const makingOfferRef = useRef(false)
    const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([])

    // UI state
    const [audioEnabled, setAudioEnabled] = useState(true)
    const [videoEnabled, setVideoEnabled] = useState(true)
    const [isScreenSharing, setIsScreenSharing] = useState(false)
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
    const [connectionState, setConnectionState] = useState<string>("initializing")
    const [remoteConnected, setRemoteConnected] = useState(false)

    // ── Cleanup helper ──────────────────────────────────────────────────
    const cleanup = useCallback(() => {
        localStreamRef.current?.getTracks().forEach(t => t.stop())
        screenStream?.getTracks().forEach(t => t.stop())
        pcRef.current?.close()
        pcRef.current = null
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current)
            channelRef.current = null
        }
    }, [screenStream, supabase])

    // ── Main effect: set up media, signaling, and WebRTC ────────────────
    useEffect(() => {
        let cancelled = false

        const init = async () => {
            // 1. Get user ID
            const { data: { user } } = await supabase.auth.getUser()
            if (!user || cancelled) return
            myIdRef.current = user.id

            // 2. Get local media
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                })
                if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
                localStreamRef.current = stream
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream
                }
            } catch (err) {
                console.error("Media access error:", err)
                toast.error("Could not access camera/microphone. Check permissions.")
                if (cancelled) return
                setConnectionState("media-error")
                return
            }

            // 3. Create RTCPeerConnection
            const pc = new RTCPeerConnection(ICE_SERVERS)
            pcRef.current = pc

            // Add local tracks to the connection
            localStreamRef.current!.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current!)
            })

            // Handle incoming remote tracks
            pc.ontrack = (event) => {
                if (event.streams[0]) {
                    remoteStreamRef.current = event.streams[0]
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = event.streams[0]
                        // Force play in case autoplay is blocked
                        remoteVideoRef.current.play().catch(() => { })
                    }
                    setRemoteConnected(true)
                }
            }

            // Connection state changes
            pc.onconnectionstatechange = () => {
                setConnectionState(pc.connectionState)
                if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
                    setRemoteConnected(false)
                    toast.error("Peer disconnected")
                }
                if (pc.connectionState === "connected") {
                    toast.success("Peer connected!")
                }
            }

            // 4. Set up Supabase Realtime channel for signaling
            const channelName = `video-room-${sessionId}`
            const channel = supabase.channel(channelName, {
                config: { broadcast: { self: false } },
            })

            channelRef.current = channel

            // Handle ICE candidates: send to remote via channel
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    channel.send({
                        type: "broadcast",
                        event: "signal",
                        payload: {
                            type: "ice-candidate",
                            candidate: event.candidate.toJSON(),
                            from: myIdRef.current,
                        } as SignalPayload,
                    })
                }
            }

            // Listen for signaling messages
            channel.on("broadcast", { event: "signal" }, async ({ payload }: { payload: SignalPayload }) => {
                if (!pcRef.current) return
                if (payload.from === myIdRef.current) return // Ignore own messages

                try {
                    if (payload.type === "join") {
                        // A new peer joined — the "polite" peer (alphabetically smaller ID) creates the offer
                        // This prevents both sides from creating conflicting offers
                        if (myIdRef.current < payload.from) {
                            console.log("📞 I'm the polite peer — creating offer")
                            await createOffer()
                        } else {
                            console.log("📞 Remote is the polite peer — waiting for their offer")
                        }
                    } else if (payload.type === "offer") {
                        // Received an offer — set remote description and create answer
                        await pcRef.current.setRemoteDescription(
                            new RTCSessionDescription({ type: "offer", sdp: payload.sdp })
                        )
                        // Flush any pending ICE candidates
                        for (const c of pendingCandidatesRef.current) {
                            await pcRef.current.addIceCandidate(new RTCIceCandidate(c))
                        }
                        pendingCandidatesRef.current = []

                        const answer = await pcRef.current.createAnswer()
                        await pcRef.current.setLocalDescription(answer)
                        channel.send({
                            type: "broadcast",
                            event: "signal",
                            payload: {
                                type: "answer",
                                sdp: answer.sdp!,
                                from: myIdRef.current,
                            } as SignalPayload,
                        })
                    } else if (payload.type === "answer") {
                        // Received an answer to our offer
                        await pcRef.current.setRemoteDescription(
                            new RTCSessionDescription({ type: "answer", sdp: payload.sdp })
                        )
                        // Flush any pending ICE candidates
                        for (const c of pendingCandidatesRef.current) {
                            await pcRef.current.addIceCandidate(new RTCIceCandidate(c))
                        }
                        pendingCandidatesRef.current = []
                    } else if (payload.type === "ice-candidate") {
                        if (pcRef.current.remoteDescription) {
                            await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate))
                        } else {
                            // Queue candidate until remote description is set
                            pendingCandidatesRef.current.push(payload.candidate)
                        }
                    } else if (payload.type === "leave") {
                        setRemoteConnected(false)
                        if (remoteVideoRef.current) {
                            remoteVideoRef.current.srcObject = null
                        }
                        toast.info("The other participant has left the call.")
                    }
                } catch (err) {
                    console.error("Signaling error:", err)
                }
            })

            // Subscribe and announce join — re-announce periodically to handle timing
            channel.subscribe((status: string) => {
                if (status === "SUBSCRIBED") {
                    setConnectionState("waiting")
                    // Announce join immediately
                    channel.send({
                        type: "broadcast",
                        event: "signal",
                        payload: { type: "join", from: myIdRef.current } as SignalPayload,
                    })
                    // Re-announce every 2 seconds for 10 seconds (in case the other peer hasn't subscribed yet)
                    const joinInterval = setInterval(() => {
                        if (pcRef.current?.connectionState === "connected") {
                            clearInterval(joinInterval)
                            return
                        }
                        channel.send({
                            type: "broadcast",
                            event: "signal",
                            payload: { type: "join", from: myIdRef.current } as SignalPayload,
                        })
                    }, 2000)
                    // Stop retrying after 10 seconds
                    setTimeout(() => clearInterval(joinInterval), 10000)
                }
            })
        }

        // Helper: create an SDP offer and send it
        const createOffer = async () => {
            const pc = pcRef.current
            const channel = channelRef.current
            if (!pc || !channel || makingOfferRef.current) return

            try {
                makingOfferRef.current = true
                const offer = await pc.createOffer()
                await pc.setLocalDescription(offer)
                channel.send({
                    type: "broadcast",
                    event: "signal",
                    payload: {
                        type: "offer",
                        sdp: offer.sdp!,
                        from: myIdRef.current,
                    } as SignalPayload,
                })
            } catch (err) {
                console.error("Offer creation error:", err)
            } finally {
                makingOfferRef.current = false
            }
        }

        init()

        return () => {
            cancelled = true
            // Announce leave
            if (channelRef.current) {
                channelRef.current.send({
                    type: "broadcast",
                    event: "signal",
                    payload: { type: "leave", from: myIdRef.current },
                })
            }
            localStreamRef.current?.getTracks().forEach(t => t.stop())
            pcRef.current?.close()
            pcRef.current = null
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current)
                channelRef.current = null
            }
        }
    }, [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

    // ── Controls ─────────────────────────────────────────────────────────
    const toggleAudio = () => {
        localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
        setAudioEnabled(prev => !prev)
    }

    const toggleVideo = () => {
        localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
        setVideoEnabled(prev => !prev)
    }

    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            screenStream?.getTracks().forEach(t => t.stop())
            setScreenStream(null)
            setIsScreenSharing(false)

            // Replace screen track with camera track in the peer connection
            const videoTrack = localStreamRef.current?.getVideoTracks()[0]
            if (videoTrack && pcRef.current) {
                const sender = pcRef.current.getSenders().find(s => s.track?.kind === "video")
                sender?.replaceTrack(videoTrack)
            }
            return
        }

        try {
            const display = await navigator.mediaDevices.getDisplayMedia({ video: true })
            setScreenStream(display)
            setIsScreenSharing(true)

            // Replace camera track with screen track in the peer connection
            const screenTrack = display.getVideoTracks()[0]
            if (pcRef.current) {
                const sender = pcRef.current.getSenders().find(s => s.track?.kind === "video")
                sender?.replaceTrack(screenTrack)
            }

            if (screenVideoRef.current) {
                screenVideoRef.current.srcObject = display
            }

            screenTrack.onended = () => {
                setScreenStream(null)
                setIsScreenSharing(false)
                const videoTrack = localStreamRef.current?.getVideoTracks()[0]
                if (videoTrack && pcRef.current) {
                    const sender = pcRef.current.getSenders().find(s => s.track?.kind === "video")
                    sender?.replaceTrack(videoTrack)
                }
            }
        } catch {
            toast.error("Screen sharing was cancelled or not available.")
        }
    }

    const leaveCall = () => {
        if (channelRef.current) {
            channelRef.current.send({
                type: "broadcast",
                event: "signal",
                payload: { type: "leave", from: myIdRef.current },
            })
        }
        cleanup()
        router.push("/sessions")
    }

    // ── Status label ─────────────────────────────────────────────────────
    const statusLabel = () => {
        switch (connectionState) {
            case "initializing": return "Setting up..."
            case "media-error": return "Camera/mic error"
            case "waiting": return "Waiting for participant..."
            case "connecting": return "Connecting..."
            case "connected": return "Connected"
            case "disconnected": return "Disconnected"
            case "failed": return "Connection failed"
            default: return connectionState
        }
    }

    // ── Render ────────────────────────────────────────────────────────────
    if (connectionState === "initializing") {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
                <Loader2 className="w-8 h-8 animate-spin mr-2" />
                Setting up call...
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Header */}
            <header className="p-4 border-b flex justify-between items-center">
                <h1 className="text-xl font-bold">Session Call</h1>
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full ${remoteConnected
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${remoteConnected ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`} />
                        {statusLabel()}
                    </span>
                </div>
            </header>

            {/* Video grid */}
            <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto w-full h-[calc(100vh-100px)] min-h-[500px]">
                {/* Local video — always rendered, hidden via CSS when camera is off */}
                <div className="relative bg-muted rounded-lg overflow-hidden aspect-video shadow-sm">
                    <video
                        ref={(el) => {
                            (localVideoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el
                            if (el && localStreamRef.current) {
                                el.srcObject = localStreamRef.current
                                el.play().catch(() => { })
                            }
                        }}
                        autoPlay
                        muted
                        playsInline
                        className={`w-full h-full object-cover scale-x-[-1] ${videoEnabled ? '' : 'invisible'}`}
                    />
                    {!videoEnabled && (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                            <VideoOff className="w-12 h-12" />
                        </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        You
                    </div>
                </div>

                {/* Remote video — always rendered, overlay shown when waiting */}
                <div className="relative bg-muted rounded-lg overflow-hidden aspect-video shadow-sm">
                    <video
                        ref={(el) => {
                            (remoteVideoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el
                            if (el && remoteStreamRef.current) {
                                el.srcObject = remoteStreamRef.current
                                el.play().catch(() => { })
                            }
                        }}
                        autoPlay
                        playsInline
                        className={`w-full h-full object-cover ${remoteConnected ? '' : 'invisible'}`}
                    />
                    {!remoteConnected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-muted-foreground p-6">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                                <p className="text-lg font-medium mb-1">Waiting for participant...</p>
                                <p className="text-sm">They&apos;ll appear here when they join</p>
                            </div>
                        </div>
                    )}
                    {remoteConnected && (
                        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            Participant
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-4 bg-background/90 backdrop-blur p-4 rounded-full shadow-lg border">
                    <Button
                        variant={audioEnabled ? "outline" : "destructive"}
                        size="icon"
                        onClick={toggleAudio}
                        className="rounded-full"
                    >
                        {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    </Button>

                    <Button
                        variant={videoEnabled ? "outline" : "destructive"}
                        size="icon"
                        onClick={toggleVideo}
                        className="rounded-full"
                    >
                        {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                    </Button>

                    <Button
                        variant={isScreenSharing ? "destructive" : "outline"}
                        size="icon"
                        onClick={toggleScreenShare}
                        className="rounded-full"
                    >
                        {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                    </Button>

                    <Button
                        variant="destructive"
                        size="icon"
                        onClick={leaveCall}
                        className="rounded-full px-6 w-auto"
                    >
                        <PhoneOff className="w-5 h-5 mr-2" />
                        Leave
                    </Button>
                </div>
            </div>
        </div>
    )
}
