"use client"

import type { User } from "@supabase/supabase-js"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, MessageSquare } from "lucide-react"

interface Connection {
  id: string
  connected_user_id: string
  status: string
  created_at: string
  profile: { full_name: string; bio: string; user_skills: any[] }
}

export default function ConnectionsContent({ user }: { user: User }) {
  const [pendingConnections, setPendingConnections] = useState<Connection[]>([])
  const [acceptedConnections, setAcceptedConnections] = useState<Connection[]>([])
  const [receivedConnections, setReceivedConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchConnections()
  }, [user.id, supabase])

  const fetchConnections = async () => {
    const { data: sent } = await supabase
      .from("connections")
      .select("*, profile:profiles!connected_user_id(full_name, bio, user_skills(*, skill:skills(name)))")
      .eq("user_id", user.id)

    const { data: received } = await supabase
      .from("connections")
      .select("*, profile:profiles!user_id(full_name, bio, user_skills(*, skill:skills(name)))")
      .eq("connected_user_id", user.id)

    const sentByStatus = sent || []
    const receivedByUser = received || []

    setPendingConnections(sentByStatus.filter((c) => c.status === "pending") as Connection[])
    setAcceptedConnections(sentByStatus.filter((c) => c.status === "accepted") as Connection[])
    setReceivedConnections(receivedByUser.filter((c) => c.status === "pending") as Connection[])
    setLoading(false)
  }

  const handleAcceptConnection = async (connectionId: string) => {
    try {
      const { error } = await supabase.from("connections").update({ status: "accepted" }).eq("id", connectionId)

      if (error) throw error
      toast({ title: "Success", description: "Connection accepted!" })
      fetchConnections()
    } catch (error) {
      toast({ title: "Error", description: "Failed to accept connection", variant: "destructive" })
    }
  }

  const handleRejectConnection = async (connectionId: string) => {
    try {
      const { error } = await supabase.from("connections").delete().eq("id", connectionId)
      if (error) throw error
      toast({ title: "Success", description: "Connection declined" })
      fetchConnections()
    } catch (error) {
      toast({ title: "Error", description: "Failed to decline connection", variant: "destructive" })
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-xl font-bold text-primary">SkillSwap</div>
          <div className="flex gap-4">
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
            <Link href="/discover">
              <Button variant="outline">Discover</Button>
            </Link>
            <Link href="/connections">
              <Button variant="ghost">Connections</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Connections</h1>
          <p className="text-muted-foreground">Manage your connections and start conversations</p>
        </div>

        <Tabs defaultValue="accepted" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="accepted">
              Connected
              {acceptedConnections.length > 0 && <span className="ml-2 text-xs">({acceptedConnections.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending
              {pendingConnections.length > 0 && <span className="ml-2 text-xs">({pendingConnections.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="received">
              Requests
              {receivedConnections.length > 0 && <span className="ml-2 text-xs">({receivedConnections.length})</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="accepted" className="space-y-4">
            {acceptedConnections.length > 0 ? (
              acceptedConnections.map((connection) => (
                <Card key={connection.id} className="bg-card hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{connection.profile?.full_name || "User"}</CardTitle>
                        <CardDescription className="line-clamp-2">{connection.profile?.bio}</CardDescription>
                      </div>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0">
                        Connected
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {connection.profile?.user_skills && connection.profile.user_skills.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {connection.profile.user_skills.slice(0, 3).map((us) => (
                            <Badge key={us.id} variant="outline" className="text-xs">
                              {us.skill?.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="pt-4 border-t border-border">
                      <Link href={`/chat/${connection.id}`}>
                        <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90">
                          <MessageSquare className="w-4 h-4" />
                          Send Message
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-8 text-center text-muted-foreground">
                  <p>No connections yet. Discover people and send connection requests!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingConnections.length > 0 ? (
              pendingConnections.map((connection) => (
                <Card key={connection.id} className="bg-card">
                  <CardHeader>
                    <CardTitle>{connection.profile?.full_name || "User"}</CardTitle>
                    <CardDescription className="line-clamp-2">{connection.profile?.bio}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-4">
                        Waiting for response (sent {new Date(connection.created_at).toLocaleDateString()})
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-8 text-center text-muted-foreground">
                  <p>No pending requests</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="received" className="space-y-4">
            {receivedConnections.length > 0 ? (
              receivedConnections.map((connection) => (
                <Card key={connection.id} className="bg-card">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{connection.profile?.full_name || "User"}</CardTitle>
                        <CardDescription className="line-clamp-2">{connection.profile?.bio}</CardDescription>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-0">
                        New
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {connection.profile?.user_skills && connection.profile.user_skills.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {connection.profile.user_skills.slice(0, 3).map((us) => (
                            <Badge key={us.id} variant="outline" className="text-xs">
                              {us.skill?.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 pt-4 border-t border-border">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptConnection(connection.id)}
                        className="flex-1 gap-2 bg-primary hover:bg-primary/90"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectConnection(connection.id)}
                        className="flex-1 gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-8 text-center text-muted-foreground">
                  <p>No pending requests</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
