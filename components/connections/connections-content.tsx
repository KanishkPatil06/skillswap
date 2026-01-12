"use client"

import type { User } from "@supabase/supabase-js"
import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, MessageSquare, Clock, Users, Loader2 } from "lucide-react"
import { MainNav } from "@/components/navigation/main-nav"

interface Connection {
  id: string
  user_id: string
  connected_user_id: string
  status: string
  created_at: string
  profile?: { full_name: string | null; bio: string | null; avatar_url?: string | null }
  last_message?: string
  last_message_time?: string
  unread_count?: number
}

export default function ConnectionsContent({ user }: { user: User }) {
  const [sentConnections, setSentConnections] = useState<Connection[]>([])
  const [receivedConnections, setReceivedConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()

  useEffect(() => {
    fetchConnections()

    // Subscribe to new messages to update the list immediately
    const channel = supabase
      .channel("connections_list_updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        () => {
          fetchConnections()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user.id])

  const fetchConnections = async () => {
    // Get connections where current user is the sender
    const { data: sent } = await supabase
      .from("connections")
      .select("*, profile:profiles!connected_user_id(full_name, bio, avatar_url)")
      .eq("user_id", user.id)

    // Get connections where current user is the receiver
    const { data: received } = await supabase
      .from("connections")
      .select("*, profile:profiles!user_id(full_name, bio, avatar_url)")
      .eq("connected_user_id", user.id)

    let sentData = (sent || []) as Connection[]
    let receivedData = (received || []) as Connection[]

    // Fetch last messages and unread counts for accepted connections
    const acceptedIds = [
      ...sentData.filter(c => c.status === 'accepted').map(c => c.id),
      ...receivedData.filter(c => c.status === 'accepted').map(c => c.id)
    ]

    if (acceptedIds.length > 0) {
      // We'll fetch messages for all these connections
      const { data: messages } = await supabase
        .from("chat_messages")
        .select("id, connection_id, content, created_at, sender_id, read_at")
        .in("connection_id", acceptedIds)
        .order("created_at", { ascending: false })

      if (messages) {
        // Helper to process connections with message data
        const processConnection = (conn: Connection) => {
          const connMessages = messages.filter(m => m.connection_id === conn.id)
          if (connMessages.length > 0) {
            conn.last_message = connMessages[0].content
            conn.last_message_time = connMessages[0].created_at

            // Count unread messages sent by the OTHER user
            conn.unread_count = connMessages.filter(
              m => m.sender_id !== user.id && !m.read_at
            ).length
          }
          return conn
        }

        sentData = sentData.map(c => c.status === 'accepted' ? processConnection(c) : c)
        receivedData = receivedData.map(c => c.status === 'accepted' ? processConnection(c) : c)
      }
    }

    setSentConnections(sentData)
    setReceivedConnections(receivedData)
    setLoading(false)
  }

  // Combine accepted connections from both sent and received
  const acceptedConnections = [
    ...sentConnections.filter((c) => c.status === "accepted"),
    ...receivedConnections.filter((c) => c.status === "accepted"),
  ].sort((a, b) => {
    // Sort by last message time if available, otherwise connection creation time
    const timeA = a.last_message_time || a.created_at
    const timeB = b.last_message_time || b.created_at
    return new Date(timeB).getTime() - new Date(timeA).getTime()
  })

  const pendingConnections = sentConnections.filter((c) => c.status === "pending")
  const requestConnections = receivedConnections.filter((c) => c.status === "pending")

  const handleAcceptConnection = async (connectionId: string) => {
    setProcessingId(connectionId)
    try {
      const { error } = await supabase
        .from("connections")
        .update({ status: "accepted" })
        .eq("id", connectionId)

      if (error) throw error
      toast({ title: "Success", description: "Connection accepted!" })
      fetchConnections()
    } catch (error) {
      toast({ title: "Error", description: "Failed to accept connection", variant: "destructive" })
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectConnection = async (connectionId: string) => {
    setProcessingId(connectionId)
    try {
      const { error } = await supabase.from("connections").delete().eq("id", connectionId)
      if (error) throw error
      toast({ title: "Success", description: "Connection declined" })
      fetchConnections()
    } catch (error) {
      toast({ title: "Error", description: "Failed to decline connection", variant: "destructive" })
    } finally {
      setProcessingId(null)
    }
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav user={user} />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading connections...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav user={user} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Connections</h1>
          <p className="text-muted-foreground">Manage your connections and start conversations</p>
        </div>

        <Tabs defaultValue="connected" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md bg-muted/50">
            <TabsTrigger value="connected" className="gap-2">
              Connected
              {acceptedConnections.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {acceptedConnections.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              Pending
              {pendingConnections.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {pendingConnections.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2">
              Requests
              {requestConnections.length > 0 && (
                <Badge className="ml-1 text-xs bg-primary">
                  {requestConnections.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Connected Tab */}
          <TabsContent value="connected" className="space-y-4">
            {acceptedConnections.length > 0 ? (
              acceptedConnections.map((connection) => (
                <Card
                  key={connection.id}
                  className="border-0 shadow-sm bg-card/80 hover:shadow-md transition-all duration-200 group"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Link href={`/profile/${connection.connected_user_id === user.id ? connection.user_id : connection.connected_user_id}`}>
                        {connection.profile?.avatar_url ? (
                          <img
                            src={connection.profile.avatar_url}
                            alt={connection.profile?.full_name || "User"}
                            className="w-12 h-12 rounded-full object-cover shadow-sm border border-border/20"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-foreground font-bold text-lg shadow-inner border border-border/20" style={{ boxShadow: 'inset 0 1.5px 4.5px rgba(0,0,0,0.1), 0 3px 6px rgba(0,0,0,0.1)' }}>
                            {getInitials(connection.profile?.full_name)}
                          </div>
                        )}
                      </Link>

                      <div className="flex-1 min-w-0 grid grid-cols-1 gap-1">
                        <div className="flex items-center gap-2 justify-between">
                          <h3 className="font-semibold text-foreground truncate">
                            {connection.profile?.full_name || "User"}
                          </h3>
                          {connection.unread_count && connection.unread_count > 0 ? (
                            <Badge variant="destructive" className="h-5 min-w-5 rounded-full px-1 flex items-center justify-center text-[10px]">
                              {connection.unread_count}
                            </Badge>
                          ) : null}
                        </div>

                        {/* Last Message or Bio */}
                        <div className="min-h-[1.25rem]">
                          {connection.last_message ? (
                            <p className={`text-sm truncate pr-4 ${(connection.unread_count || 0) > 0
                              ? "font-medium text-foreground"
                              : "text-muted-foreground"
                              }`}>
                              {connection.last_message}
                            </p>
                          ) : (
                            connection.profile?.bio ? (
                              <p className="text-sm text-muted-foreground truncate">
                                {connection.profile.bio}
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">
                                Start a conversation
                              </p>
                            )
                          )}
                        </div>
                      </div>

                      <Link href={`/chat/${connection.id}`}>
                        <Button size="sm" variant={(connection.unread_count || 0) > 0 ? "default" : "outline"} className="gap-2 transition-all">
                          <MessageSquare className="w-4 h-4" />
                          <span className="hidden sm:inline">Message</span>
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <EmptyState
                icon={Users}
                title="No connections yet"
                description="Discover people and send connection requests to start building your network."
                action={
                  <Link href="/discover">
                    <Button>Discover People</Button>
                  </Link>
                }
              />
            )}
          </TabsContent>

          {/* Pending Tab */}
          <TabsContent value="pending" className="space-y-4">
            {pendingConnections.length > 0 ? (
              pendingConnections.map((connection) => (
                <Card
                  key={connection.id}
                  className="border-0 shadow-sm bg-card/80"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-foreground font-semibold shrink-0 shadow-inner border border-border/20" style={{ boxShadow: 'inset 0 1.5px 4.5px rgba(0,0,0,0.1), 0 3px 6px rgba(0,0,0,0.1)' }}>
                        {getInitials(connection.profile?.full_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {connection.profile?.full_name || "User"}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Sent {formatDate(connection.created_at)}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                        Pending
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <EmptyState
                icon={Clock}
                title="No pending requests"
                description="You don't have any pending connection requests."
              />
            )}
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            {requestConnections.length > 0 ? (
              requestConnections.map((connection) => (
                <Card
                  key={connection.id}
                  className="border-0 shadow-sm bg-card/80"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-foreground font-semibold shrink-0 shadow-inner border border-border/20" style={{ boxShadow: 'inset 0 1.5px 4.5px rgba(0,0,0,0.1), 0 3px 6px rgba(0,0,0,0.1)' }}>
                        {getInitials(connection.profile?.full_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {connection.profile?.full_name || "User"}
                        </h3>
                        {connection.profile?.bio && (
                          <p className="text-sm text-muted-foreground truncate">
                            {connection.profile.bio}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptConnection(connection.id)}
                          disabled={processingId === connection.id}
                          className="gap-1"
                        >
                          {processingId === connection.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectConnection(connection.id)}
                          disabled={processingId === connection.id}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <EmptyState
                icon={MessageSquare}
                title="No new requests"
                description="You don't have any pending connection requests from others."
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action
}: {
  icon: any
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="text-center py-12 px-4">
      <Icon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      {action}
    </div>
  )
}
