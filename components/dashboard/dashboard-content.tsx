"use client"

import type { User } from "@supabase/supabase-js"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MainNav } from "@/components/navigation/main-nav"
import { useRouter } from "next/navigation"
import { BarChart3, Users, MessageSquare, HelpCircle, User as UserIcon, ArrowRight, Sparkles, BookOpen, Clock, Star } from "lucide-react"
import Link from "next/link"

export default function DashboardContent({ user }: { user: User }) {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ skills: 0, connections: 0, requests: 0, sessions_completed: 0, reputation_score: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      const { data: userSkills } = await supabase.from("user_skills").select("*").eq("user_id", user.id)

      const { data: connections } = await supabase
        .from("connections")
        .select("*")
        .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`)
        .eq("status", "accepted")

      const { data: requests } = await supabase
        .from("help_requests")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "open")

      setProfile(profileData)
      setStats({
        skills: userSkills?.length || 0,
        connections: connections?.length || 0,
        requests: requests?.length || 0,
        sessions_completed: 0,
        reputation_score: profileData?.rating_score || 0,
      })
      setLoading(false)
    }
    fetchProfile()
  }, [user.id, supabase])

  const getInitials = (name: string | null) => {
    if (!name) return user.email?.charAt(0).toUpperCase() || "?"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in-up">
      <MainNav user={user} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          {/* Welcome Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back, {user.user_metadata?.full_name || 'User'}! 👋</h1>
              <p className="text-muted-foreground mt-1">Here's what's happening with your skills today.</p>
            </div>
            <Button onClick={() => router.push('/discover')} className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
              <Sparkles className="w-4 h-4" />
              Discover Mentors
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger-in" style={{ "--stagger": "100ms" } as React.CSSProperties}>
            <Card className="p-6 flex items-center space-x-4 border-l-4 border-l-primary card-hover">
              <div className="p-3 bg-primary/10 rounded-full">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sessions</p>
                <h3 className="text-2xl font-bold">{stats.sessions_completed || 0}</h3>
              </div>
            </Card>

            <Card className="p-6 flex items-center space-x-4 border-l-4 border-l-accent card-hover">
              <div className="p-3 bg-accent/10 rounded-full">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Learning Hours</p>
                <h3 className="text-2xl font-bold">12.5</h3>
              </div>
            </Card>

            <Card className="p-6 flex items-center space-x-4 border-l-4 border-l-purple-500 card-hover">
              <div className="p-3 bg-purple-500/10 rounded-full">
                <Star className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reputation</p>
                <h3 className="text-2xl font-bold">{stats.reputation_score || 0}</h3>
              </div>
            </Card>

            <Card className="p-6 flex items-center space-x-4 border-l-4 border-l-pink-500 card-hover">
              <div className="p-3 bg-pink-500/10 rounded-full">
                <Users className="w-6 h-6 text-pink-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Connections</p>
                <h3 className="text-2xl font-bold">24</h3>
              </div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 glass border border-purple-500/20 bg-gradient-to-br from-violet-600/20 via-purple-500/10 to-transparent shadow-xl shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/20">
              <CardHeader>
                <CardTitle className="text-2xl">Quick Actions</CardTitle>
                <CardDescription>Get started with SkillSwap</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/discover">
                    <Button variant="secondary" className="w-full justify-start gap-3 h-auto py-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                      <Users className="w-5 h-5" />
                      <div className="text-left">
                        <p className="font-semibold text-sm">Discover People</p>
                        <p className="text-xs text-muted-foreground">Find skilled individuals</p>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/help-requests">
                    <Button variant="secondary" className="w-full justify-start gap-3 h-auto py-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                      <HelpCircle className="w-5 h-5" />
                      <div className="text-left">
                        <p className="font-semibold text-sm">Help Requests</p>
                        <p className="text-xs text-muted-foreground">Ask for help</p>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/connections">
                    <Button variant="secondary" className="w-full justify-start gap-3 h-auto py-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                      <MessageSquare className="w-5 h-5" />
                      <div className="text-left">
                        <p className="font-semibold text-sm">Connections</p>
                        <p className="text-xs text-muted-foreground">Chat with contacts</p>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/profile">
                    <Button variant="secondary" className="w-full justify-start gap-3 h-auto py-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                      <UserIcon className="w-5 h-5" />
                      <div className="text-left">
                        <p className="font-semibold text-sm">Edit Profile</p>
                        <p className="text-xs text-muted-foreground">Update your info & skills</p>
                      </div>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border border-pink-500/20 bg-gradient-to-br from-fuchsia-600/20 via-pink-500/10 to-transparent shadow-xl shadow-pink-500/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-pink-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <UserIcon className="w-5 h-5" />
                  Your Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-foreground text-xl font-bold border-2 border-border/30" style={{ boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.1), 0 5px 9px rgba(0,0,0,0.1)' }}>
                    {getInitials(profile?.full_name)}
                  </div>
                  <div>
                    <p className="font-semibold">{profile?.full_name || "Not set"}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                {profile?.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{profile.bio}</p>
                )}
                <Link href="/profile">
                  <Button variant="secondary" size="sm" className="w-full mt-2 gap-2">
                    View Profile
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

