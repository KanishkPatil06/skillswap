"use client"

import type React from "react"
import type { User } from "@supabase/supabase-js"
import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Send, ArrowDown } from "lucide-react"
import { MessageBubble } from "./message-bubble"
import { DateSeparator } from "./date-separator"
import { TypingIndicator } from "./typing-indicator"
import { MainNav } from "@/components/navigation/main-nav"

interface ChatMessage {
  id: string
  content: string
  sender_id: string
  created_at: string
  read_at?: string | null
}

interface ConnectionData {
  id: string
  user_id: string
  connected_user_id: string
  status: string
  profile?: { full_name: string }
}

export default function ChatContent({ user, connectionId }: { user: User; connectionId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [connection, setConnection] = useState<ConnectionData | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const supabase = createClient()
  const { toast } = useToast()

  // Scroll to bottom function
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  // Check if user is at bottom of messages
  const checkScrollPosition = () => {
    if (!messagesContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
    setShowScrollButton(!isAtBottom)
  }

  // Mark messages as read
  const markMessagesAsRead = async () => {
    if (!connection) return

    const unreadMessages = messages.filter(
      (msg) => msg.sender_id !== user.id && !msg.read_at
    )

    if (unreadMessages.length === 0) return

    await supabase
      .from("chat_messages")
      .update({ read_at: new Date().toISOString() })
      .in(
        "id",
        unreadMessages.map((m) => m.id)
      )
  }

  useEffect(() => {
    const fetchData = async () => {
      const { data: connData } = await supabase
        .from("connections")
        .select("*")
        .eq("id", connectionId)
        .single()

      if (!connData) {
        toast({ title: "Error", description: "Connection not found", variant: "destructive" })
        return
      }

      const otherUserId = connData.user_id === user.id ? connData.connected_user_id : connData.user_id

      const { data: otherProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", otherUserId)
        .single()

      setConnection({ ...connData, profile: otherProfile })

      const { data: messagesData } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("connection_id", connectionId)
        .order("created_at", { ascending: true })

      setMessages((messagesData || []) as ChatMessage[])
      setLoading(false)

      setTimeout(() => scrollToBottom("auto"), 100)
      setTimeout(() => markMessagesAsRead(), 500)
    }

    fetchData()

    // Subscribe to new messages
    const messageSubscription = supabase
      .channel(`chat:${connectionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `connection_id=eq.${connectionId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage])
          setTimeout(() => scrollToBottom(), 100)
          setTimeout(() => markMessagesAsRead(), 500)
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `connection_id=eq.${connectionId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === payload.new.id ? (payload.new as ChatMessage) : msg))
          )
        }
      )
      .subscribe()

    // Subscribe to typing presence
    const presenceChannel = supabase.channel(`presence:${connectionId}`, {
      config: { presence: { key: user.id } },
    })

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState()
        const otherUserId = connection?.user_id === user.id
          ? connection?.connected_user_id
          : connection?.user_id

        if (otherUserId && state[otherUserId]) {
          const presence = state[otherUserId][0] as { typing?: boolean }
          setIsTyping(presence?.typing || false)
        } else {
          setIsTyping(false)
        }
      })
      .subscribe()

    return () => {
      messageSubscription.unsubscribe()
      presenceChannel.unsubscribe()
    }
  }, [user.id, connectionId, supabase, toast])

  // Handle typing indicator
  const handleTyping = () => {
    const channel = supabase.channel(`presence:${connectionId}`)
    channel.track({ typing: true })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      channel.track({ typing: false })
    }, 3000)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !connection) return

    setSending(true)
    try {
      const { error } = await supabase.from("chat_messages").insert({
        connection_id: connectionId,
        sender_id: user.id,
        content: newMessage.trim(),
      })

      if (error) throw error
      setNewMessage("")

      // Clear typing indicator
      const channel = supabase.channel(`presence:${connectionId}`)
      channel.track({ typing: false })
    } catch (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" })
    } finally {
      setSending(false)
    }
  }

  // Group messages by date
  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groups: { date: Date; messages: ChatMessage[] }[] = []
    let currentDate: string | null = null

    messages.forEach((message) => {
      const messageDate = new Date(message.created_at).toDateString()
      if (messageDate !== currentDate) {
        currentDate = messageDate
        groups.push({
          date: new Date(message.created_at),
          messages: [message],
        })
      } else {
        groups[groups.length - 1].messages.push(message)
      }
    })

    return groups
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav user={user} />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading chat...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!connection) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav user={user} />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Connection not found</p>
            <Link href="/connections">
              <Button variant="outline">Back to Connections</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MainNav user={user} />

      {/* Chat Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/connections">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-lg font-semibold">{connection.profile?.full_name || "Chat"}</h1>
            {isTyping && <p className="text-xs text-muted-foreground">typing...</p>}
          </div>
          <div className="w-20" />
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 flex flex-col overflow-hidden relative">
        <div
          ref={messagesContainerRef}
          onScroll={checkScrollPosition}
          className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scroll-smooth"
        >
          {messageGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Send className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">No messages yet</h3>
                <p className="text-muted-foreground text-sm">
                  Start a conversation with {connection.profile?.full_name}
                </p>
              </div>
            </div>
          ) : (
            messageGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                <DateSeparator date={group.date} />
                <div className="space-y-3">
                  {group.messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      content={message.content}
                      timestamp={new Date(message.created_at)}
                      isOwn={message.sender_id === user.id}
                      senderName={connection.profile?.full_name}
                      isRead={!!message.read_at}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
          {isTyping && (
            <div className="flex justify-start">
              <TypingIndicator userName={connection.profile?.full_name} />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to Bottom Button */}
        {showScrollButton && (
          <button
            onClick={() => scrollToBottom()}
            className="absolute bottom-24 right-8 bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-110"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        )}

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value)
              handleTyping()
            }}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 bg-input resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage(e)
              }
            }}
          />
          <Button
            type="submit"
            disabled={sending || !newMessage.trim()}
            size="icon"
            className="bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
