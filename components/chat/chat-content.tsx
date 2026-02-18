"use client"

import type React from "react"
import type { User } from "@supabase/supabase-js"
import { useEffect, useRef, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Send, ArrowDown, MoreVertical, Pin, BellOff, User as UserIcon, Trash2, Ban, UserX, Mic, Camera, Reply, X, Search } from "lucide-react"
import { MessageBubble } from "./message-bubble"
import { DateSeparator } from "./date-separator"
import { TypingIndicator } from "./typing-indicator"
import { FileUploadButton } from "./file-upload-button"
import { VoiceCallButton } from "./voice-call-button"
import { VoiceRecorder } from "./voice-recorder"
import { CameraCapture } from "./camera-capture"
import { CallModal } from "./call-modal"
import { IncomingCallNotification } from "./incoming-call-notification"
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
  message_type?: 'text' | 'file' | 'note' | 'audio' | 'call'
  file_url?: string | null
  file_name?: string | null
  file_size?: number | null
  file_type?: string | null
  note_title?: string | null
  note_content?: string | null
  is_edited?: boolean
  is_deleted?: boolean
  message_reactions?: any[]
  reply_to_id?: string | null
  reply_to?: {
    id: string
    content: string
    sender_id: string
    message_type: string
  }
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
  const [isRecording, setIsRecording] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages
    return messages.filter(msg =>
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [messages, searchQuery])

  const [isMuted, setIsMuted] = useState(false)

  // Voice call state
  const [isCallModalOpen, setIsCallModalOpen] = useState(false)
  const [callChannelId, setCallChannelId] = useState("")
  const [callId, setCallId] = useState("")
  const [callRole, setCallRole] = useState<"caller" | "receiver">("caller")
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
    const processedMessages = await Promise.all(
      messages.map(async (msg) => {
        if ((msg.message_type === 'file' || msg.message_type === 'audio') && msg.file_url) {
          let filePath = msg.file_url
          if (filePath.includes('/storage/v1/object/')) {
            const match = filePath.match(/\/chat-files\/(.+)$/)
            if (match) filePath = match[1]
          } else if (filePath.includes('/sign/')) {
            const match = filePath.match(/\/chat-files\/(.+?)\?/)
            if (match) filePath = match[1]
          }

          const { data, error } = await supabase.storage
            .from('chat-files')
            .createSignedUrl(filePath, 3600)

          if (data && !error) {
            return { ...msg, file_url: data.signedUrl }
          }
        }
        return msg
      })
    )
    return processedMessages
  }

  // Handle message actions
  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({
          content: newContent,
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', user.id) // Ensure ownership

      if (error) throw error
    } catch (error) {
      toast({ title: "Error", description: "Failed to edit message", variant: "destructive" })
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Delete this message?")) return

    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({
          is_deleted: true,
          content: "[Deleted]" // Simplify for internal logic, though UI uses flag
        })
        .eq('id', messageId)
        .eq('sender_id', user.id)

      if (error) throw error
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete message", variant: "destructive" })
    }
  }

  // Note: Reaction logic is handled in MessageReactions component via direct DB calls.
  // We just need to ensure the state updates via realtime.

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
        .select("*, message_reactions(*), reply_to:reply_to_id(*)")
        .eq("connection_id", connectionId)
        .order("created_at", { ascending: true })

      // Process file messages to generate signed URLs
      const processedMessages = await processFileMessages((messagesData || []) as ChatMessage[])
      setMessages(processedMessages)
      setLoading(false)

      // Fetch pinned status
      const { data: pinData } = await supabase
        .from('pinned_chats')
        .select('connection_id')
        .eq('connection_id', connectionId)
        .eq('user_id', user.id)
        .single()

      setIsPinned(!!pinData)

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
        setIncomingCall(payload.payload)
        setShowIncomingCall(true)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(callChannel)
    }
  }, [user.id])

  // Realtime subscriptions
  useEffect(() => {
    if (!connection) return

    // Subscribe to new messages and message updates (edits/deletes)
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
          const newMessage = payload.new as ChatMessage
          // Optimistically Initialize reactions array if missing
          newMessage.message_reactions = []

          // Hydrate reply_to if present
          if (newMessage.reply_to_id) {
            // Try to find in current messages first (using a ref to access latest messages would be better, but state updater works)
            // Since we are inside setMessages updater below, we can't access 'messages' state directly here reliably without closure staleness.
            // But we can try to fetch it if we want to be sure, OR we can look it up in the setState callback.

            // Let's fetch it to be safe and consistent, as the parent message might not be loaded (though unlikely if we just replied to it)
            const { data: replyToMsg } = await supabase
              .from('chat_messages')
              .select('id, content, sender_id, message_type')
              .eq('id', newMessage.reply_to_id)
              .single()

            if (replyToMsg) {
              newMessage.reply_to = replyToMsg
            }
          }

          const processedMessages = await processFileMessages([newMessage])
          const processedMessage = processedMessages[0]

          setMessages((prev) => {
            const exists = prev.some((msg) => msg.id === processedMessage.id)
            if (exists) return prev

            // If we didn't fetch reply_to above (e.g. failed), try local lookup
            if (processedMessage.reply_to_id && !processedMessage.reply_to) {
              const parent = prev.find(m => m.id === processedMessage.reply_to_id)
              if (parent) {
                processedMessage.reply_to = {
                  id: parent.id,
                  content: parent.content,
                  sender_id: parent.sender_id,
                  message_type: parent.message_type as any
                }
              }
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
            prev.map((msg) => {
              if (msg.id === payload.new.id) {
                // Preserve reactions when message is updated (edit/delete)
                return { ...payload.new, message_reactions: msg.message_reactions } as ChatMessage
              }
              return msg
            })
          )
        }
      )
      .subscribe()

    // Subscribe to reactions
    // Note: We cannot filter by connection_id easily without joining.
    // We subscribe to all reaction changes and filter by message IDs we have.
    const reactionSubscription = supabase
      .channel(`reactions:${connectionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
        },
        async (payload) => {
          // We need to fetch the updated reactions for the message
          // Or optimistically update. Fetching is safer for correctness.
          const messageId = (payload.new as any).message_id || (payload.old as any).message_id

          if (!messageId) return

          // Only update if we have this message
          const messageExists = messages.find(m => m.id === messageId)
          if (messageExists) {
            // Fetch fresh reactions for this message
            const { data: freshReactions } = await supabase
              .from('message_reactions')
              .select('*')
              .eq('message_id', messageId)

            if (freshReactions) {
              setMessages(prev => prev.map(msg =>
                msg.id === messageId ? { ...msg, message_reactions: freshReactions } : msg
              ))
            }
          }
          // Note: Because 'messages' in closure might be stale, we should use functional update or ref.
          // However, 'messages' dependency is not in useEffect deps to avoid re-subscribing.
          // This is a common React hooks issue.
          // Better approach: filter inside the setState.
          setMessages(prev => {
            const targetMsg = prev.find(m => m.id === messageId)
            if (targetMsg) {
              // We need to fetch. Async inside setState is tricky.
              // Instead, trigger fetch outside.
              // But we can't trigger fetch outside easily without effect dependency.
              // Workaround: We trigger the fetch by an independent effect or just do it here (async inside event handler is fine).
              return prev // We'll update via the async fetch below
            }
            return prev
          })

          // Actual fetch logic:
          const { data: freshReactions } = await supabase
            .from('message_reactions')
            .select('*')
            .eq('message_id', messageId)

          if (freshReactions) {
            setMessages(prev => prev.map(msg =>
              msg.id === messageId ? { ...msg, message_reactions: freshReactions } : msg
            ))
          }
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
      reactionSubscription.unsubscribe()
      presenceChannel.unsubscribe()
    }
  }, [connection, user.id, connectionId, supabase]) // Note: messages filtered inside subscription

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

  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)

  const handleReply = (message: ChatMessage) => {
    setReplyingTo(message)
    // Focus input?
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
        reply_to_id: replyingTo?.id || null
      })

      if (error) throw error
      setNewMessage("")
      setReplyingTo(null)

      // Trigger notification
      const recipientId = connection.user_id === user.id ? connection.connected_user_id : connection.user_id
      fetch("/api/notifications/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "message",
          recipientId,
          message: newMessage.trim(),
        }),
      }).catch(() => { })

      // Clear typing
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
      const fileExt = file.name.split('.').pop()
      const fileName = `${connectionId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { error: messageError } = await supabase.from("chat_messages").insert({
        connection_id: connectionId,
        sender_id: user.id,
        content: '',
        message_type: 'file',
        file_url: fileName,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
      })

      if (messageError) throw messageError

      const recipientId = connection.user_id === user.id ? connection.connected_user_id : connection.user_id
      fetch("/api/notifications/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "file_shared",
          recipientId,
        }),
      }).catch(() => { })

      toast({
        title: "File uploaded",
        description: `${file.name} has been shared`,
      })
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload file", variant: "destructive" })
    }
  }

  // Group messages by date
  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groups: { date: Date; messages: ChatMessage[] }[] = []
    let currentDate: string | null = null

    messages.forEach((message) => {
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



  const messageGroups = groupMessagesByDate(filteredMessages)

  // ... (Header and menu handlers from original - keeping mostly same but ensuring they are here)
  const handlePinChat = async () => {
    try {
      if (isPinned) {
        // Unpin
        const { error } = await supabase
          .from('pinned_chats')
          .delete()
          .eq('connection_id', connectionId)
          .eq('user_id', user.id)

        if (error) throw error
        setIsPinned(false)
        toast({ title: "Chat unpinned" })
      } else {
        // Pin
        const { error } = await supabase
          .from('pinned_chats')
          .insert({
            connection_id: connectionId,
            user_id: user.id
          })

        if (error) throw error
        setIsPinned(true)
        toast({ title: "Chat pinned" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update pin status", variant: "destructive" })
    }
  }
  const handleMuteNotifications = () => {
    setIsMuted(!isMuted)
    toast({ title: isMuted ? "Notifications enabled" : "Notifications muted" })
  }
  const handleClearChat = async () => {
    if (!confirm("Are you sure?")) return
    await supabase.from("chat_messages").delete().eq("connection_id", connectionId)
    setMessages([])
    toast({ title: "Success", description: "Chat history cleared" })
  }
  const handleBlockUser = () => toast({ title: "Coming soon" })
  const handleDisconnect = async () => {
    if (!confirm("Disconnect?")) return
    await supabase.from("connections").delete().eq("id", connectionId)
    window.location.href = "/connections"
  }

  return (
    <div className="flex flex-col h-screen bg-background">

      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background border-b h-16 flex items-center">
        <div className="flex items-center justify-between px-4 w-full max-w-4xl mx-auto">
          {isSearching ? (
            <div className="flex items-center w-full gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <Button variant="ghost" size="icon" onClick={() => { setIsSearching(false); setSearchQuery("") }}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Input
                autoFocus
                placeholder="Search messages..."
                className="flex-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Link href="/connections">
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </Link>
                <h1 className="text-xl font-semibold truncate">
                  {connection?.profile?.full_name || "Chat"}
                </h1>
                <VoiceCallButton
                  connectionId={connectionId}
                  receiverId={connection?.user_id === user.id ? connection?.connected_user_id : connection?.user_id}
                  receiverName={connection?.profile?.full_name || "User"}
                  callerName={user.user_metadata?.full_name || user.email || "User"}
                  onCallInitiated={(channelId, cId) => {
                    setCallChannelId(channelId)
                    setCallId(cId)
                    setCallRole("caller")
                    setIsCallModalOpen(true)
                  }}
                  disabled={!connection}
                />
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setIsSearching(true)}>
                  <Search className="w-5 h-5" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handlePinChat}><Pin className="w-4 h-4 mr-2" />{isPinned ? "Unpin" : "Pin"}</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleMuteNotifications}><BellOff className="w-4 h-4 mr-2" />{isMuted ? "Unmute" : "Mute"}</DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${connection?.user_id === user.id ? connection?.connected_user_id : connection?.user_id}`}>
                        <UserIcon className="w-4 h-4 mr-2" />View Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleClearChat}><Trash2 className="w-4 h-4 mr-2" />Clear Chat</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBlockUser}><Ban className="w-4 h-4 mr-2" />Block User</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDisconnect} variant="destructive"><UserX className="w-4 h-4 mr-2" />Disconnect</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 flex flex-col overflow-hidden relative">
        <div
          ref={messagesContainerRef}
          onScroll={checkScrollPosition}
          className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scroll-smooth border border-border/50 dark:border-border rounded-lg p-4 bg-muted/20"
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
                      id={message.id}
                      content={message.content}
                      timestamp={parseStringAsUTC(message.created_at)}
                      isOwn={message.sender_id === user.id}
                      senderName={connection?.profile?.full_name}
                      isRead={!!message.read_at}
                      messageType={message.message_type as any}
                      fileUrl={message.file_url || undefined}
                      fileName={message.file_name || undefined}
                      fileSize={message.file_size || undefined}
                      fileType={message.file_type || undefined}
                      noteTitle={message.note_title || undefined}
                      noteContent={message.note_content || undefined}
                      isEdited={message.is_edited}
                      isDeleted={message.is_deleted}
                      reactions={message.message_reactions}
                      currentUserId={user.id}
                      onEdit={(newContent) => handleEditMessage(message.id, newContent)}
                      onDelete={() => handleDeleteMessage(message.id)}
                      onReact={() => { }} // Component handles DB update, we just rely on subscription
                      onReply={() => handleReply(message)}
                      replyTo={message.reply_to}
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

        {/* Scroll Button */}
        {showScrollButton && (
          <button
            onClick={() => scrollToBottom()}
            className="absolute bottom-24 right-8 bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-110"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        )}


        {/* Reply Banner */}
        {replyingTo && (
          <div className="bg-muted/50 p-2 flex items-center justify-between border-t border-b px-4">
            <div className="flex items-center gap-2 overflow-hidden">
              <Reply className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex flex-col text-sm overflow-hidden">
                <span className="font-medium text-xs">Replying to {replyingTo.sender_id === user.id ? 'yourself' : connection?.profile?.full_name}</span>
                <span className="text-muted-foreground truncate">{replyingTo.message_type === 'text' ? replyingTo.content : `[${replyingTo.message_type}]`}</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setReplyingTo(null)} className="h-6 w-6">
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Message Input */}
        {/* Message Input Area */}
        {isRecording ? (
          <VoiceRecorder
            onSend={async (audioBlob) => {
              if (!connection || !connectionId) {
                toast({ title: "Error", description: "Connection not ready", variant: "destructive" })
                return
              }

              toast({ title: "Sending...", description: "Uploading voice message..." })

              try {
                const fileName = `${connectionId}/${Date.now()}.webm`
                const { error: uploadError } = await supabase.storage
                  .from('chat-files')
                  .upload(fileName, audioBlob)

                if (uploadError) {
                  console.error("Upload error:", uploadError)
                  throw new Error(`Upload failed: ${uploadError.message}`)
                }

                const { error: msgError } = await supabase.from("chat_messages").insert({
                  connection_id: connectionId,
                  sender_id: user.id,
                  content: '',
                  message_type: 'audio',
                  file_url: fileName,
                  file_name: 'Voice Message.webm',
                  file_size: audioBlob.size,
                  file_type: 'audio/webm'
                })

                if (msgError) {
                  console.error("Message insert error:", msgError)
                  throw new Error(`Message sent failed: ${msgError.message}`)
                }

                // Notify
                const recipientId = connection.user_id === user.id ? connection.connected_user_id : connection.user_id
                fetch("/api/notifications/trigger", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    type: "message", // Or specific type if supported
                    recipientId,
                    message: "Sent a voice message",
                  }),
                }).catch(() => { })

                setIsRecording(false)
                toast({ title: "Sent", description: "Voice message sent successfully" })
              } catch (error: any) {
                toast({ title: "Error", description: error.message || "Failed to send voice message", variant: "destructive" })
              }
            }}
            onCancel={() => setIsRecording(false)}
          />
        ) : (
          <form onSubmit={handleSendMessage} className="flex gap-2 items-end w-full">
            <FileUploadButton
              onFileSelect={handleFileUpload}
              disabled={sending}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsRecording(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Mic className="w-5 h-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowCamera(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Camera className="w-5 h-5" />
            </Button>

            <Input
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value)
                setIsTyping(true)

                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

                typingTimeoutRef.current = setTimeout(() => {
                  setIsTyping(false)
                }, 2000)
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
        )}

        {showCamera && (
          <CameraCapture
            onCancel={() => setShowCamera(false)}
            onCapture={async (photoBlob) => {
              setShowCamera(false)
              toast({ title: "Sending Photo...", description: "Uploading..." })

              if (!connection || !connectionId) return

              try {
                const fileName = `${connectionId}/${Date.now()}.jpg`
                const { error: uploadError } = await supabase.storage
                  .from('chat-files')
                  .upload(fileName, photoBlob, {
                    contentType: 'image/jpeg'
                  })

                if (uploadError) {
                  console.error("Upload error:", uploadError)
                  throw new Error(`Upload failed: ${uploadError.message}`)
                }

                const { error: msgError } = await supabase.from("chat_messages").insert({
                  connection_id: connectionId,
                  sender_id: user.id,
                  content: '',
                  message_type: 'file',
                  file_url: fileName,
                  file_name: 'Photo.jpg',
                  file_size: photoBlob.size,
                  file_type: 'image/jpeg'
                })

                if (msgError) {
                  console.error("Message insert error:", msgError)
                  throw new Error(`Message sent failed: ${msgError.message}`)
                }

                // Notify
                const recipientId = connection.user_id === user.id ? connection.connected_user_id : connection.user_id
                fetch("/api/notifications/trigger", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    type: "message",
                    recipientId,
                    message: "Sent a photo",
                  }),
                }).catch(() => { })

                toast({ title: "Sent", description: "Photo sent successfully" })

              } catch (error: any) {
                toast({ title: "Error", description: error.message || "Failed to send photo", variant: "destructive" })
              }
            }}
          />
        )}
      </div>

      <CallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        callChannelId={callChannelId}
        callId={callId}
        remoteName={connection?.profile?.full_name || "User"}
        role={callRole}
        userId={user.id}
      />

      <IncomingCallNotification
        isOpen={showIncomingCall}
        callerName={incomingCall?.callerName || "User"}
        callChannelId={incomingCall?.callChannelId}
        callerId={incomingCall?.callerId}
        onAccept={() => {
          setCallChannelId(incomingCall.callChannelId)
          setCallId(incomingCall.callId)
          setCallRole("receiver")
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
    </div>
  )
}
