"use client"

import type { User } from "@supabase/supabase-js"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { UserPlus, ExternalLink, Loader2, Search, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MainNav } from "@/components/navigation/main-nav"

interface UserProfile {
  id: string
  full_name: string | null
  bio: string | null
  linkedin_url: string | null
  user_skills: Array<{
    id: string
    level: string
    skill: { name: string }
  }>
}

export default function DiscoverContent({ user }: { user: User }) {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [skills, setSkills] = useState<any[]>([])
  const [selectedSkill, setSelectedSkill] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLevel, setSelectedLevel] = useState("")
  const [loading, setLoading] = useState(true)
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      const { data: skillsData } = await supabase.from("skills").select("*").order("name")
      setSkills(skillsData || [])

      const { data: usersData } = await supabase
        .from("profiles")
        .select("*, user_skills(*, skill:skills(name))")
        .neq("id", user.id)
        .order("full_name")

      setUsers((usersData || []) as UserProfile[])
      setFilteredUsers((usersData || []) as UserProfile[])
      setLoading(false)
    }
    fetchData()
  }, [user.id, supabase])

  useEffect(() => {
    let filtered = [...users]

    if (selectedSkill && selectedSkill !== "all") {
      const skillName = skills.find((s) => s.id === selectedSkill)?.name
      filtered = filtered.filter((u) => u.user_skills?.some((us) => us.skill?.name === skillName))
    }

    if (selectedLevel && selectedLevel !== "all") {
      filtered = filtered.filter((u) => u.user_skills?.some((us) => us.level === selectedLevel))
    }

    if (searchTerm) {
      filtered = filtered.filter((u) => u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    setFilteredUsers(filtered)
  }, [selectedSkill, selectedLevel, searchTerm, skills, users])

  const handleConnect = async (targetUserId: string) => {
    setConnectingId(targetUserId)
    try {
      const { error } = await supabase.from("connections").insert({
        user_id: user.id,
        connected_user_id: targetUserId,
        status: "pending",
      })

      if (error) {
        if (error.message.includes("duplicate")) {
          toast({ title: "Info", description: "Connection already exists" })
        } else {
          throw error
        }
      } else {
        toast({ title: "Success", description: "Connection request sent!" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to send connection request", variant: "destructive" })
    } finally {
      setConnectingId(null)
    }
  }

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      Beginner: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      Intermediate: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
      Advanced: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
      Expert: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    }
    return colors[level] || "bg-gray-50 text-gray-600"
  }

  const getInitials = (name: string | null) => {
    if (!name) return "?"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav user={user} />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading people...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav user={user} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Discover People</h1>
          <p className="text-muted-foreground">Find and connect with skilled individuals</p>
        </div>

        {/* Filters - Compact Inline Design */}
        <div className="flex flex-wrap gap-3 mb-8 p-4 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background/50"
            />
          </div>
          <Select value={selectedSkill} onValueChange={setSelectedSkill}>
            <SelectTrigger className="w-[160px] bg-background/50">
              <SelectValue placeholder="All skills" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All skills</SelectItem>
              {skills.map((skill) => (
                <SelectItem key={skill.id} value={skill.id}>
                  {skill.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-[140px] bg-background/50">
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
              <SelectItem value="Expert">Expert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* User Grid */}
        {filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredUsers.map((profile) => (
              <Card
                key={profile.id}
                className="group border-0 shadow-sm bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-5">
                  {/* User Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-foreground font-semibold text-lg shrink-0 group-hover:scale-105 transition-transform border border-border/30" style={{ boxShadow: 'inset 0 1.5px 4.5px rgba(0,0,0,0.1), 0 3px 6px rgba(0,0,0,0.1)' }}>
                      {getInitials(profile.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {profile.full_name || "Anonymous"}
                      </h3>
                      {profile.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                          {profile.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Skills */}
                  {profile.user_skills && profile.user_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {profile.user_skills.slice(0, 3).map((userSkill) => (
                        <Badge
                          key={userSkill.id}
                          className={`${getLevelColor(userSkill.level)} text-xs font-medium border-0`}
                        >
                          {userSkill.skill?.name}
                        </Badge>
                      ))}
                      {profile.user_skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{profile.user_skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-border/50">
                    <Button
                      onClick={() => handleConnect(profile.id)}
                      size="sm"
                      disabled={connectingId === profile.id}
                      className="flex-1 gap-2"
                    >
                      {connectingId === profile.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      Connect
                    </Button>
                    {profile.linkedin_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Users className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No people found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or search term
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
