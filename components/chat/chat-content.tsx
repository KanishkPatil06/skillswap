"use client"

import type React from "react"
import type { User } from "@supabase/supabase-js"
import { useEffect, useRef, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Send, ArrowDown, MoreVertical, Pin, BellOff, User as UserIcon, Trash2, Ban, UserX } from "lucide-react"
import { MessageBubble } from "./message-bubble"
import { DateSeparator } from "./date-separator"
import { TypingIndicator } from "./typing-indicator"
import { FileUploadButton } from "./file-upload-button"
import { VoiceCallButton } from "./voice-call-button"
import { CallModal } from "./call-modal"
import { IncomingCallNotification } from "./incoming-call-notification"
import { MainNav } from "@/components/navigation/main-nav"
import { parseStringAsUTC } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ChatMessage {
  id: string
  content: string
  sender_id: string
  created_at: string
  read_at?: string | null
  message_type?: 'text' | 'file' | 'note'
  file_url?: string | null
  file_name?: string | null
  file_size?: number | null
  file_type?: string | null
  note_title?: string | null
  note_content?: string | null
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
  const [isPinned, setIsPinned] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  // Voice call state
  const [isCallModalOpen, setIsCallModalOpen] = useState(false)
  const [callRoomUrl, setCallRoomUrl] = useState("")
  const [callId, setCallId] = useState("")
  const [incomingCall, setIncomingCall] = useState<any>(null)
  const [showIncomingCall, setShowIncomingCall] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const supabase = useMemo(() => createClient(), [])
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

  // Helper function to generate signed URLs for file messages
  const processFileMessages = async (messages: ChatMessage[]) => {
    console.log('🔍 Processing file messages:', messages.filter(m => m.message_type === 'file'))

    const processedMessages = await Promise.all(
      messages.map(async (msg) => {
        if (msg.message_type === 'file' && msg.file_url) {
          console.log('📁 Processing file message:', msg.id, 'Original file_url:', msg.file_url)

          // Extract file path from URL if it's a full URL, or use as-is if it's already a path
          let filePath = msg.file_url
          if (filePath.includes('/storage/v1/object/')) {
            // Extract path from public URL format
            const match = filePath.match(/\/chat-files\/(.+)$/)
            if (match) filePath = match[1]
            console.log('📦 Extracted from public URL:', filePath)
          } else if (filePath.includes('/sign/')) {
            // Extract path from signed URL format
            const match = filePath.match(/\/chat-files\/(.+?)\?/)
            if (match) filePath = match[1]
            console.log('🔐 Extracted from signed URL:', filePath)
          } else {
            console.log('📂 Using path as-is:', filePath)
          }

          // Generate fresh signed URL
          console.log('🔑 Generating signed URL for:', filePath)
          const { data, error } = await supabase.storage
            .from('chat-files')
            .createSignedUrl(filePath, 3600)

          if (error) {
            console.error('❌ Error generating signed URL:', error)
          }

          if (data && !error) {
            console.log('✅ Signed URL generated successfully')
            return { ...msg, file_url: data.signedUrl }
          } else {
            console.warn('⚠️ Failed to generate signed URL, keeping original')
          }
        }
        return msg
      })
    )

    console.log('✅ Processed messages:', processedMessages.filter(m => m.message_type === 'file'))
    return processedMessages
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

      // Process file messages to generate signed URLs
      const processedMessages = await processFileMessages((messagesData || []) as ChatMessage[])
      setMessages(processedMessages)
      setLoading(false)

      setTimeout(() => scrollToBottom("auto"), 100)
      setTimeout(() => markMessagesAsRead(), 500)
    }

    fetchData()
  }, [user.id, connectionId, supabase, toast])

  // Listen for incoming calls
  useEffect(() => {
    const callChannel = supabase
      .channel(`user:${user.id}`)
      .on('broadcast', { event: 'incoming_call' }, (payload) => {
        console.log('Incoming call:', payload)
        setIncomingCall(payload.payload)
        setShowIncomingCall(true)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(callChannel)
    }
  }, [user.id])

  // Separate effect for subscriptions - only runs once connection is loaded
  useEffect(() => {
    if (!connection) return

    console.log("Setting up real-time subscriptions for connection:", connectionId)

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
        async (payload) => {
          console.log("New message received:", payload)
          const newMessage = payload.new as ChatMessage

          // Process file message to get signed URL
          const processedMessages = await processFileMessages([newMessage])
          const processedMessage = processedMessages[0]

          // Prevent duplicate messages - check if message already exists
          setMessages((prev) => {
            const exists = prev.some((msg) => msg.id === processedMessage.id)
            if (exists) {
              console.log("Message already exists, skipping duplicate")
              return prev
            }
            return [...prev, processedMessage]
          })
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
      .subscribe((status, err) => {
        console.log("Subscription status:", status)
        if (err) {
          console.error("Subscription error:", err)
        }
        if (status === "SUBSCRIBED") {
          console.log("Successfully subscribed to chat messages for connection:", connectionId)
        }
        if (status === "CHANNEL_ERROR") {
          console.error("Channel error - realtime may not be enabled for chat_messages table")
        }
      })

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
      console.log("Unsubscribing from real-time channels")
      messageSubscription.unsubscribe()
      presenceChannel.unsubscribe()
    }
  }, [connection, user.id, connectionId, supabase])

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
        message_type: 'text',
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

  const handleFileUpload = async (file: File) => {
    if (!connection) return

    try {
      console.log('📤 Starting file upload:', file.name, 'Size:', file.size, 'Type:', file.type)

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${connectionId}/${Date.now()}.${fileExt}`

      console.log('📂 Upload path:', fileName)
      console.log('🪣 Bucket: chat-files')

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(fileName, file)

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError)
        console.error('Error details:', JSON.stringify(uploadError, null, 2))
        throw uploadError
      }

      console.log('✅ File uploaded to storage:', uploadData)

      // Store just the file path in database (not the URL)
      // We'll generate signed URLs dynamically when displaying messages
      console.log('💾 Inserting message to database...')

      // Create message with file path (not URL - we generate signed URLs when displaying)
      const { data: messageData, error: messageError } = await supabase.from("chat_messages").insert({
        connection_id: connectionId,
        sender_id: user.id,
        content: '', // Empty content for file messages
        message_type: 'file',
        file_url: fileName, // Store just the path, not the full URL
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
      })

      if (messageError) {
        console.error('❌ Database insert error:', messageError)
        throw messageError
      }

      console.log('✅ Message saved to database:', messageData)

      toast({
        title: "File uploaded",
        description: `${file.name} has been shared`,
      })
    } catch (error) {
      console.error('❌ File upload error:', error)
      console.error('Error type:', typeof error)
      console.error('Error keys:', error ? Object.keys(error) : 'null/undefined')
      throw error // Re-throw to let FileUploadButton handle the error toast
    }
  }



  // Handler functions for menu actions
  const handlePinChat = () => {
    setIsPinned(!isPinned)
    toast({
      title: isPinned ? "Chat unpinned" : "Chat pinned",
      description: isPinned ? "Chat removed from pinned conversations" : "Chat pinned to top of your conversations",
    })
  }

  const handleMuteNotifications = () => {
    setIsMuted(!isMuted)
    toast({
      title: isMuted ? "Notifications enabled" : "Notifications muted",
      description: isMuted ? "You will receive notifications from this chat" : "You won't receive notifications from this chat",
    })
  }

  const handleClearChat = async () => {
    if (!confirm("Are you sure you want to clear all messages? This cannot be undone.")) return

    try {
      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("connection_id", connectionId)

      if (error) throw error

      setMessages([])
      toast({ title: "Success", description: "Chat history cleared" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to clear chat", variant: "destructive" })
    }
  }

  const handleBlockUser = async () => {
    if (!confirm("Are you sure you want to block this user? You won't be able to message each other.")) return

    toast({
      title: "Feature coming soon",
      description: "User blocking will be available in a future update",
    })
  }

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect? This will end your connection with this user.")) return

    try {
      const { error } = await supabase
        .from("connections")
        .delete()
        .eq("id", connectionId)

      if (error) throw error

      toast({ title: "Disconnected", description: "Connection removed successfully" })
      window.location.href = "/connections"
    } catch (error) {
      toast({ title: "Error", description: "Failed to disconnect", variant: "destructive" })
    }
  }

  // Group messages by date (using IST timezone)
  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groups: { date: Date; messages: ChatMessage[] }[] = []
    let currentDate: string | null = null

    messages.forEach((message) => {
      // Convert to IST and get date string
      const messageDate = parseStringAsUTC(message.created_at).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })

      if (messageDate !== currentDate) {
        currentDate = messageDate
        groups.push({
          date: parseStringAsUTC(message.created_at),
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
    <div className="flex flex-col h-screen bg-background">
      <MainNav user={user} />

      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link href="/connections">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold truncate">
              {connection?.profile?.full_name || "Chat"}
            </h1>
            {/* Voice Call Button */}
            <VoiceCallButton
              connectionId={connectionId}
              receiverId={connection?.user_id === user.id ? connection?.connected_user_id : connection?.user_id}
              receiverName={connection?.profile?.full_name || "User"}
              onCallInitiated={(roomUrl, callId) => {
                setCallRoomUrl(roomUrl)
                setCallId(callId)
                setIsCallModalOpen(true)
              }}
              disabled={!connection}
            />
          </div>

          {/* Three Dots Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handlePinChat}>
                <Pin className="w-4 h-4" />
                {isPinned ? "Unpin Chat" : "Pin Chat"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleMuteNotifications}>
                <BellOff className="w-4 h-4" />
                {isMuted ? "Unmute" : "Mute Notifications"}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/profile/${connection?.user_id === user.id ? connection?.connected_user_id : connection?.user_id}`}>
                  <UserIcon className="w-4 h-4" />
                  View Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleClearChat}>
                <Trash2 className="w-4 h-4" />
                Clear Chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBlockUser}>
                <Ban className="w-4 h-4" />
                Block User
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDisconnect} variant="destructive">
                <UserX className="w-4 h-4" />
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                  Start a conversation with {connection?.profile?.full_name}
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
                      timestamp={parseStringAsUTC(message.created_at)}
                      isOwn={message.sender_id === user.id}
                      senderName={connection?.profile?.full_name}
                      isRead={!!message.read_at}
                      messageType={message.message_type as 'text' | 'file' | 'note' | undefined}
                      fileUrl={message.file_url || undefined}
                      fileName={message.file_name || undefined}
                      fileSize={message.file_size || undefined}
                      fileType={message.file_type || undefined}
                      noteTitle={message.note_title || undefined}
                      noteContent={message.note_content || undefined}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
          {isTyping && (
            <div className="flex justify-start">
              <TypingIndicator userName={connection?.profile?.full_name} />
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
          <FileUploadButton
            onFileSelect={handleFileUpload}
            disabled={sending}
          />
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

      {/* Call Modals */}
      <CallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        roomUrl={callRoomUrl}
        callId={callId}
        remoteName={connection?.profile?.full_name || "User"}
      />

      <IncomingCallNotification
        isOpen={showIncomingCall}
        callerName={incomingCall?.callerName || "User"}
        onAccept={() => {
          setCallRoomUrl(incomingCall.roomUrl)
          setCallId(incomingCall.callId)
          setShowIncomingCall(false)
          setIsCallModalOpen(true)
        }}
        onDecline={async () => {
          await fetch('/api/calls/end', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callId: incomingCall.callId,
              status: 'rejected',
              duration: 0,
            }),
          })
          setShowIncomingCall(false)
          setIncomingCall(null)
        }}
      />
    </div >
  )
}
