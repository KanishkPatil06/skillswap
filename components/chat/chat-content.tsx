"use client"

import type React from "react"

import type { User } from "@supabase/supabase-js"
import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Send } from "lucide-react"

interface ChatMessage {
  id: string
  content: string
  sender_id: string
  created_at: string
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      const { data: connData } = await supabase.from("connections").select("*").eq("id", connectionId).single()

      if (!connData) {
        toast({ title: "Error", description: "Connection not found", variant: "destructive" })
        return
      }

      const otherUserId = connData.user_id === user.id ? connData.connected_user_id : connData.user_id

      const { data: otherProfile } = await supabase.from("profiles").select("full_name").eq("id", otherUserId).single()

      setConnection({ ...connData, profile: otherProfile })

      const { data: messagesData } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("connection_id", connectionId)
        .order("created_at", { ascending: true })

      setMessages((messagesData || []) as ChatMessage[])
      setLoading(false)

      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    }

    fetchData()

    const subscription = supabase
      .channel(`chat:${connectionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `connection_id=eq.${connectionId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage])
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user.id, connectionId, supabase, toast])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !connection) return

    setSending(true)
    try {
      const { error } = await supabase.from("chat_messages").insert({
        connection_id: connectionId,
        sender_id: user.id,
        content: newMessage,
      })

      if (error) throw error
      setNewMessage("")
    } catch (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" })
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!connection) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Connection not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/connections">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">{connection.profile?.full_name || "Chat"}</h1>
          <div className="w-12" />
        </div>
      </nav>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <p>No messages yet. Start a conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === user.id ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.sender_id === user.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="bg-input"
          />
          <Button
            type="submit"
            disabled={sending || !newMessage.trim()}
            size="sm"
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
