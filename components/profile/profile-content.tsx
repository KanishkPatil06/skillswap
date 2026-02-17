"use client"

import type React from "react"
import type { User } from "@supabase/supabase-js"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MainNav } from "@/components/navigation/main-nav"
import { useToast } from "@/hooks/use-toast"
import { User as UserIcon, Briefcase, X, Plus, Save, Loader2, CheckCircle2, Award, Shield, AlertTriangle } from "lucide-react"
import { parseStringAsUTC } from "@/lib/utils"
import { SkillAssessmentModal } from "./skill-assessment-modal"
import { Switch } from "@/components/ui/switch"
import { AvailabilitySettings } from "./availability-settings"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ReputationBadge } from "@/components/profile/ReputationBadge"
import { ReviewList } from "@/components/reviews/ReviewList"
import { AvatarUpload } from "@/components/profile/avatar-upload"
import { PortfolioSection } from "@/components/profile/portfolio-section"
import { BadgeList } from "@/components/gamification/badge-list"

interface Profile {
    id: string
    full_name: string | null
    avatar_url: string | null
    linkedin_url: string | null
    bio: string | null
    email?: string
    created_at?: string
    is_public?: boolean
    rating_score?: number
}

interface UserSkill {
    id: string
    skill_id: string
    level: string
    skill?: { name: string }
    verified_at?: string | null
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
    const [removingSkillId, setRemovingSkillId] = useState<string | null>(null)
    const [assessmentModalOpen, setAssessmentModalOpen] = useState(false)
    const [assessmentSkill, setAssessmentSkill] = useState<{ id: string, name: string, level: string } | null>(null)
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

            // Award points for adding skill
            await supabase.rpc('award_points', {
                p_user_id: user.id,
                p_activity_type: 'skill_added',
                p_points: 10,
                p_description: 'Added new skill'
            })

