"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Camera, RefreshCw, Check, X, SwitchCamera } from "lucide-react"
import { cn } from "@/lib/utils"

interface CameraCaptureProps {
    onCapture: (blob: Blob) => void
    onCancel: () => void
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [image, setImage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [facingMode, setFacingMode] = useState<"user" | "environment">("user")
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([])

    const startCamera = useCallback(async () => {
        try {
            if (stream) {
                stream.getTracks().forEach(track => track.stop())
            }
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facingMode }
            })
            setStream(newStream)
            if (videoRef.current) {
                videoRef.current.srcObject = newStream
            }
            setError(null)
        } catch (err) {
            console.error("Error accessing camera:", err)
            setError("Could not access camera. Please allow permissions.")
        }
    }, [facingMode])

    useEffect(() => {
        startCamera()
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop())
            }
        }
    }, [startCamera])

    // Get available video devices to show switch camera button if applicable
    useEffect(() => {
        const getDevices = async () => {
            const devs = await navigator.mediaDevices.enumerateDevices()
            setDevices(devs.filter(d => d.kind === 'videoinput'))
        }
        getDevices()
    }, [])


    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current
            const canvas = canvasRef.current

            // Set canvas size to match video
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight

            const ctx = canvas.getContext('2d')
            if (ctx) {
                // If front facing (user), flip horizontally for mirror effect
                if (facingMode === 'user') {
                    ctx.translate(canvas.width, 0)
                    ctx.scale(-1, 1)
                }

                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
                setImage(dataUrl)
            }
        }
    }

    const handleRetake = () => {
        setImage(null)
    }

    const handleConfirm = async () => {
        if (image) {
            // Convert Data URL to Blob
            const res = await fetch(image)
            const blob = await res.blob()
            onCapture(blob)
        }
    }

    const handleSwitchCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-background rounded-xl overflow-hidden max-w-md w-full shadow-2xl animate-in zoom-in-95">
                <div className="relative aspect-[3/4] bg-black">
                    {image ? (
                        <img src={image} alt="Taken photo" className="w-full h-full object-contain" />
                    ) : (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className={cn("w-full h-full object-cover", facingMode === 'user' && "scale-x-[-1]")}
                            />
                            <canvas ref={canvasRef} className="hidden" />

                            {error && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white p-4 text-center">
                                    <p>{error}</p>
                                </div>
                            )}

                            {!image && devices.length > 1 && (
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="absolute top-4 right-4 rounded-full bg-black/20 text-white hover:bg-black/40 border-none"
                                    onClick={handleSwitchCamera}
                                >
                                    <SwitchCamera className="w-5 h-5" />
                                </Button>
                            )}
                        </>
                    )}
                </div>

                <div className="p-4 flex items-center justify-between gap-4">
                    {image ? (
                        <>
                            <Button variant="outline" onClick={handleRetake} className="flex-1">
                                <RefreshCw className="mr-2 w-4 h-4" /> Retake
                            </Button>
                            <Button onClick={handleConfirm} className="flex-1">
                                <Check className="mr-2 w-4 h-4" /> Send
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" size="icon" onClick={onCancel}>
                                <X className="w-6 h-6" />
                            </Button>
                            <Button
                                size="lg"
                                className="h-16 w-16 rounded-full border-4 border-background p-1"
                                variant="outline"
                                onClick={handleCapture}
                            >
                                <div className="w-full h-full bg-primary rounded-full" />
                            </Button>
                            <div className="w-10" /> {/* Spacer for centering */}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
