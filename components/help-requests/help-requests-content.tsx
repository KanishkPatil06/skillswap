"use client"

import type { User } from "@supabase/supabase-js"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MainNav } from "@/components/navigation/main-nav"
import CreateHelpRequestDialog from "./create-help-request-dialog"
import { Loader2 } from "lucide-react"

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
  const supabase = createClient()

  useEffect(() => {
    fetchHelpRequests()

    const subscription = supabase
      .channel("help_requests_all")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "help_requests" }, (payload) => {
        fetchHelpRequests()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user.id, supabase])

  const fetchHelpRequests = async () => {
    const { data: allRequests } = await supabase
      .from("help_requests")
      .select("*, skill:skills(name), profile:profiles(full_name)")
      .eq("status", "open")
      .order("created_at", { ascending: false })

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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
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
    <div className="min-h-screen bg-background">
      <MainNav user={user} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Help Requests</h1>
            <p className="text-muted-foreground">Browse community help requests or create your own</p>
          </div>
          <CreateHelpRequestDialog onRequestCreated={handleRequestCreated} userId={user.id} />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">All Open Requests ({helpRequests.length})</h2>
            {helpRequests.length > 0 ? (
              helpRequests.map((request) => (
                <Card key={request.id} className="bg-card hover:shadow-lg transition-shadow">
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
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <Badge variant="outline">{request.skill?.name}</Badge>
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-8 text-center text-muted-foreground">
                  <p>No open help requests at the moment. Create the first one!</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-4">Your Requests ({myRequests.length})</h2>
            <div className="space-y-4">
              {myRequests.length > 0 ? (
                myRequests.map((request) => (
                  <Card key={request.id} className="bg-muted/30">
                    <CardContent className="pt-4">
                      <h4 className="font-semibold text-sm line-clamp-2">{request.title}</h4>
                      <Badge className={`${getStatusColor(request.status)} border-0 mt-2 text-xs`}>
                        {request.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="pt-4 text-center text-sm text-muted-foreground">
                    <p>No requests yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