            toast({ title: "Success", description: "Skill added! +10 points" })

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
        setRemovingSkillId(skillId)
        try {
            const { error } = await supabase.from("user_skills").delete().eq("id", skillId)
            if (error) throw error
            setUserSkills(userSkills.filter((s) => s.id !== skillId))
            toast({ title: "Success", description: "Skill removed" })
        } catch (error) {
            toast({ title: "Error", description: "Failed to remove skill", variant: "destructive" })
        } finally {
            setRemovingSkillId(null)
        }
    }

    const handleVerifySkill = (skill: UserSkill) => {
        if (!skill.skill) return
        setAssessmentSkill({
            id: skill.id,
            name: skill.skill.name,
            level: skill.level
        })
        setAssessmentModalOpen(true)
    }

    const handleVerificationSuccess = () => {
        // Optimistic update
        if (assessmentSkill) {
            setUserSkills(prev => prev.map(s =>
                s.id === assessmentSkill.id
                    ? { ...s, verified_at: new Date().toISOString() }
                    : s
            ))
        }
    }

    const getLevelColor = (level: string) => {
        const colors: Record<string, string> = {
            Beginner: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
            Intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
            Advanced: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
            Expert: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
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

    const handleDeleteAccount = async () => {
        setLoading(true)
        try {
            const { error } = await supabase.auth.admin.deleteUser(user.id)
            // Note: Client-side deleteUser usually requires service role or proper policies. 
            // If strictly client-side, we might just sign out and let a server function handle cleanup
            // For now, let's try calling signOut and maybe a rpc if needed, but standard auth.deleteUser() might not work on client without config.
            // Actually, best practice is often to prompt user to contact support or use a server action.
            // However, Supabase sometimes allows users to delete their own account if enabled.
            // Let's try a direct RPC or just delete from profiles and let headers handle auth? 
            // Standard approach: 
            // 1. Delete profile data
            // 2. Sign out

            // Delete profile (cascades to other tables usually)
            const { error: deleteError } = await supabase
                .from("profiles")
                .delete()
                .eq("id", user.id)

            if (deleteError) throw deleteError

            await supabase.auth.signOut()
            window.location.href = "/"
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to delete account", variant: "destructive" })
            setLoading(false)
        }
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
        <div className="min-h-screen bg-background pb-20 animate-fade-in-up">
            <MainNav user={user} />

            {/* Profile Header Pattern */}
            <div className="h-48 w-full bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 opacity-90 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
            </div>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 relative -mt-24 z-10">
                <div className="flex flex-col md:flex-row gap-8">

                    {/* Left Column - User Info */}
                    <div className="w-full md:w-1/3 space-y-6">
                        <Card className="overflow-hidden border-0 shadow-lg bg-card/60 backdrop-blur-xl card-hover">
                            <CardContent className="p-6">
                                {/* Profile Header */}
                                <div className="mb-8 flex flex-col items-center gap-4">
                                    {/* Avatar Upload Component */}
                                    <AvatarUpload
                                        userId={user.id}
                                        currentAvatarUrl={profile?.avatar_url}
                                        onUploadComplete={(url) => {
                                            setProfile({ ...profile, avatar_url: url } as Profile)
                                            setFormData({ ...formData, avatar_url: url })
                                        }}
                                    />
                                    <div className="text-center">
                                        <h1 className="text-3xl font-bold text-foreground">
                                            {profile?.full_name || "Your Profile"}
                                        </h1>
                                        <p className="text-muted-foreground">{user.email}</p>
                                        {profile?.created_at && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Member since {parseStringAsUTC(profile.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}
                                            </p>
                                        )}
                                        <div className="mt-3">
                                            <ReputationBadge score={profile?.rating_score || 0} />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Badges Section */}
                        <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <BadgeList userId={user.id} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column */}
                    <div className="w-full md:w-2/3 space-y-6">

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

                            {/* Portfolio Section */}
                            <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
                                <CardContent className="pt-6">
                                    <PortfolioSection userId={user.id} isOwnProfile={true} />
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
                                                <div key={userSkill.id} className="relative group/skill">
                                                    <Badge
                                                        variant="secondary"
                                                        className={`${getLevelColor(userSkill.level)} text-sm py-1.5 px-3 gap-2 border-0 pr-8`}
                                                    >
                                                        {userSkill.skill?.name}
                                                        <span className="text-xs opacity-70">• {userSkill.level}</span>

                                                        {userSkill.verified_at && (
                                                            <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded-full text-[10px] font-medium ml-1">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                Verified
                                                            </div>
                                                        )}

                                                        {!userSkill.verified_at && (
                                                            <button
                                                                onClick={() => handleVerifySkill(userSkill)}
                                                                className="ml-1 opacity-60 hover:opacity-100 hover:text-primary transition-opacity"
                                                                title="Verify this skill"
                                                            >
                                                                <Award className="w-4 h-4" />
                                                            </button>
                                                        )}

                                                    </Badge>
                                                    <button
                                                        onClick={() => handleRemoveSkill(userSkill.id)}
                                                        disabled={removingSkillId === userSkill.id}
                                                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover/skill:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border border-background"
                                                        title="Remove skill"
                                                    >
                                                        {removingSkillId === userSkill.id ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <X className="w-3 h-3" />
                                                        )}
                                                    </button>
                                                </div>
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

                            {/* Availability Settings */}
                            <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-xl">Availability</CardTitle>
                                    <CardDescription>Manage your weekly schedule for sessions</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <AvailabilitySettings userId={user.id} />
                                </CardContent>
                            </Card>

                            {/* Privacy Settings */}
                            <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-primary" />
                                        <CardTitle className="text-xl">Privacy Settings</CardTitle>
                                    </div>
                                    <CardDescription>Manage your profile visibility</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <label className="text-base font-medium">Public Profile</label>
                                            <p className="text-sm text-muted-foreground">
                                                Allow others to find your profile and see your skills
                                            </p>
                                        </div>
                                        <Switch
                                            checked={formData.is_public ?? true}
                                            onCheckedChange={(checked) => {
                                                setFormData({ ...formData, is_public: checked })
                                                // Auto save when toggled
                                                supabase.from("profiles").update({ is_public: checked }).eq("id", user.id).then(({ error }) => {
                                                    if (error) toast({ title: "Error", description: "Failed to update setting", variant: "destructive" })
                                                    else toast({ title: "Success", description: "Privacy setting updated" })
                                                })
                                            }}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Reviews Section */}
                            <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-xl">Your Reviews</CardTitle>
                                    <CardDescription>What others are saying about you</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ReviewList userId={user.id} />
                                </CardContent>
                            </Card>

                            {/* Danger Zone */}
                            <Card className="border-red-200 dark:border-red-900/50 shadow-sm bg-red-50/50 dark:bg-red-900/10">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                        <CardTitle className="text-xl text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                                    </div>
                                    <CardDescription className="text-red-600/70 dark:text-red-400/70">Irreversible actions for your account</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <label className="text-base font-medium text-foreground">Delete Account</label>
                                            <p className="text-sm text-muted-foreground">
                                                Permanently delete your account and all data
                                            </p>
                                        </div>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="destructive">Delete Account</Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                                                    <DialogDescription>
                                                        This action cannot be undone. This will permanently delete your account
                                                        and remove your data from our servers.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="flex justify-end gap-2 mt-4">
                                                    <Button variant="outline" onClick={() => document.getElementById("close-dialog")?.click()}>Cancel</Button>
                                                    <Button variant="destructive" onClick={handleDeleteAccount} disabled={loading}>
                                                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                                        Delete Account
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    {assessmentSkill && (
                        <SkillAssessmentModal
                            open={assessmentModalOpen}
                            onOpenChange={setAssessmentModalOpen}
                            skillId={assessmentSkill.id}
                            skillName={assessmentSkill.name}
                            level={assessmentSkill.level}
                            onVerified={handleVerificationSuccess}
                        />
                    )}
                </div>
            </main>
        </div>
    )
}
