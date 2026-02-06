"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MatchCard } from "./match-card"
import { Loader2, Sparkles, Users, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface MatchResult {
    user: {
        id: string
        full_name: string | null
        bio: string | null
        linkedin_url: string | null
    }
    matchScore: number
    theyCanTeach: string[]
    youCanTeach: string[]
    matchReason: string
}

interface SkillMatchModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    currentUser: User
}

export function SkillMatchModal({ open, onOpenChange, currentUser }: SkillMatchModalProps) {
    const [matches, setMatches] = useState<MatchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [connectingId, setConnectingId] = useState<string | null>(null)
    const { toast } = useToast()
    const supabase = createClient()

    useEffect(() => {
        if (open) {
            fetchMatches()
        }
    }, [open])

    const fetchMatches = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch("/api/skill-match")
            const data = await response.json()

            if (data.error) {
                setError(data.error)
                setMatches([])
            } else if (data.message && data.matches?.length === 0) {
                setError(data.message)
                setMatches([])
            } else {
                setMatches(data.matches || [])
            }
        } catch (err) {
            console.error("Fetch matches error:", err)
            setError("Failed to load matches. Please try again.")
            setMatches([])
        } finally {
            setLoading(false)
        }
    }

    const handleConnect = async (targetUserId: string) => {
        setConnectingId(targetUserId)
        try {
            // Check if connection already exists
            const { data: existing } = await supabase
                .from("connections")
                .select("id, status")
                .or(`and(user_id.eq.${currentUser.id},connected_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},connected_user_id.eq.${currentUser.id})`)
                .maybeSingle()

            if (existing) {
                if (existing.status === "accepted") {
                    toast({ title: "Already Connected", description: "You're already connected with this user." })
                } else {
                    toast({ title: "Request Pending", description: "Connection request already sent." })
                }
                return
            }

            // Create new connection
            const { error } = await supabase.from("connections").insert({
                user_id: currentUser.id,
                connected_user_id: targetUserId,
                status: "pending"
            })

            if (error) throw error

            toast({ title: "Request Sent!", description: "Connection request sent successfully." })
        } catch (error) {
            console.error("Connect error:", error)
            toast({
                title: "Error",
                description: "Failed to send connection request.",
                variant: "destructive"
            })
        } finally {
            setConnectingId(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] p-0">
                <DialogHeader className="p-6 pb-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">AI Skill Matches</DialogTitle>
                            <DialogDescription>
                                Users matched based on complementary skills
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="h-[60vh] px-6 py-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                            <p className="text-muted-foreground">Finding your best matches...</p>
                            <p className="text-xs text-muted-foreground mt-1">Analyzing skills and compatibility</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <AlertCircle className="w-12 h-12 text-muted-foreground/50 mb-4" />
                            <h3 className="font-medium text-foreground mb-2">No Matches Found</h3>
                            <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
                            <Button onClick={fetchMatches} variant="outline" className="mt-4">
                                Try Again
                            </Button>
                        </div>
                    ) : matches.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Users className="w-12 h-12 text-muted-foreground/50 mb-4" />
                            <h3 className="font-medium text-foreground mb-2">No Matches Yet</h3>
                            <p className="text-sm text-muted-foreground">
                                Add more skills to your profile to find better matches!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {matches.map((match) => (
                                <MatchCard
                                    key={match.user.id}
                                    user={match.user}
                                    matchScore={match.matchScore}
                                    theyCanTeach={match.theyCanTeach}
                                    youCanTeach={match.youCanTeach}
                                    matchReason={match.matchReason}
                                    onConnect={handleConnect}
                                    isConnecting={connectingId === match.user.id}
                                />
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {!loading && matches.length > 0 && (
                    <div className="p-4 border-t text-center text-sm text-muted-foreground">
                        Showing {matches.length} matches • Higher scores mean better skill exchange potential
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
