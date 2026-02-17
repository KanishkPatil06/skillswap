"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ChatbotMessage } from "./chatbot-message"
import { Bot, X, Send, Minimize2, Sparkles, Loader2, AlertCircle } from "lucide-react"

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

export function AIChatbot() {
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Scroll to bottom when messages change or loading state changes
    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages, isLoading, scrollToBottom])

    useEffect(() => {
        if (isOpen && !isMinimized && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen, isMinimized])

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

            if (data.error && !data.message) {
                throw new Error(data.error)
            }

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.message || "Sorry, I couldn't process that. Please try again!",
                timestamp: new Date(),
                isError: !!data.error
            }

            setMessages(prev => [...prev, aiMessage])
        } catch (error: any) {
            console.error("Chat error:", error)
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: error.message || "⚠️ Sorry, I'm having trouble connecting. Please check your internet connection and try again!",
                timestamp: new Date(),
                isError: true
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 h-16 px-5 rounded-full shadow-2xl gradient-primary hover:scale-105 transition-all duration-300 z-50 group gap-3"
            >
                <Bot className="h-8 w-8 text-white group-hover:scale-110 transition-transform" />
                <span className="text-white font-semibold text-base">AI Chat</span>
            </Button>
        )
    }

    if (isMinimized) {
        return (
            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    onClick={() => setIsMinimized(false)}
                    className="h-14 px-4 rounded-full shadow-lg gradient-primary hover:scale-105 transition-all duration-300 gap-2"
                >
                    <Bot className="h-5 w-5 text-white" />
                    <span className="text-white font-medium">AI Assistant</span>
                </Button>
            </div>
        )
    }

    return (
        <Card className="fixed bottom-6 right-6 w-[380px] h-[520px] shadow-2xl z-50 flex flex-col overflow-hidden border border-border animate-in slide-in-from-bottom-5 duration-300" style={{ backgroundColor: 'hsl(var(--background))' }}>
            {/* Header */}
            <CardHeader className="py-3 px-4 border-b flex-shrink-0" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-semibold">AI Assistant</CardTitle>
                            <p className="text-xs text-muted-foreground">
                                {isLoading ? (
                                    <span className="flex items-center gap-1 text-primary">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        AI is typing...
                                    </span>
                                ) : (
                                    "Ask me anything about SkillSwap"
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-background"
                            onClick={() => setIsMinimized(true)}
                        >
                            <Minimize2 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 p-0 overflow-hidden" style={{ backgroundColor: 'hsl(var(--background))' }}>
                <div className="h-full overflow-y-auto p-4" style={{ backgroundColor: 'hsl(var(--background))' }}>
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <ChatbotMessage
                                key={message.id}
                                role={message.role}
                                content={message.content}
                                timestamp={message.timestamp}
                                isError={message.isError}
                            />
                        ))}

                        {/* Typing Indicator */}
                        {isLoading && (
                            <div className="flex gap-3 animate-in fade-in duration-300">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                    <Bot className="w-4 h-4" />
                                </div>
                                <div className="rounded-2xl rounded-tl-sm px-4 py-3" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'hsl(var(--muted-foreground))', animationDelay: '0ms' }} />
                                            <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'hsl(var(--muted-foreground))', animationDelay: '150ms' }} />
                                            <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'hsl(var(--muted-foreground))', animationDelay: '300ms' }} />
                                        </div>
                                        <span className="text-xs text-muted-foreground ml-2">Generating response...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Scroll anchor */}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </CardContent>

            {/* Input */}
            <div className="p-4 border-t flex-shrink-0" style={{ backgroundColor: 'hsl(var(--background))' }}>
                <div className="flex gap-2">
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        className="flex-1 border focus-visible:ring-1 focus-visible:ring-primary"
                        style={{ backgroundColor: 'hsl(var(--muted))' }}
                        disabled={isLoading}
                    />
                    <Button
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading}
                        size="icon"
                        className="gradient-primary hover:opacity-90 transition-opacity"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>
        </Card>
    )
}
