"use client"

import { useEffect, useState, useCallback } from "react"
import {
    useDaily,
    useDailyEvent,
    DailyProvider,
    useLocalParticipant,
    useParticipantIds,
    useScreenShare,
} from "@daily-co/daily-react"
import DailyIframe from "@daily-co/daily-js"
import { Loader2, Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, MonitorOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

// Sub-component for individual video tile
const VideoTile = ({ id, isLocal }: { id: string, isLocal?: boolean }) => {
    const daily = useDaily()
    const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | null>(null)
    const [audioTrack, setAudioTrack] = useState<MediaStreamTrack | null>(null)

    useDailyEvent(
        "track-started",
        useCallback((ev) => {
            if (ev.participant && ev.participant.session_id === id) {
                if (ev.track.kind === "video") setVideoTrack(ev.track)
                if (ev.track.kind === "audio") setAudioTrack(ev.track)
            }
        }, [id])
    )

    // Use simple ref approach or just useEffect to attach track
    useEffect(() => {
        const videoEl = document.getElementById(`video-${id}`) as HTMLVideoElement
        if (videoEl && videoTrack) {
            videoEl.srcObject = new MediaStream([videoTrack])
        }
    }, [videoTrack, id])

    useEffect(() => {
        if (isLocal) return // Local audio shouldn't proceed
        const audioEl = document.getElementById(`audio-${id}`) as HTMLAudioElement
        if (audioEl && audioTrack) {
            audioEl.srcObject = new MediaStream([audioTrack])
        }
    }, [audioTrack, id, isLocal])

    return (
        <div className="relative bg-muted rounded-lg overflow-hidden aspect-video shadow-sm">
            <video
                id={`video-${id}`}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
            />
            {!isLocal && <audio id={`audio-${id}`} autoPlay />}
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {isLocal ? "You" : "Participant"}
            </div>
        </div>
    )
}


const CallControls = () => {
    const daily = useDaily()
    const localParticipant = useLocalParticipant()
    const { isSharingScreen, startScreenShare, stopScreenShare } = useScreenShare()
    const router = useRouter()

    const toggleAudio = () => {
        if (!daily) return
        daily.setLocalAudio(!localParticipant?.audio)
    }

    const toggleVideo = () => {
        if (!daily) return
        daily.setLocalVideo(!localParticipant?.video)
    }

    const leaveCall = () => {
        if (!daily) return
        daily.leave()
        router.push("/sessions")
    }

    return (
        <div className="flex items-center gap-4 bg-background/90 backdrop-blur p-4 rounded-full shadow-lg border">
            <Button
                variant={localParticipant?.audio ? "outline" : "destructive"}
                size="icon"
                onClick={toggleAudio}
                className="rounded-full"
            >
                {localParticipant?.audio ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>

            <Button
                variant={localParticipant?.video ? "outline" : "destructive"}
                size="icon"
                onClick={toggleVideo}
                className="rounded-full"
            >
                {localParticipant?.video ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </Button>

            <Button
                variant={isSharingScreen ? "destructive" : "outline"}
                size="icon"
                onClick={isSharingScreen ? stopScreenShare : startScreenShare}
                className="rounded-full"
            >
                {isSharingScreen ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
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
    )
}

const CallContent = () => {
    const participantIds = useParticipantIds()
    const localId = useLocalParticipant()?.session_id

    // Filter out local so we display it separately or grid style
    // Actually grid style is best

    return (
        <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto w-full h-[calc(100vh-100px)] min-h-[500px]">
            {participantIds.map(id => (
                <VideoTile key={id} id={id} isLocal={id === localId} />
            ))}
            {participantIds.length === 0 && (
                <div className="flex items-center justify-center col-span-full h-full text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="ml-2">Connecting...</span>
                </div>
            )}
        </div>
    )
}

export function VideoRoom({ url }: { url: string }) {
    const [callObject, setCallObject] = useState<any>(null)

    useEffect(() => {
        if (!url) return

        const newCallObject = DailyIframe.createCallObject({
            url,
            dailyConfig: {
                experimentalChromeVideoMuteLightOff: true,
            }
        })

        setCallObject(newCallObject)

        newCallObject.join({ url })

        return () => {
            newCallObject.leave()
            newCallObject.destroy()
        }
    }, [url])

    if (!callObject) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
                <Loader2 className="w-8 h-8 animate-spin mr-2" />
                Setting up call...
            </div>
        )
    }

    return (
        <DailyProvider callObject={callObject}>
            <div className="flex flex-col min-h-screen bg-background">
                <header className="p-4 border-b flex justify-between items-center">
                    <h1 className="text-xl font-bold">Session Call</h1>
                </header>

                <CallContent />

                <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
                    <CallControls />
                </div>
            </div>
        </DailyProvider>
    )
}
