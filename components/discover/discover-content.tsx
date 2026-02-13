"use client"

import type { User } from "@supabase/supabase-js"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserPlus, ExternalLink, Loader2, Users, MapPin, Heart, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MainNav } from "@/components/navigation/main-nav"
import { LevelBadge } from "@/components/ui/level-badge"
import { OnlineIndicator } from "@/components/ui/online-indicator"
import { ReputationBadge } from "@/components/profile/ReputationBadge"
import { SkillMatchModal } from "./skill-match-modal"
import { UserFilterBar } from "./user-filter-bar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileViewModal } from "./ProfileViewModal"

interface UserProfile {
  id: string
  full_name: string | null
  bio: string | null
  linkedin_url: string | null
  rating_score: number
  level: number
  level_name: string
  is_online?: boolean
  city?: string
  country?: string
  user_skills: Array<{
    id: string
    level: string
    skill: {
      name: string
      category: string
    }
  }>
  saved_users?: { id: string }[]
  isSaved?: boolean
}

interface MyConnection {
  id: string
  user_id: string
  connected_user_id: string
  status: string
}

export default function DiscoverContent({ user }: { user: User }) {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [skills, setSkills] = useState<any[]>([])
  const [myConnections, setMyConnections] = useState<MyConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [matchModalOpen, setMatchModalOpen] = useState(false)
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null)

  // Filter States
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSkill, setSelectedSkill] = useState("all")
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [locationTerm, setLocationTerm] = useState("")

  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      try {
        // 1. Fetch Skills
        const { data: skillsData, error: skillsError } = await supabase
          .from("skills")
          .select("*")
          .order("name")

        if (skillsError) throw skillsError
        setSkills(skillsData || [])

        // 2. Fetch Profiles with location and saved status
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select(`
            id, 
            full_name, 
            bio, 
            linkedin_url, 
            rating_score, 
            level, 
            level_name, 
            is_online,
            city,
            country,
            user_skills (
              id,
              level,
              skill:skills (
                name,
                category
              )
            ),
            saved_users!saved_users_saved_user_id_fkey(id, user_id)
          `)
          .neq("id", user.id)
          .order("rating_score", { ascending: false })

        if (profilesError) throw profilesError

        // Transform data
        const typedProfiles: UserProfile[] = (profiles || []).map((profile: any) => ({
          ...profile,
          // Check if current user has saved this profile
          isSaved: profile.saved_users?.some((s: any) => s.user_id === user.id),
          user_skills: (profile.user_skills || []).map((us: any) => ({
            id: us.id,
            level: us.level,
            skill: Array.isArray(us.skill) && us.skill.length > 0
              ? us.skill[0]
              : (us.skill || { name: 'Unknown', category: 'Other' })
          }))
        }))

        setUsers(typedProfiles)
        setFilteredUsers(typedProfiles)

        // 3. Fetch current user's accepted connections
        const { data: connections } = await supabase
          .from("connections")
          .select("id, user_id, connected_user_id, status")
          .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`)
          .eq("status", "accepted")

        setMyConnections((connections || []) as MyConnection[])

      } catch (error: any) {
        console.error("Fetch Error:", error.message)
        toast({
          title: "Error fetching data",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (user?.id) {
      fetchData()
    }
  }, [user.id, supabase, toast])

  // Client-side filtering
  useEffect(() => {
    let filtered = [...users]

    // 1. Skill Filter
    if (selectedSkill && selectedSkill !== "all") {
      const skillName = skills.find((s) => s.id === selectedSkill)?.name
      filtered = filtered.filter((u) => u.user_skills?.some((us) => us.skill?.name === skillName))
    }

    // 2. Level Filter
    if (selectedLevel && selectedLevel !== "all") {
      filtered = filtered.filter((u) => u.user_skills?.some((us) => us.level === selectedLevel))
    }

    // 3. Category Filter
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter((u) => u.user_skills?.some((us) => us.skill?.category === selectedCategory))
    }

    // 4. Location Filter (City or Country partial match)
    if (locationTerm) {
      const term = locationTerm.toLowerCase()
      filtered = filtered.filter((u) =>
        u.city?.toLowerCase().includes(term) ||
        u.country?.toLowerCase().includes(term)
      )
    }

    // 5. Text Search (Name, Bio, Skills)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter((u) =>
        u.full_name?.toLowerCase().includes(term) ||
        u.bio?.toLowerCase().includes(term) ||
        // Also search in skills
        u.user_skills?.some(us => us.skill?.name.toLowerCase().includes(term))
      )
    }

    setFilteredUsers(filtered)
  }, [selectedSkill, selectedLevel, selectedCategory, locationTerm, searchTerm, skills, users])

  const handleConnect = async (targetUserId: string) => {
    setConnectingId(targetUserId)
    try {
      // Check existing connection logic...
      // (Simplified for brevity, same as before but typically should be in a hook/service)
      const { data: existing, error: checkError } = await supabase
        .from("connections")
        .select("id, status, user_id, connected_user_id")
        .or(`and(user_id.eq.${user.id},connected_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},connected_user_id.eq.${user.id})`)
        .maybeSingle()

      if (checkError) throw checkError

      if (existing) {
        if (existing.status === "pending" && existing.user_id === targetUserId) {
          await supabase.from("connections").update({ status: "accepted" }).eq("id", existing.id)
          toast({ title: "Success", description: "Connection accepted!" })
        } else {
          toast({ title: "Info", description: "Connection already exists/pending" })
        }
        return
      }

      const { error } = await supabase.from("connections").insert({
        user_id: user.id,
        connected_user_id: targetUserId,
        status: "pending",
      })

      if (error) throw error
      toast({ title: "Success", description: "Connection request sent!" })
    } catch (error) {
      console.error("Connection error:", error)
      toast({ title: "Error", description: "Failed to connect", variant: "destructive" })
    } finally {
      setConnectingId(null)
    }
  }

  const handleToggleSave = async (targetProfile: UserProfile) => {
    // Optimistic update
    const isSaved = (targetProfile as any).isSaved
    const newStatus = !isSaved

    setUsers(curr => curr.map(u =>
      u.id === targetProfile.id ? { ...u, isSaved: newStatus } : u
    ))
    setSavingId(targetProfile.id)

    try {
      if (newStatus) {
        // Save
        const { error } = await supabase.from("saved_users").insert({
          user_id: user.id,
          saved_user_id: targetProfile.id
        })
        if (error) throw error
        toast({ title: "Saved", description: "User saved to your list." })
      } else {
        // Unsave
        const { error } = await supabase.from("saved_users").delete()
          .eq("user_id", user.id)
          .eq("saved_user_id", targetProfile.id)
        if (error) throw error
        toast({ title: "Removed", description: "User removed from saved list." })
      }
    } catch (error) {
      // Revert optimism
      setUsers(curr => curr.map(u =>
        u.id === targetProfile.id ? { ...u, isSaved: isSaved } : u
      ))
      toast({ title: "Error", description: "Could not update saved status", variant: "destructive" })
    } finally {
      setSavingId(null)
    }
  }

  // Check if a target user is connected (accepted) with the current user
  const getConnection = (targetUserId: string): MyConnection | undefined => {
    return myConnections.find(c =>
      (c.user_id === user.id && c.connected_user_id === targetUserId) ||
      (c.user_id === targetUserId && c.connected_user_id === user.id)
    )
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
            <p className="text-muted-foreground">Loading community...</p>
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
          <p className="text-muted-foreground">Find and connect with skilled individuals matching your goals.</p>
        </div>

        {/* Tabs & Filters */}
        <Tabs defaultValue="discover" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <TabsList>
              <TabsTrigger value="discover" className="gap-2">
                <Users className="w-4 h-4" />
                All People
              </TabsTrigger>
              <TabsTrigger value="saved" className="gap-2">
                <Heart className="w-4 h-4" />
                Saved
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Improved Search & Filters */}
          <UserFilterBar
            onSearchChange={setSearchTerm}
            onSkillChange={setSelectedSkill}
            onLevelChange={setSelectedLevel}
            onCategoryChange={setSelectedCategory}
            onLocationChange={setLocationTerm}
            skills={skills}
          />

          <TabsContent value="discover" className="mt-0">
            {/* User Grid */}
            {filteredUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredUsers.map((profile) => (
                  <Card
                    key={profile.id}
                    className="group border-0 shadow-sm bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative"
                  >
                    {/* Save Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`absolute top-2 right-2 z-10 transition-opacity hover:bg-background/80 ${profile.isSaved ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      onClick={() => handleToggleSave(profile)}
                      disabled={savingId === profile.id}
                    >
                      <Heart
                        className={`w-5 h-5 ${(profile as any).isSaved ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
                      />
                    </Button>

                    <CardContent className="p-5">
                      {/* User Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-foreground font-semibold text-xl shrink-0 border-2 border-background shadow-sm" style={{ backgroundImage: `linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)`, color: 'white' }}>
                            {getInitials(profile.full_name)}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5">
                            <OnlineIndicator isOnline={profile.is_online} size="sm" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <h3 className="font-semibold text-lg text-foreground truncate">
                            {profile.full_name || "Anonymous"}
                          </h3>
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <LevelBadge
                                level={profile.level || 1}
                                levelName={profile.level_name || 'Newcomer'}
                                size="sm"
                                showLevel={false}
                              />
                              <span>•</span>
                              <ReputationBadge score={profile.rating_score || 0} size="sm" />
                            </div>
                            {(profile.city || profile.country) && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">{[profile.city, profile.country].filter(Boolean).join(", ")}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bio */}
                      {profile.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                          {profile.bio}
                        </p>
                      )}

                      {/* Skills */}
                      <div className="flex flex-wrap gap-1.5 mb-5 h-[52px] content-start overflow-hidden">
                        {profile.user_skills && profile.user_skills.length > 0 ? (
                          profile.user_skills.slice(0, 4).map((userSkill) => (
                            <Badge
                              key={userSkill.id}
                              className={`${getLevelColor(userSkill.level)} text-xs font-medium border-0 px-2 py-0.5`}
                            >
                              {userSkill.skill?.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No skills listed</span>
                        )}
                        {profile.user_skills && profile.user_skills.length > 4 && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                            +{profile.user_skills.length - 4}
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-4 border-t border-border/50">
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
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setViewingUser(profile)}
                        >
                          View Profile
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
              <div className="text-center py-20 bg-card/30 rounded-xl border border-dashed border-border">
                <Users className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No profiles match your filters</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Try adjusting your search criteria or clear some filters to see more people.
                </p>
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchTerm("")
                    setSelectedSkill("all")
                    setSelectedCategory("all")
                    setSelectedLevel("all")
                    setLocationTerm("")
                  }}
                  className="mt-2"
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="mt-0">
            {/* Saved Users Grid - Reusing same structure but filtered */}
            {filteredUsers.filter(u => u.isSaved).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredUsers.filter(u => u.isSaved).map((profile) => (
                  <Card
                    key={profile.id}
                    className="group border-0 shadow-sm bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative"
                  >
                    {/* Save Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`absolute top-2 right-2 z-10 transition-opacity hover:bg-background/80 ${profile.isSaved ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      onClick={() => handleToggleSave(profile)}
                      disabled={savingId === profile.id}
                    >
                      <Heart
                        className={`w-5 h-5 ${(profile as any).isSaved ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
                      />
                    </Button>

                    <CardContent className="p-5">
                      {/* User Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-foreground font-semibold text-xl shrink-0 border-2 border-background shadow-sm" style={{ backgroundImage: `linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)`, color: 'white' }}>
                            {getInitials(profile.full_name)}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5">
                            <OnlineIndicator isOnline={profile.is_online} size="sm" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <h3 className="font-semibold text-lg text-foreground truncate">
                            {profile.full_name || "Anonymous"}
                          </h3>
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <LevelBadge
                                level={profile.level || 1}
                                levelName={profile.level_name || 'Newcomer'}
                                size="sm"
                                showLevel={false}
                              />
                              <span>•</span>
                              <span>⭐ {profile.rating_score || 0}</span>
                            </div>
                            {(profile.city || profile.country) && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">{[profile.city, profile.country].filter(Boolean).join(", ")}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bio */}
                      {profile.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                          {profile.bio}
                        </p>
                      )}

                      {/* Skills */}
                      <div className="flex flex-wrap gap-1.5 mb-5 h-[52px] content-start overflow-hidden">
                        {profile.user_skills && profile.user_skills.length > 0 ? (
                          profile.user_skills.slice(0, 4).map((userSkill) => (
                            <Badge
                              key={userSkill.id}
                              className={`${getLevelColor(userSkill.level)} text-xs font-medium border-0 px-2 py-0.5`}
                            >
                              {userSkill.skill?.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No skills listed</span>
                        )}
                        {profile.user_skills && profile.user_skills.length > 4 && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                            +{profile.user_skills.length - 4}
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-4 border-t border-border/50">
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
              <div className="text-center py-20 bg-card/30 rounded-xl border border-dashed border-border">
                <Heart className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No saved profiles</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  You haven't saved any profiles yet.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

      </main>

      {/* Profile View Modal */}
      {viewingUser && (
        <ProfileViewModal
          isOpen={!!viewingUser}
          onClose={() => setViewingUser(null)}
          user={viewingUser}
          currentUser={user}
          onConnect={handleConnect}
          isConnecting={connectingId === viewingUser.id}
          isConnected={!!getConnection(viewingUser.id)}
          connectionId={getConnection(viewingUser.id)?.id || null}
        />
      )}

      {/* AI Skill Match Modal */}
      <SkillMatchModal
        open={matchModalOpen}
        onOpenChange={setMatchModalOpen}
        currentUser={user}
      />
    </div>
  )
}