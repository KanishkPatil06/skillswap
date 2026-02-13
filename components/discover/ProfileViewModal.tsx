"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { MapPin, ExternalLink, UserPlus, CheckCircle, Loader2, MessageSquare, Star, Award, BookOpen, Calendar, Globe } from "lucide-react"
import { ReviewList } from "../reviews/ReviewList"
import { ReviewModal } from "../reviews/ReviewModal"
import { EndorsementButton } from "../reviews/EndorsementButton"
import { RatingStars } from "../reviews/RatingStars"
import { ReputationBadge } from "../profile/ReputationBadge"
import { BookSessionDialog } from "../sessions/book-session-dialog"
import { useToast } from "@/hooks/use-toast"

interface ProfileViewModalProps {
    isOpen: boolean
    onClose: () => void
    user: any
    currentUser: any
    onConnect: (userId: string) => void
    isConnecting: boolean
    isConnected: boolean
    connectionId: string | null
}

export function ProfileViewModal({
    isOpen,
    onClose,
    user,
    currentUser,
    onConnect,
    isConnecting,
    isConnected,
    connectionId,
}: ProfileViewModalProps) {
    const [reviewModalOpen, setReviewModalOpen] = useState(false)
    const { toast } = useToast()

    if (!user) return null

    const getInitials = (name: string | null) => {
        if (!name) return "?"
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    const skillCount = user.user_skills?.length || 0
    const avgRating = user.rating_score || 0

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Profile Details</DialogTitle>
                        <DialogDescription>
                            View user details, skills, and reviews.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Gradient Banner */}
                    <div className="relative h-32 rounded-t-lg overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, hsl(250, 95%, 63%) 0%, hsl(168, 76%, 42%) 50%, hsl(280, 95%, 68%) 100%)'
                        }}
                    >
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[hsl(var(--background))] to-transparent" />
                    </div>

                    {/* Profile Header */}
                    <div className="px-6 -mt-16 relative z-10">
                        <div className="flex flex-col md:flex-row gap-5 items-start">
                            <Avatar className="w-24 h-24 border-4 border-[hsl(var(--background))] shadow-xl ring-2 ring-primary/30">
                                <AvatarImage src={user.avatar_url} alt={user.full_name} />
                                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary to-accent text-white">
                                    {getInitials(user.full_name)}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 space-y-2 pt-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">
                                            {user.full_name || "Anonymous"}
                                        </h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="secondary" className="text-xs font-medium">
                                                {user.level_name || "Newcomer"}
                                            </Badge>
                                            <ReputationBadge score={avgRating} />
                                        </div>
                                    </div>
                                </div>

                                {user.bio && (
                                    <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                                        {user.bio}
                                    </p>
                                )}

                                <div className="flex flex-wrap gap-4 text-sm text-[hsl(var(--muted-foreground))] pt-1">
                                    {(user.city || user.country) && (
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span>{[user.city, user.country].filter(Boolean).join(", ")}</span>
                                        </div>
                                    )}
                                    {user.linkedin_url && (
                                        <a
                                            href={user.linkedin_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 hover:text-primary transition-colors"
                                        >
                                            <Globe className="w-3.5 h-3.5" />
                                            LinkedIn
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="px-6 pt-4">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="flex flex-col items-center p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
                                <BookOpen className="w-4 h-4 text-primary mb-1" />
                                <span className="text-lg font-bold text-[hsl(var(--foreground))]">{skillCount}</span>
                                <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Skills</span>
                            </div>
                            <div className="flex flex-col items-center p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
                                <Star className="w-4 h-4 text-amber-500 mb-1" />
                                <span className="text-lg font-bold text-[hsl(var(--foreground))]">{avgRating.toFixed(1)}</span>
                                <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Rating</span>
                            </div>
                            <div className="flex flex-col items-center p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
                                <Award className="w-4 h-4 text-emerald-500 mb-1" />
                                <span className="text-lg font-bold text-[hsl(var(--foreground))]">{user.level || 1}</span>
                                <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Level</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="px-6 pt-2">
                        <div className="flex gap-2">
                            <Button
                                onClick={() => onConnect(user.id)}
                                disabled={isConnecting || isConnected}
                                variant={isConnected ? "secondary" : "default"}
                                className="flex-1 gap-2"
                                size="lg"
                            >
                                {isConnecting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : isConnected ? (
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                ) : (
                                    <UserPlus className="w-4 h-4" />
                                )}
                                {isConnected ? "Connected" : "Connect"}
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className={`gap-2 ${!isConnected ? 'opacity-60' : ''}`}
                                onClick={() => {
                                    if (isConnected && connectionId) {
                                        window.location.href = `/chat/${connectionId}`
                                    } else {
                                        toast({
                                            title: "Not connected",
                                            description: "Please connect first to start chatting.",
                                            variant: "destructive",
                                        })
                                    }
                                }}
                            >
                                <MessageSquare className="w-4 h-4" />
                                Message
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => setReviewModalOpen(true)}
                                className="gap-2"
                            >
                                <Star className="w-4 h-4" />
                                Review
                            </Button>
                        </div>
                    </div>

                    <div className="px-6">
                        <Separator />
                    </div>

                    {/* Tabs Section */}
                    <div className="px-6 pb-6">
                        <Tabs defaultValue="skills" className="w-full">
                            <TabsList className="w-full justify-start bg-[hsl(var(--card))]">
                                <TabsTrigger value="skills" className="gap-1.5">
                                    <BookOpen className="w-3.5 h-3.5" />
                                    Skills & Endorsements
                                </TabsTrigger>
                                <TabsTrigger value="reviews" className="gap-1.5">
                                    <Star className="w-3.5 h-3.5" />
                                    Reviews
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="skills" className="space-y-3 mt-4">
                                <div className="grid gap-3">
                                    {user.user_skills?.map((us: any) => (
                                        <div
                                            key={us.id}
                                            className="flex items-center justify-between p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-primary/30 transition-colors"
                                        >
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-[hsl(var(--foreground))]">{us.skill.name}</span>
                                                    <Badge variant="secondary" className="text-xs">{us.level}</Badge>
                                                </div>
                                                <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                                                    <BookOpen className="w-3 h-3" />
                                                    {us.skill.category}
                                                </p>
                                            </div>

                                            {/* Endorsement and Book Session Buttons */}
                                            <div className="flex gap-2">
                                                {currentUser.id !== user.id && (
                                                    <>
                                                        <EndorsementButton
                                                            endorsedUserId={user.id}
                                                            skillId={us.skill.id || us.skill_id}
                                                            skillName={us.skill.name}
                                                        />
                                                        <BookSessionDialog
                                                            mentorId={user.id}
                                                            mentorName={user.full_name}
                                                            skillId={us.skill.id || us.skill_id}
                                                            skillName={us.skill.name}
                                                        >
                                                            <Button size="sm" variant="outline" className="gap-1.5">
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                Book
                                                            </Button>
                                                        </BookSessionDialog>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {(!user.user_skills || user.user_skills.length === 0) && (
                                        <div className="text-center py-8 rounded-xl border border-dashed border-[hsl(var(--border))]">
                                            <BookOpen className="w-8 h-8 mx-auto text-[hsl(var(--muted-foreground))]/30 mb-2" />
                                            <p className="text-[hsl(var(--muted-foreground))] text-sm">No skills listed yet.</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="reviews" className="mt-4">
                                <ReviewList userId={user.id} />
                            </TabsContent>
                        </Tabs>
                    </div>
                </DialogContent>
            </Dialog>

            <ReviewModal
                isOpen={reviewModalOpen}
                onClose={() => setReviewModalOpen(false)}
                revieweeId={user.id}
                revieweeName={user.full_name || "User"}
            />
        </>
    )
}
