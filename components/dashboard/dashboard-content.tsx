"use client"

import type { User } from "@supabase/supabase-js"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MainNav } from "@/components/navigation/main-nav"
import ProfileTab from "./profile-tab"
import SkillsTab from "./skills-tab"
import { Settings, BarChart3, Users, MessageSquare, HelpCircle } from "lucide-react"
import Link from "next/link"

export default function DashboardContent({ user }: { user: User }) {
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ skills: 0, connections: 0, requests: 0 })
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
      })
      setLoading(false)
    }
    fetchProfile()
  }, [user.id, supabase])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav user={user} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Welcome back!</h1>
          <p className="text-muted-foreground">{profile?.full_name || "Update your profile to get started"}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass border-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg overflow-hidden group relative">
            <div className="absolute inset-0 gradient-primary opacity-10 group-hover:opacity-20 transition-opacity" />
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium mb-2">Skills Added</p>
                  <p className="text-4xl font-bold gradient-text">{stats.skills}</p>
                </div>
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center group-hover:scale-110 transition-all duration-300 glow-primary">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg overflow-hidden group relative">
            <div className="absolute inset-0 gradient-secondary opacity-10 group-hover:opacity-20 transition-opacity" />
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium mb-2">Connections</p>
                  <p className="text-4xl font-bold text-accent">{stats.connections}</p>
                </div>
                <div className="w-16 h-16 rounded-2xl gradient-secondary flex items-center justify-center group-hover:scale-110 transition-all duration-300 glow-accent">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg overflow-hidden group relative">
            <div className="absolute inset-0 gradient-tertiary opacity-10 group-hover:opacity-20 transition-opacity" />
            <CardContent className="pt-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium mb-2">Open Requests</p>
                  <p className="text-4xl font-bold gradient-text">{stats.requests}</p>
                </div>
                <div className="w-16 h-16 rounded-2xl gradient-tertiary flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <HelpCircle className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <Card className="lg:col-span-2 glass border-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Quick Actions</CardTitle>
              <CardDescription>Get started with SkillSwap</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/discover">
                  <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4 bg-transparent transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <Users className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-semibold text-sm">Discover People</p>
                      <p className="text-xs text-muted-foreground">Find skilled individuals</p>
                    </div>
                  </Button>
                </Link>
                <Link href="/help-requests">
                  <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4 bg-transparent">
                    <HelpCircle className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-semibold text-sm">Help Requests</p>
                      <p className="text-xs text-muted-foreground">Ask for help</p>
                    </div>
                  </Button>
                </Link>
                <Link href="/connections">
                  <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4 bg-transparent">
                    <MessageSquare className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-semibold text-sm">Connections</p>
                      <p className="text-xs text-muted-foreground">Chat with contacts</p>
                    </div>
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4 bg-transparent" disabled>
                  <Settings className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-semibold text-sm">Settings</p>
                    <p className="text-xs text-muted-foreground">Coming soon</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <BarChart3 className="w-5 h-5" />
                Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">NAME</p>
                <p className="text-sm font-semibold">{profile?.full_name || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">EMAIL</p>
                <p className="text-sm font-semibold">{user.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">JOINED</p>
                <p className="text-sm font-semibold">{new Date(profile?.created_at).toLocaleDateString()}</p>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4 bg-transparent" asChild>
                <Link href="#profile-section">Edit Profile</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" id="profile-section">
            <ProfileTab user={user} profile={profile} onProfileUpdate={setProfile} />
          </TabsContent>

          <TabsContent value="skills">
            <SkillsTab user={user} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
