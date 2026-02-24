"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Bot, X, Send, Minimize2, Sparkles, Loader2,
    Mic, MicOff, Activity, Volume2, VolumeX,
    MessageSquare, Waves
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChatbotMessage } from "../chatbot/chatbot-message"
import { OrbAssistant } from "@/components/ui/orb-assistant"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useToast } from "@/components/ui/use-toast"
import { speak, stop as stopSpeech } from "@/lib/tts"
import { cn } from "@/lib/utils"

interface Message {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: Date
    isError?: boolean
}

const INITIAL_MESSAGE: Message = {
    id: "welcome",
    role: "assistant",
    content: "Hi! I'm your SkillSwap AI Assistant. I can help you navigate the platform, answer questions about skills, and guide you on how to connect with others. How can I help you today?",
    timestamp: new Date()
}

// Extend Window interface for Web Speech API
declare global {
    interface Window {
        webkitSpeechRecognition: any
    }
}

export function UnifiedAIAssistant() {
    const router = useRouter()
    const { toast } = useToast()
    const { setTheme, theme } = useTheme()

    // UI States
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [activeTab, setActiveTab] = useState("chat")

    // Chat States
    const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Voice States
    const [isListening, setIsListening] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [transcript, setTranscript] = useState("")
    const [aiResponse, setAiResponse] = useState("")
    const [voiceEnabled, setVoiceEnabled] = useState(true)
    const voiceEnabledRef = useRef(true)

    // Speech Refs
    const recognitionRef = useRef<any>(null)
    const shouldListenRef = useRef(false)
    const transcriptRef = useRef("")

    // Scroll to bottom when messages change
    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [])

    useEffect(() => {
        if (activeTab === "chat") {
            // Small delay to ensure DOM is updated
            const timer = setTimeout(scrollToBottom, 100)
            return () => clearTimeout(timer)
        }
    }, [messages, isLoading, activeTab, scrollToBottom])

    useEffect(() => {
        if (isOpen && !isMinimized && activeTab === "chat" && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen, isMinimized, activeTab])

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== "undefined" && window.webkitSpeechRecognition) {
            const recognition = new window.webkitSpeechRecognition()
            recognition.continuous = false
            recognition.interimResults = true
            recognition.lang = "en-US"

            recognition.onstart = () => setIsListening(true)

            recognition.onresult = (event: any) => {
                const current = event.resultIndex
                const result = event.results[current]
                const transcriptText = result[0].transcript

                setTranscript(transcriptText)
                transcriptRef.current = transcriptText

                if (result.isFinal) {
                    recognition.stop()
                    handleVoiceCommand(transcriptText)
                }
            }

            recognition.onend = () => {
                // Modified: Only restart if specifically requested or if we are in a continuous mode
                // For now, we follow user request to stop after command.
                if (shouldListenRef.current && transcriptRef.current === "") {
                    setTimeout(() => {
                        if (shouldListenRef.current) {
                            try { recognition.start() } catch (e) { setIsListening(false) }
                        }
                    }, 100)
                } else {
                    setIsListening(false)
                    shouldListenRef.current = false
                }
            }

            recognition.onerror = (event: any) => {
                if (event.error === 'no-speech' || event.error === 'aborted') {
                    if (shouldListenRef.current && event.error === 'no-speech') return
                    return
                }
                console.error("Speech Recognition Error:", event.error)
                setIsListening(false)
            }

            recognitionRef.current = recognition
        }
    }, [])

    // Voice Toggle
    const toggleListening = () => {
        if (shouldListenRef.current) {
            shouldListenRef.current = false
            recognitionRef.current?.stop()
            setIsListening(false)
        } else {
            setTranscript("")
            transcriptRef.current = ""
            shouldListenRef.current = true
            setAiResponse("Listening...")
            recognitionRef.current?.start()
        }
    }

    // Voice Command Handler (Unified with existing logic)
    const handleVoiceCommand = async (text: string) => {
        if (!text.trim() || isProcessing) return
        setIsProcessing(true)

        const lower = text.toLowerCase().trim()

        // Voice toggle commands
        if (lower.includes("turn on voice") || lower.includes("unmute")) {
            setVoiceEnabled(true)
            setAiResponse("Voice enabled ✓")
            setIsProcessing(false)
            return
        }
        if (lower.includes("turn off voice") || lower.includes("mute")) {
            setVoiceEnabled(false)
            stopSpeech()
            setAiResponse("Voice muted ✓")
            setIsProcessing(false)
            return
        }

        try {
            const res = await fetch("/api/assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            })

            const data = await res.json()

            if (data.action === "navigate") {
                setAiResponse(`Navigating to ${data.page}...`)
                if (voiceEnabled) speak(`Navigating to ${data.page}`)
                router.push(data.page === "back" ? "back" : `/${data.page === "home" ? "" : data.page}`)
                if (data.page === "back") router.back()
            } else if (data.action === "theme") {
                const newTheme = data.mode === "toggle" ? (theme === "dark" ? "light" : "dark") : data.mode
                setTheme(newTheme)
                setAiResponse(`Switched to ${newTheme} mode`)
            } else if (data.action === "open_chatbot") {
                setActiveTab("chat")
                setAiResponse("Opening Chat...")
            } else if (data.action === "explain") {
                setAiResponse(data.response)
                if (voiceEnabled) speak(data.response)
            } else {
                setAiResponse(data.response || "I'm not sure how to do that yet.")
            }
        } catch (error) {
            setAiResponse("Something went wrong.")
        } finally {
            setIsProcessing(false)
            setTranscript("")
            transcriptRef.current = ""
            // Ensure we stop listening after command
            shouldListenRef.current = false
            recognitionRef.current?.stop()
        }
    }

    // Chat Send Handler
    const sendMessage = async () => {
        if (!input.trim() || isLoading) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim(),
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInput("")
        setIsLoading(true)

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                })
            })

            const data = await response.json()
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.message || "Sorry, I couldn't process that.",
                timestamp: new Date(),
                isError: !!data.error
            }
            setMessages(prev => [...prev, aiMessage])
        } catch (error) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "⚠️ Trouble connecting. Please try again!",
                timestamp: new Date(),
                isError: true
            }])
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) {
        return <OrbAssistant onClick={() => setIsOpen(true)} isOpen={isOpen} />
    }

    if (isMinimized) {
        return (
            <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
                <Button
                    onClick={() => setIsMinimized(false)}
                    className="h-12 sm:h-14 px-4 rounded-full shadow-lg gradient-primary hover:scale-105 transition-all duration-300 gap-2"
                >
                    <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    <span className="text-white font-medium text-sm sm:text-base">AI Assistant</span>
                </Button>
            </div>
        )
    }

    return (
        <Card className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-32px)] sm:w-[380px] h-[500px] sm:h-[580px] shadow-2xl z-50 flex flex-col overflow-hidden border border-border/10 animate-in slide-in-from-bottom-5 duration-300 glass-proper !bg-white/5 dark:!bg-black/40 backdrop-blur-2xl">
            <CardHeader className="py-3 px-4 border-b flex-shrink-0 bg-muted/30 dark:bg-muted/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-semibold">AI Assistant</CardTitle>
                            <p className="text-xs text-muted-foreground">Unified Voice & Chat</p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsMinimized(true)}>
                            <Minimize2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => {
                            setIsOpen(false)
                            shouldListenRef.current = false
                            recognitionRef.current?.stop()
                        }}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
                    <TabsList className="grid w-full grid-cols-2 h-9">
                        <TabsTrigger value="chat" className="text-xs gap-2">
                            <MessageSquare className="w-3.5 h-3.5" /> Chat
                        </TabsTrigger>
                        <TabsTrigger value="voice" className="text-xs gap-2">
                            <Waves className="w-3.5 h-3.5" /> Voice
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                <Tabs value={activeTab} className="flex-1 flex flex-col overflow-hidden">
                    <TabsContent value="chat" className="flex-1 p-0 animate-in fade-in transition-all duration-300 overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((m) => (
                                <ChatbotMessage key={m.id} {...m} />
                            ))}
                            {isLoading && (
                                <div className="flex gap-2 p-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    <span className="text-xs text-muted-foreground">Thinking...</span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 border-t bg-muted/20">
                            <div className="flex gap-2">
                                <Input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                                    placeholder="Ask anything..."
                                    className="h-10 text-sm"
                                />
                                <Button onClick={sendMessage} size="icon" className="gradient-primary">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="voice" className="flex-1 p-6 flex flex-col items-center justify-center space-y-8 animate-in slide-in-from-right-5 duration-300">
                        <div className="relative">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={toggleListening}
                                className={cn(
                                    "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl",
                                    isListening ? "gradient-destructive" : "gradient-primary"
                                )}
                            >
                                <AnimatePresence mode="wait">
                                    {isListening ? (
                                        <motion.div
                                            key="mic-on"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                        >
                                            <Mic className="w-12 h-12 text-white" />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="mic-off"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                        >
                                            <MicOff className="w-12 h-12 text-white/80" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {isListening && (
                                    <motion.div
                                        className="absolute -inset-4 rounded-full border-4 border-red-500/20"
                                        animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                )}
                            </motion.button>
                        </div>

                        <div className="w-full space-y-4 text-center">
                            <div className="h-12 flex items-center justify-center px-4">
                                {transcript ? (
                                    <p className="text-lg font-medium animate-in fade-in">"{transcript}"</p>
                                ) : isListening ? (
                                    <div className="flex gap-1">
                                        {[...Array(3)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                className="w-2 h-2 bg-primary rounded-full"
                                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm">Click to start voice command</p>
                                )}
                            </div>

                            <div className="p-4 rounded-xl bg-muted/30 border border-border/50 min-h-[80px] flex items-center justify-center">
                                <p className="text-sm font-medium text-primary">
                                    {isProcessing ? "Processing command..." : aiResponse || "Try: 'Go to Dashboard' or 'Switch to Dark Mode'"}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => setVoiceEnabled(!voiceEnabled)}
                            >
                                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                {voiceEnabled ? "Voice On" : "Voice Muted"}
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
