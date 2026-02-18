"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, MicOff, Sparkles, X, ChevronRight, Activity, Command } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useToast } from "@/components/ui/use-toast"

// Extend Window interface for Web Speech API
declare global {
    interface Window {
        webkitSpeechRecognition: any
    }
}

export function VoiceAssistant() {
    const router = useRouter()
    const { toast } = useToast()
    const { setTheme, theme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [transcript, setTranscript] = useState("")
    const [aiResponse, setAiResponse] = useState("")

    const recognitionRef = useRef<any>(null)
    const shouldListenRef = useRef(false)
    const transcriptRef = useRef("")

    useEffect(() => {
        setMounted(true)
    }, [])

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== "undefined" && window.webkitSpeechRecognition) {
            const recognition = new window.webkitSpeechRecognition()
            recognition.continuous = false // Stop after each sentence to process
            recognition.interimResults = true
            recognition.lang = "en-US"

            recognition.onstart = () => {
                setIsListening(true)
                // Don't clear transcript/ref here, it causes flickering
            }

            recognition.onresult = (event: any) => {
                const current = event.resultIndex
                const transcriptText = event.results[current][0].transcript
                setTranscript(transcriptText)
                transcriptRef.current = transcriptText
            }

            recognition.onend = () => {
                const finalTranscript = transcriptRef.current.trim()

                if (finalTranscript) {
                    handleCommand(finalTranscript)
                }

                // Auto-restart if we are still in "listening mode"
                if (shouldListenRef.current) {
                    setTimeout(() => {
                        if (shouldListenRef.current) {
                            try {
                                recognition.start()
                            } catch (e) {
                                console.error("Restart error:", e)
                                setIsListening(false)
                            }
                        }
                    }, 100)
                } else {
                    setIsListening(false)
                }
            }

            recognition.onerror = (event: any) => {
                // Ignore 'no-speech' (just silence) or 'aborted' (manual stop)
                if (event.error === 'no-speech' || event.error === 'aborted') {
                    if (shouldListenRef.current && event.error === 'no-speech') {
                        return
                    }
                    return
                }

                // Network error: stop the loop entirely and notify the user
                if (event.error === 'network') {
                    shouldListenRef.current = false
                    setIsListening(false)
                    setAiResponse("Network unavailable. Please check your connection and try again.")
                    return
                }

                console.error("Speech recognition error", event.error)
                setIsListening(false)

                // Retry on other errors if we should be listening
                if (shouldListenRef.current) {
                    setTimeout(() => {
                        if (shouldListenRef.current) {
                            try {
                                recognition.start()
                            } catch (e) { console.error("Retry error:", e) }
                        }
                    }, 1000)
                }
            }

            recognitionRef.current = recognition
        }
    }, [])

    // Hotkey Listener (Ctrl + Space)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.code === "Space") {
                e.preventDefault()
                toggleListening()
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isOpen, isListening])

    const toggleListening = () => {
        if (!isOpen) {
            setIsOpen(true)
        }

        if (shouldListenRef.current) {
            // Stop listening
            shouldListenRef.current = false
            recognitionRef.current?.stop()
            setIsListening(false)
        } else {
            // Start listening
            setTranscript("")
            transcriptRef.current = ""
            shouldListenRef.current = true
            setAiResponse("Listening...")
            recognitionRef.current?.start()
        }
    }

    const handleCommand = async (text: string) => {
        setIsProcessing(true)
        try {
            const res = await fetch("/api/assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            })

            const data = await res.json()
            console.log("AI Command:", data)

            if (data.action === "navigate") {
                setAiResponse(`Navigating to ${data.page}...`)
                switch (data.page) {
                    case "dashboard": router.push("/dashboard"); break;
                    case "discover": router.push("/discover"); break;
                    case "connections": router.push("/connections"); break;
                    case "messages": router.push("/chat"); break;
                    case "profile": router.push("/profile"); break;
                    case "settings": router.push("/settings"); break;
                    case "help": router.push("/help-requests"); break;
                    case "sessions": router.push("/sessions"); break;
                    case "notifications": router.push("/notifications"); break;
                    case "home": router.push("/"); break;
                    case "back": router.back(); break;
                    default: setAiResponse(`Unknown page: ${data.page}`);
                }
            } else if (data.action === "search") {
                setAiResponse(`Searching for "${data.query}"...`)
                router.push(`/discover?q=${encodeURIComponent(data.query)}`)
            } else if (data.action === "theme") {
                if (data.mode === "toggle") {
                    setTheme(theme === "dark" ? "light" : "dark")
                    setAiResponse("Theme toggled")
                } else {
                    setTheme(data.mode)
                    setAiResponse(`Switched to ${data.mode} mode`)
                }
            } else if (data.action === "scroll") {
                const direction = data.direction
                setAiResponse(`Scrolling ${direction}...`)
                if (direction === "top") {
                    window.scrollTo({ top: 0, behavior: "smooth" })
                } else if (direction === "bottom") {
                    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
                } else if (direction === "up") {
                    window.scrollBy({ top: -500, behavior: "smooth" })
                } else if (direction === "down") {
                    window.scrollBy({ top: 500, behavior: "smooth" })
                }
            } else if (data.action === "type") {
                setAiResponse(`Typing "${data.text}"...`)
                const activeElement = document.activeElement as HTMLElement
                if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
                    const input = activeElement as HTMLInputElement | HTMLTextAreaElement
                    const start = input.selectionStart || 0
                    const end = input.selectionEnd || 0
                    const currentValue = input.value
                    const newValue = currentValue.substring(0, start) + data.text + currentValue.substring(end)

                    input.value = newValue

                    // Restore cursor position after inserted text
                    const newCursorPos = start + data.text.length
                    input.setSelectionRange(newCursorPos, newCursorPos)

                    // Dispatch events to trigger React state updates
                    input.dispatchEvent(new Event('input', { bubbles: true }))
                    input.dispatchEvent(new Event('change', { bubbles: true }))

                    toast({ title: "Typed", description: data.text })
                } else {
                    setAiResponse("Please click on an input field first.")
                    toast({ title: "Error", description: "Select an input field to type.", variant: "destructive" })
                }
            } else if (data.action === "view_profile") {
                setAiResponse(`Opening profile for ${data.name}...`)
                const name = data.name.toLowerCase()

                // Find all potential name elements
                const elements = Array.from(document.querySelectorAll('h3, span, div, p'))
                const targetElement = elements.find(el => el.textContent?.toLowerCase().includes(name))

                if (targetElement) {
                    // Traverse up to find the card container (e.g., closest div with class usually, or just 5 levels up)
                    let parent = targetElement.parentElement
                    let foundButton = false

                    // Search in the vicinity (up to 5 levels up)
                    for (let i = 0; i < 5; i++) {
                        if (!parent) break

                        // Look for "View Profile" button inside this parent
                        const buttons = Array.from(parent.querySelectorAll('button'))
                        const viewProfileBtn = buttons.find(btn => btn.textContent?.toLowerCase().includes('view profile'))

                        if (viewProfileBtn) {
                            viewProfileBtn.click()
                            foundButton = true
                            toast({ title: "Success", description: `Opened profile for ${data.name}` })
                            break
                        }
                        parent = parent.parentElement
                    }

                    if (!foundButton) {
                        setAiResponse(`Found ${data.name}, but couldn't open profile.`)
                        toast({ title: "Error", description: "Profile button not found.", variant: "destructive" })
                    }
                } else {
                    setAiResponse(`Could not find user "${data.name}" on this page.`)
                    toast({ title: "Not Found", description: "User not visible on screen.", variant: "destructive" })
                }

            } else if (data.action === "open_chatbot") {
                setAiResponse("Opening AI Assistant...")
                window.dispatchEvent(new Event("open-chatbot"))

            } else if (data.action === "click") {
                setAiResponse(`Clicking "${data.text}"...`)
                const text = data.text.toLowerCase()
                const buttons = Array.from(document.querySelectorAll('button, a'))

                // Prioritize exact matches, then partial
                let target = buttons.find(b => b.textContent?.trim().toLowerCase() === text)
                if (!target) {
                    target = buttons.find(b => b.textContent?.toLowerCase().includes(text))
                }

                if (target) {
                    (target as HTMLElement).click()
                    toast({ title: "Clicked", description: data.text })
                } else {
                    setAiResponse(`Could not find button "${data.text}".`)
                }

            } else if (data.action === "explain") {
                setAiResponse(data.response)
            } else {
                setAiResponse("I'm not sure how to do that yet.")
            }

        } catch (error) {
            console.error("Error processing command:", error)
            setAiResponse("Something went wrong.")
        } finally {
            setIsProcessing(false)
            // Clear transcript for next command
            setTranscript("")
            transcriptRef.current = ""
        }
    }

    if (!mounted) return null

    if (typeof window !== "undefined" && !window.webkitSpeechRecognition) {
        return null // Return null if speech recognition is not supported
    }

    return (
        <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-4 pointer-events-none">
            <div className="pointer-events-auto">
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.9 }}
                            className="mb-4 w-80 p-4 rounded-2xl bg-background/80 backdrop-blur-xl border border-primary/20 shadow-2xl overflow-hidden relative"
                        >
                            {/* Neon Glow Background */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-purple-500/10 to-blue-500/10 z-0" />

                            {/* Header */}
                            <div className="relative z-10 flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                                    <span className="text-sm font-semibold text-foreground/80">AI Voice Assistant</span>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Transcript Area */}
                            <div className="relative z-10 min-h-[60px] flex items-center justify-center text-center">
                                {transcript ? (
                                    <p className="text-lg font-medium text-foreground">{transcript}</p>
                                ) : isListening ? (
                                    <div className="flex items-center gap-1 h-6">
                                        {[...Array(5)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                className="w-1 bg-primary rounded-full"
                                                animate={{ height: [4, 16, 4] }}
                                                transition={{
                                                    duration: 0.5,
                                                    repeat: Infinity,
                                                    delay: i * 0.1
                                                }}
                                            />
                                        ))}
                                    </div>
                                ) : aiResponse ? (
                                    <p className="text-sm text-primary font-medium">{aiResponse}</p>
                                ) : (
                                    <p className="text-sm text-muted-foreground">"Go to dashboard..."</p>
                                )}
                            </div>

                            {/* Processing State */}
                            {isProcessing && (
                                <div className="relative z-10 mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                    <Activity className="w-3 h-3 animate-spin" />
                                    Processing...
                                </div>
                            )}

                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Floating Orb Mic Button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleListening}
                    className="relative w-16 h-16 rounded-full flex items-center justify-center transition-all group z-50"
                >
                    {/* The Glowing Orb Background */}
                    <div className="relative flex h-full w-full items-center justify-center">
                        {/* Core Gradient - Changes based on state */}
                        <div className={cn(
                            "absolute inset-0 rounded-full opacity-90 blur-sm transition-all duration-500",
                            isListening
                                ? "bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500"
                                : "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
                        )} />

                        {/* Inner Glow/Highlight */}
                        <div className="absolute inset-[2px] rounded-full bg-black/40 backdrop-blur-sm" />

                        {/* Pulse Effect - Active when listening */}
                        {isListening && (
                            <motion.div
                                className="absolute -inset-4 rounded-full bg-red-500/30 blur-xl"
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.5, 0.8, 0.5]
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />
                        )}

                        {/* Idle Pulse - Slower */}
                        {!isListening && (
                            <motion.div
                                className="absolute -inset-4 rounded-full bg-indigo-500/20 blur-xl"
                                animate={{
                                    scale: [1, 1.1, 1],
                                    opacity: [0.3, 0.6, 0.3]
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />
                        )}

                        {/* Icon */}
                        <div className="relative z-10">
                            {isListening ? (
                                <Mic className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse" />
                            ) : (
                                <Mic className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                            )}
                        </div>

                        {/* Orbiting particles (optional, keeps it alive) */}
                        <motion.div
                            className="absolute inset-0 rounded-full border border-white/20"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        >
                            <div className="absolute top-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_10px_white]" />
                        </motion.div>
                    </div>

                    {/* Status Indicator Dot (if needed, but orb color usually enough) */}
                    {!isOpen && !isListening && (
                        <span className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background z-20" />
                    )}
                </motion.button>
            </div>
        </div>
    )
}
