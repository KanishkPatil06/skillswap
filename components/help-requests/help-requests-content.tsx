"use client"

import type { User } from "@supabase/supabase-js"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MainNav } from "@/components/navigation/main-nav"
import CreateHelpRequestDialog from "./create-help-request-dialog"
import { Loader2, Filter, Check } from "lucide-react"
import { parseStringAsUTC } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface HelpRequest {
  id: string
  title: string
  description: string
  status: string
  created_at: string
  user_id: string
  skill: { name: string }
  profile: { full_name: string }
}

export default function HelpRequestsContent({ user }: { user: User }) {
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([])
  const [myRequests, setMyRequests] = useState<HelpRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchHelpRequests()

    const subscription = supabase
      .channel("help_requests_all")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "help_requests" }, (payload) => {
        fetchHelpRequests()
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "help_requests" }, (payload) => {
        fetchHelpRequests()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user.id, supabase, showCompleted])

  const fetchHelpRequests = async () => {
    // Fetch all requests based on filter
    let query = supabase
      .from("help_requests")
      .select("*, skill:skills(name), profile:profiles(full_name)")
      .order("created_at", { ascending: false })

    if (!showCompleted) {
      query = query.in("status", ["open", "in_progress"])
    }

    const { data: allRequests } = await query

    const { data: userRequests } = await supabase
      .from("help_requests")
      .select("*, skill:skills(name), profile:profiles(full_name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    setHelpRequests((allRequests || []) as HelpRequest[])
    setMyRequests((userRequests || []) as HelpRequest[])
    setLoading(false)
  }

  const handleRequestCreated = () => {
    fetchHelpRequests()
    setShowCreateDialog(false)
  }

  const handleAcceptRequest = async (requestId: string) => {
    setUpdatingStatus(requestId)
    try {
      const { error } = await supabase
        .from("help_requests")
        .update({ status: "in_progress" })
        .eq("id", requestId)

      if (error) throw error

      toast({
        title: "Success",
        description: "You've accepted this help request!",
      })
      fetchHelpRequests()
    } catch (error) {
      console.error("Error accepting request:", error)
      toast({
        title: "Error",
        description: "Failed to accept help request",
        variant: "destructive",
      })
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleCompleteRequest = async (requestId: string) => {
    setUpdatingStatus(requestId)
    try {
      const { error } = await supabase
        .from("help_requests")
        .update({ status: "completed" })
        .eq("id", requestId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Help request marked as completed!",
      })
      fetchHelpRequests()
    } catch (error) {
      console.error("Error completing request:", error)
      toast({
        title: "Error",
        description: "Failed to complete help request",
        variant: "destructive",
      })
    } finally {
      setUpdatingStatus(null)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200",
      in_progress: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
      completed: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      closed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent">
      <MainNav user={user} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Help Requests</h1>
            <p className="text-muted-foreground">Browse community help requests or create your own</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={showCompleted ? "default" : "outline"}
              onClick={() => setShowCompleted(!showCompleted)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              {showCompleted ? "Hide Completed" : "Show Completed"}
            </Button>
            <CreateHelpRequestDialog onRequestCreated={handleRequestCreated} userId={user.id} />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">All Open Requests ({helpRequests.length})</h2>
            <div className="glass-proper !bg-white/5 dark:!bg-black/10 backdrop-blur-2xl p-4 sm:p-6 rounded-[24px] border border-white/10 dark:border-white/5 min-h-[400px]">
              <div className="space-y-4">
                {helpRequests.length > 0 ? (
                  helpRequests.map((request) => (
                    <Card key={request.id} className="glass-proper !bg-white/5 dark:!bg-black/10 border-border/10 hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{request.title}</CardTitle>
                            <CardDescription>by {request.profile?.full_name || "Anonymous"}</CardDescription>
                          </div>
                          <Badge className={`${getStatusColor(request.status)} border-0`}>{request.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {request.description && <p className="text-sm text-foreground">{request.description}</p>}
                        <div className="flex items-center justify-between pt-4 border-t border-border/10">
                          <Badge variant="outline" className="glass-proper">{request.skill?.name}</Badge>
                          <p className="text-xs text-muted-foreground">
                            {parseStringAsUTC(request.created_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          {request.user_id === user.id ? (
                            // Owner can mark as completed
                            request.status !== "completed" && request.status !== "closed" && (
                              <Button
                                size="sm"
                                onClick={() => handleCompleteRequest(request.id)}
                                disabled={updatingStatus === request.id}
                                className="gap-2 bg-purple-600 hover:bg-purple-700"
                              >
                                {updatingStatus === request.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                                Mark as Completed
                              </Button>
                            )
                          ) : (
                            // Non-owners can accept if status is open
                            request.status === "open" && (
                              <Button
                                size="sm"
                                onClick={() => handleAcceptRequest(request.id)}
                                disabled={updatingStatus === request.id}
                                className="gap-2"
                              >
                                {updatingStatus === request.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                                Accept Help Request
                              </Button>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="glass-proper !bg-transparent border-dashed border-white/20">
                    <CardContent className="pt-8 text-center text-muted-foreground">
                      <p>No open help requests at the moment. Create the first one!</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-4">Your Requests ({myRequests.length})</h2>
            <div className="glass-proper !bg-white/5 dark:!bg-black/20 backdrop-blur-xl p-4 sm:p-6 rounded-[24px] border border-white/10 dark:border-white/5 min-h-[200px]">
              <div className="space-y-4">
                {myRequests.length > 0 ? (
                  myRequests.map((request) => (
                    <Card key={request.id} className="glass-proper !bg-transparent border-border/10">
                      <CardContent className="pt-4">
                        <h4 className="font-semibold text-sm line-clamp-2">{request.title}</h4>
                        <Badge className={`${getStatusColor(request.status)} border-0 mt-2 text-xs`}>
                          {request.status}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="pt-4 text-center text-sm text-muted-foreground italic">
                    <p>No requests yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
