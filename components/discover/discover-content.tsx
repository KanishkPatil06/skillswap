"use client"

import type { User } from "@supabase/supabase-js"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { UserPlus, ExternalLink, Loader2 } from "lucide-react"
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

    if (selectedSkill) {
      const skillName = skills.find((s) => s.id === selectedSkill)?.name
      filtered = filtered.filter((u) => u.user_skills?.some((us) => us.skill?.name === skillName))
    }

    if (selectedLevel) {
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
      Beginner: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      Intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      Advanced: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      Expert: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    }
    return colors[level] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading people...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav user={user} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Discover People</h1>
          <p className="text-muted-foreground">Browse and connect with skilled individuals</p>
        </div>

        <Card className="mb-8 bg-card">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Search by Name</label>
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Skill</label>
                <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                  <SelectTrigger className="bg-input">
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
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Level</label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger className="bg-input">
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
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((profile) => (
              <Card key={profile.id} className="bg-card hover:shadow-lg transition-shadow flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{profile.full_name || "Anonymous"}</CardTitle>
                      <CardDescription className="line-clamp-2">{profile.bio}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 flex flex-col">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.user_skills?.slice(0, 4).map((userSkill) => (
                        <Badge key={userSkill.id} className={`${getLevelColor(userSkill.level)} border-0 text-xs`}>
                          {userSkill.skill?.name}
                        </Badge>
                      ))}
                      {profile.user_skills && profile.user_skills.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{profile.user_skills.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-border mt-auto">
                    <Button
                      onClick={() => handleConnect(profile.id)}
                      size="sm"
                      disabled={connectingId === profile.id}
                      className="flex-1 gap-2 bg-primary hover:bg-primary/90"
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
                        <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="gap-2">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground text-lg">No users found matching your filters.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
