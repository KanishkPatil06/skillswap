"use client"

import type React from "react"
import type { User } from "@supabase/supabase-js"
import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MainNav } from "@/components/navigation/main-nav"
import { useToast } from "@/hooks/use-toast"
import { User as UserIcon, Briefcase, X, Plus, Save, Loader2, Camera } from "lucide-react"

interface Profile {
    id: string
    full_name: string | null
    avatar_url: string | null
    linkedin_url: string | null
    bio: string | null
    email?: string
    created_at?: string
}

interface UserSkill {
    id: string
    skill_id: string
    level: string
    skill?: { name: string }
}

export default function ProfileContent({ user }: { user: User }) {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [formData, setFormData] = useState<Partial<Profile>>({})
    const [skills, setSkills] = useState<any[]>([])
    const [userSkills, setUserSkills] = useState<UserSkill[]>([])
    const [selectedSkill, setSelectedSkill] = useState("")
    const [selectedLevel, setSelectedLevel] = useState("Beginner")
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [addingSkill, setAddingSkill] = useState(false)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()
    const { toast } = useToast()

    useEffect(() => {
        const fetchData = async () => {
            const { data: profileData } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single()

            const { data: skillsData } = await supabase
                .from("skills")
                .select("*")
                .order("name")

            const { data: userSkillsData } = await supabase
                .from("user_skills")
                .select("*, skill:skills(name)")
                .eq("user_id", user.id)

            setProfile(profileData)
            setFormData(profileData || {})
            setSkills(skillsData || [])
            setUserSkills(userSkillsData || [])
            setLoading(false)
        }
        fetchData()
    }, [user.id, supabase])

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast({ title: "Error", description: "Please select an image file", variant: "destructive" })
            return
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast({ title: "Error", description: "Image must be less than 2MB", variant: "destructive" })
            return
        }

        setUploadingAvatar(true)
        try {
            const fileExt = file.name.split(".").pop()
            const fileName = `${user.id}-${Date.now()}.${fileExt}`
            const filePath = `avatars/${fileName}`

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(filePath, file)

            if (uploadError) {
                // If bucket doesn't exist, show a helpful message
                if (uploadError.message.includes("not found") || uploadError.message.includes("bucket")) {
                    toast({
                        title: "Storage not configured",
                        description: "Please create an 'avatars' bucket in Supabase Storage",
                        variant: "destructive"
                    })
                    return
                }
                throw uploadError
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from("avatars")
                .getPublicUrl(filePath)

            // Update profile with avatar URL
            const { error: updateError } = await supabase
                .from("profiles")
                .update({ avatar_url: urlData.publicUrl })
                .eq("id", user.id)

            if (updateError) throw updateError

            setProfile({ ...profile, avatar_url: urlData.publicUrl } as Profile)
            setFormData({ ...formData, avatar_url: urlData.publicUrl })
            toast({ title: "Success", description: "Profile picture updated!" })
        } catch (error: any) {
            console.error("Avatar upload error:", error)
            toast({ title: "Error", description: error.message || "Failed to upload image", variant: "destructive" })
        } finally {
            setUploadingAvatar(false)
        }
    }

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const { error } = await supabase
                .from("profiles")
                .upsert({
                    id: user.id,
                    full_name: formData.full_name,
                    bio: formData.bio,
                    linkedin_url: formData.linkedin_url,
                    updated_at: new Date().toISOString(),
                })

            if (error) throw error
            toast({ title: "Success", description: "Profile updated successfully" })
            setProfile({ ...profile, ...formData } as Profile)
        } catch (error) {
            toast({ title: "Error", description: "Failed to update profile", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    const handleAddSkill = async () => {
        if (!selectedSkill) return
        setAddingSkill(true)

        try {
            const { error } = await supabase.from("user_skills").insert({
                user_id: user.id,
                skill_id: selectedSkill,
                level: selectedLevel,
            })

            if (error) throw error
            toast({ title: "Success", description: "Skill added successfully" })

            const { data } = await supabase
                .from("user_skills")
                .select("*, skill:skills(name)")
                .eq("user_id", user.id)
            setUserSkills(data || [])
            setSelectedSkill("")
        } catch (error) {
            toast({ title: "Error", description: "Failed to add skill", variant: "destructive" })
        } finally {
            setAddingSkill(false)
        }
    }

    const handleRemoveSkill = async (skillId: string) => {
        try {
            const { error } = await supabase.from("user_skills").delete().eq("id", skillId)
            if (error) throw error
            setUserSkills(userSkills.filter((s) => s.id !== skillId))
            toast({ title: "Success", description: "Skill removed" })
        } catch (error) {
            toast({ title: "Error", description: "Failed to remove skill", variant: "destructive" })
        }
    }

    const getLevelColor = (level: string) => {
        const colors: Record<string, string> = {
            Beginner: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
            Intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
            Advanced: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
            Expert: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
        }
        return colors[level] || "bg-gray-100 text-gray-700"
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

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <MainNav user={user} />
                <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                    <div className="text-center space-y-4">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                        <p className="text-muted-foreground">Loading profile...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <MainNav user={user} />

            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Profile Header */}
                <div className="mb-8 flex items-center gap-6">
                    {/* Avatar with upload option */}
                    <div className="relative group">
                        {profile?.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt="Profile"
                                className="w-24 h-24 rounded-full object-cover shadow-lg"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-foreground text-3xl font-bold border border-border/20" style={{ boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.1), 0 6px 12px rgba(0,0,0,0.1)' }}>
                                {getInitials(profile?.full_name)}
                            </div>
                        )}
                        {/* Upload overlay */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                            {uploadingAvatar ? (
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            ) : (
                                <Camera className="w-6 h-6 text-white" />
                            )}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                        />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            {profile?.full_name || "Your Profile"}
                        </h1>
                        <p className="text-muted-foreground">{user.email}</p>
                        {profile?.created_at && (
                            <p className="text-sm text-muted-foreground mt-1">
                                Member since {new Date(profile.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                            Hover over avatar to change photo
                        </p>
                    </div>
                </div>

                <div className="grid gap-8">
                    {/* Profile Information */}
                    <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2">
                                <UserIcon className="w-5 h-5 text-primary" />
                                <CardTitle className="text-xl">Personal Information</CardTitle>
                            </div>
                            <CardDescription>Update your profile details</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSaveProfile} className="space-y-5">
                                <div className="grid md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Full Name</label>
                                        <Input
                                            value={formData.full_name || ""}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            placeholder="Your name"
                                            className="bg-background/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">LinkedIn URL</label>
                                        <Input
                                            type="url"
                                            value={formData.linkedin_url || ""}
                                            onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                                            placeholder="https://linkedin.com/in/yourprofile"
                                            className="bg-background/50"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Bio</label>
                                    <Textarea
                                        value={formData.bio || ""}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        placeholder="Tell us about yourself, your interests, and what you'd like to learn or teach..."
                                        rows={4}
                                        className="bg-background/50 resize-none"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="gap-2"
                                >
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    {saving ? "Saving..." : "Save Changes"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Skills Section */}
                    <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-primary" />
                                <CardTitle className="text-xl">Your Skills</CardTitle>
                            </div>
                            <CardDescription>Add skills you can teach or want to learn</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Add Skill Form */}
                            <div className="flex flex-wrap gap-3 items-end p-4 bg-muted/30 rounded-lg">
                                <div className="flex-1 min-w-[200px] space-y-2">
                                    <label className="text-sm font-medium">Skill</label>
                                    <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                                        <SelectTrigger className="bg-background/50">
                                            <SelectValue placeholder="Select a skill" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[200px] overflow-y-auto">
                                            {skills
                                                .filter((s) => !userSkills.some((us) => us.skill_id === s.id))
                                                .map((skill) => (
                                                    <SelectItem key={skill.id} value={skill.id}>
                                                        {skill.name}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="min-w-[150px] space-y-2">
                                    <label className="text-sm font-medium">Level</label>
                                    <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                                        <SelectTrigger className="bg-background/50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Beginner">Beginner</SelectItem>
                                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                                            <SelectItem value="Advanced">Advanced</SelectItem>
                                            <SelectItem value="Expert">Expert</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    onClick={handleAddSkill}
                                    disabled={!selectedSkill || addingSkill}
                                    className="gap-2"
                                >
                                    {addingSkill ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Plus className="w-4 h-4" />
                                    )}
                                    Add
                                </Button>
                            </div>

                            {/* Skills List */}
                            {userSkills.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {userSkills.map((userSkill) => (
                                        <Badge
                                            key={userSkill.id}
                                            variant="secondary"
                                            className={`${getLevelColor(userSkill.level)} text-sm py-1.5 px-3 gap-2 border-0`}
                                        >
                                            {userSkill.skill?.name}
                                            <span className="text-xs opacity-70">• {userSkill.level}</span>
                                            <button
                                                onClick={() => handleRemoveSkill(userSkill.id)}
                                                className="ml-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>No skills added yet</p>
                                    <p className="text-sm">Add your first skill using the form above</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
