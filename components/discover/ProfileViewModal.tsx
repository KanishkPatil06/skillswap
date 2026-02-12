"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { MapPin, Briefcase, ExternalLink, UserPlus, Loader2 } from "lucide-react"
import { ReviewList } from "../reviews/ReviewList"
import { ReviewModal } from "../reviews/ReviewModal"
import { EndorsementButton } from "../reviews/EndorsementButton"
import { RatingStars } from "../reviews/RatingStars"
import { ReputationBadge } from "../profile/ReputationBadge"
import { BookSessionDialog } from "../sessions/book-session-dialog"

interface ProfileViewModalProps {
    isOpen: boolean
    onClose: () => void
    user: any // Type this properly based on your UserProfile interface
    currentUser: any
    onConnect: (userId: string) => void
    isConnecting: boolean
}

export function ProfileViewModal({
    isOpen,
    onClose,
    user,
    currentUser,
    onConnect,
    isConnecting
}: ProfileViewModalProps) {
    const [reviewModalOpen, setReviewModalOpen] = useState(false)

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

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Profile Details</DialogTitle>
                        <DialogDescription>
                            View user details, skills, and reviews.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <Avatar className="w-24 h-24 border-2 border-primary/20">
                                <AvatarImage src={user.avatar_url} alt={user.full_name} />
                                <AvatarFallback className="text-2xl">{getInitials(user.full_name)}</AvatarFallback>
                            </Avatar>

                            <div className="flex-1 space-y-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold">{user.full_name}</h2>
                                        <p className="text-muted-foreground">{user.level_name || "Member"}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ReputationBadge score={user.rating_score || 0} />
                                    </div>
                                </div>

                                {user.bio && <p className="text-sm">{user.bio}</p>}

                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2">
                                    {(user.city || user.country) && (
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {[user.city, user.country].filter(Boolean).join(", ")}
                                        </div>
                                    )}
                                    {user.linkedin_url && (
                                        <a
                                            href={user.linkedin_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 hover:text-primary transition-colors"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            LinkedIn
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={() => onConnect(user.id)}
                                disabled={isConnecting}
                                className="flex-1"
                            >
                                {isConnecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                                Connect
                            </Button>
                            <Button variant="outline" onClick={() => setReviewModalOpen(true)}>
                                Write a Review
                            </Button>
                        </div>

                        <Separator />

                        <Tabs defaultValue="skills" className="w-full">
                            <TabsList className="w-full justify-start">
                                <TabsTrigger value="skills">Skills & Endorsements</TabsTrigger>
                                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                            </TabsList>

                            <TabsContent value="skills" className="space-y-4 mt-4">
                                <div className="grid gap-4">
                                    {user.user_skills?.map((us: any) => (
                                        <div key={us.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{us.skill.name}</span>
                                                    <Badge variant="secondary" className="text-xs">{us.level}</Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{us.skill.category}</p>
                                            </div>

                                            {/* Endorsement and Book Session Buttons */}
                                            <div className="flex gap-2">
                                                {currentUser.id !== user.id && (
                                                    <>
                                                        <EndorsementButton
                                                            endorsedUserId={user.id}
                                                            skillId={us.skill.id || us.skill_id} // Fallback if structure varies
                                                            skillName={us.skill.name}
                                                        />
                                                        <BookSessionDialog
                                                            mentorId={user.id}
                                                            mentorName={user.full_name}
                                                            skillId={us.skill.id || us.skill_id}
                                                            skillName={us.skill.name}
                                                        >
                                                            <Button size="sm" variant="outline">Book</Button>
                                                        </BookSessionDialog>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {(!user.user_skills || user.user_skills.length === 0) && (
                                        <p className="text-muted-foreground text-center py-4">No skills listed.</p>
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
