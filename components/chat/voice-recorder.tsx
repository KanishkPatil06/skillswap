"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square, Trash2, Send, Play, Pause } from "lucide-react"
import { cn } from "@/lib/utils"

interface VoiceRecorderProps {
    onSend: (audioBlob: Blob) => void
    onCancel: () => void
}

export function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const isMounted = useRef(true)

    useEffect(() => {
        isMounted.current = true
        startRecording()
        return () => {
            isMounted.current = false
            stopRecordingCleanup()
        }
    }, [])

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            if (!isMounted.current) {
                stream.getTracks().forEach(track => track.stop())
                return
            }

            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data)
                }
            }

            mediaRecorder.onstop = () => {
                if (!isMounted.current) return

                const blob = new Blob(chunksRef.current, { type: "audio/webm" })
                setAudioBlob(blob)
                setAudioUrl(URL.createObjectURL(blob))
                setIsRecording(false)

                if (timerRef.current) {
                    clearInterval(timerRef.current)
                    timerRef.current = null
                }

                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            if (isMounted.current) setIsRecording(true)

            // Clear any existing timer
            if (timerRef.current) clearInterval(timerRef.current)

            timerRef.current = setInterval(() => {
                if (isMounted.current) {
                    setRecordingTime(prev => prev + 1)
                }
            }, 1000)

        } catch (err) {
            console.error("Error accessing microphone:", err)
            if (isMounted.current) onCancel()
        }
    }

    const stopRecordingCleanup = () => {
        // Clear timer first
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }

        // Stop recorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop()
        } else {
            // If already stopped or never started, allow UI generated state to clear
            if (isMounted.current) setIsRecording(false)
        }
    }

    const handleStop = () => {
        stopRecordingCleanup()
    }

    const handleSend = () => {
        if (audioBlob) {
            onSend(audioBlob)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const togglePlayback = () => {
        if (!audioRef.current || !audioUrl) return

        if (isPlaying) {
            audioRef.current.pause()
        } else {
            audioRef.current.play()
        }
        setIsPlaying(!isPlaying)
    }

    return (
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg animate-in slide-in-from-bottom-2 w-full">
            {isRecording ? (
                <>
                    <div className="flex items-center gap-2 flex-1">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
                        <div className="h-8 flex-1 bg-background/50 rounded overflow-hidden flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">Recording...</span>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onCancel} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" onClick={handleStop} className="bg-red-500 hover:bg-red-600 text-white">
                        <Square className="w-4 h-4 fill-current" />
                    </Button>
                </>
            ) : (
                <>
                    <Button variant="ghost" size="icon" onClick={onCancel} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                    </Button>

                    {audioUrl && (
                        <div className="flex items-center gap-2 flex-1">
                            <audio
                                ref={audioRef}
                                src={audioUrl}
                                onEnded={() => setIsPlaying(false)}
                                className="hidden"
                            />
                            <Button variant="secondary" size="icon" onClick={togglePlayback} className="h-8 w-8 rounded-full">
                                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                            </Button>
                            <div className="h-1 flex-1 bg-muted-foreground/20 rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-full animate-[progress_linear] origin-left" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }} />
                            </div>
                            <span className="text-xs font-mono">{formatTime(recordingTime)}</span>
                        </div>
                    )}

                    <Button size="icon" onClick={handleSend} className="bg-primary hover:bg-primary/90">
                        <Send className="w-4 h-4" />
                    </Button>
                </>
            )}
        </div>
    )
}
