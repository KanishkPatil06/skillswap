"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Clock, Video, User as UserIcon, Loader2, CheckCircle2, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { AvailabilitySettings } from "@/components/sessions/availability-settings"
import { toast } from "sonner"
import type { User } from "@supabase/supabase-js"
import { SessionReviewModal } from "@/components/reviews/session-review-modal"

interface Session {
    id: string
    mentor_id: string
    learner_id: string
    skill_id: string
    scheduled_at: string
    duration_minutes: number
    status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
    meeting_link?: string
    notes?: string
    created_at: string
    mentor: { full_name: string; avatar_url: string }
    learner: { full_name: string; avatar_url: string }
    skill: { name: string }
    reviews: { reviewer_id: string }[]
}

export function MySessions({ user }: { user: User }) {
    const [sessions, setSessions] = useState<Session[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("upcoming")

    useEffect(() => {
        fetchSessions()
    }, [user.id])

    const fetchSessions = async () => {
        try {
            setLoading(true)
            const supabase = createClient()

            const { data, error } = await supabase
                .from('sessions')
                .select(`
          *,
          mentor:mentor_id(full_name, avatar_url),
          learner:learner_id(full_name, avatar_url),
          skill:skill_id(name),
          reviews(reviewer_id)
        `)
                .or(`mentor_id.eq.${user.id},learner_id.eq.${user.id}`)
                .order('scheduled_at', { ascending: true })

            if (error) {
                console.error('Supabase error fetching sessions:', error)
                throw error
            }
            // cast fetched data to Session[]
            const typedData = data?.map((item: any) => ({
                ...item,
                reviews: item.reviews || []
            })) as Session[]

            console.log("Fetched sessions:", typedData)
            setSessions(typedData || [])
        } catch (error) {
            console.error('Error fetching sessions:', error)
            toast.error('Failed to load sessions')
        } finally {
            setLoading(false)
        }
    }

    const upcomingSessions = sessions.filter(session =>
        new Date(session.scheduled_at) > new Date() && session.status !== 'cancelled'
    )

    const pastSessions = sessions.filter(session =>
        new Date(session.scheduled_at) <= new Date() || session.status === 'cancelled'
    )

    const SessionCard = ({ session }: { session: Session }) => {
        const isMentor = session.mentor_id === user.id
        const otherPerson = isMentor ? session.learner : session.mentor
        const role = isMentor ? "Mentor" : "Learner"
        const hasReviewed = session.reviews?.some(r => r.reviewer_id === user.id)

        // Debug log for missing data
        if (!otherPerson) {
            console.warn("Missing profile data for session:", session.id, "Is Mentor:", isMentor)
        }

        return (
            <Card className="mb-4">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-semibold overflow-hidden">
                                {otherPerson?.avatar_url ? (
                                    <img src={otherPerson.avatar_url} alt={otherPerson.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{otherPerson?.full_name?.[0] || "?"}</span>
                                )}
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">{session.skill?.name || "Unknown Skill"}</h3>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <UserIcon className="w-4 h-4" />
                                    <span>with {otherPerson?.full_name || "Unknown User"} ({role})</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                    <CalendarIcon className="w-4 h-4" />
                                    <span>{new Date(session.scheduled_at).toLocaleDateString()}</span>
                                    <Clock className="w-4 h-4 ml-2" />
                                    <span>{format(new Date(session.scheduled_at), "p")} ({session.duration_minutes} min)</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <Badge variant={
                                session.status === 'scheduled' ? 'default' : // Status used to be 'confirmed' / 'pending' but DB says 'scheduled'
                                    session.status === 'completed' ? 'secondary' :
                                        session.status === 'cancelled' ? 'destructive' : 'outline'
                            }>
                                {session.status.toUpperCase()}
                            </Badge>

                            {session.status === 'scheduled' && (
                                <Button
                                    className="w-full md:w-auto"
                                    variant="outline"
                                    onClick={async () => {
                                        try {
                                            toast.loading("Joining session...")
                                            // The page.tsx now handles access without meeting_link
                                            window.location.href = `/sessions/room/${session.id}`
                                        } catch (e) {
                                            toast.dismiss()
                                            toast.error("Could not join session")
                                        }
                                    }}
                                >
                                    <Video className="w-4 h-4 mr-2" />
                                    Join Meeting
                                </Button>
                            )}

                            {(session.status === 'scheduled' || session.status === 'completed' || session.status === 'cancelled') && (
                                <Button
                                    className="w-full md:w-auto"
                                    variant="destructive"
                                    onClick={async () => {
                                        if (!confirm("Are you sure you want to delete this session? This action cannot be undone.")) return;

                                        try {
                                            toast.loading("Deleting session...")
                                            const response = await fetch(`/api/sessions?sessionId=${session.id}`, {
                                                method: 'DELETE',
                                            })

                                            if (!response.ok) throw new Error("Failed to delete")

                                            toast.dismiss()
                                            toast.success("Session deleted")
                                            fetchSessions()
                                        } catch (e) {
                                            toast.dismiss()
                                            toast.error("Could not delete session")
                                        }
                                    }}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </Button>
                            )}

                            {session.status === 'scheduled' && new Date(session.scheduled_at) < new Date() && (
                                <Button
                                    className="w-full md:w-auto"
                                    variant="outline"
                                    onClick={async () => {
                                        try {
                                            toast.loading("Updating session...")
                                            const response = await fetch('/api/sessions', {
                                                method: 'PATCH',
                                                body: JSON.stringify({ sessionId: session.id, status: 'completed' })
                                            })

                                            if (!response.ok) throw new Error("Failed to update")

                                            toast.dismiss()
                                            toast.success("Session marked as completed")
                                            fetchSessions()
                                        } catch (e) {
                                            toast.dismiss()
                                            toast.error("Could not update session")
                                        }
                                    }}
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Mark Completed
                                </Button>
                            )}

                            {session.status === 'completed' && !hasReviewed && (
                                <SessionReviewModal
                                    sessionId={session.id}
                                    revieweeId={isMentor ? session.learner_id : session.mentor_id}
                                    revieweeName={otherPerson?.full_name || "User"}
                                    onReviewSubmitted={fetchSessions}
                                >
                                    <Button size="sm" variant="outline" className="gap-2">
                                        <div className="w-4 h-4" /> {/* Placeholder icon */}
                                        Rate Session
                                    </Button>
                                </SessionReviewModal>
                            )}
                            {session.status === 'completed' && hasReviewed && (
                                <Button size="sm" variant="ghost" disabled className="text-muted-foreground">
                                    Reviewed
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">My Sessions</h2>
            </div>

            <Tabs defaultValue="upcoming" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="past">Past</TabsTrigger>
                    <TabsTrigger value="availability">Availability</TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="space-y-4">
                    {upcomingSessions.length > 0 ? (
                        upcomingSessions.map(session => (
                            <SessionCard key={session.id} session={session} />
                        ))
                    ) : (
                        <div className="text-center py-12 border rounded-lg bg-muted/10">
                            <p className="text-muted-foreground">No upcoming sessions</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="past" className="space-y-4">
                    {pastSessions.length > 0 ? (
                        pastSessions.map(session => (
                            <SessionCard key={session.id} session={session} />
                        ))
                    ) : (
                        <div className="text-center py-12 border rounded-lg bg-muted/10">
                            <p className="text-muted-foreground">No past sessions</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="availability">
                    <Card>
                        <CardHeader>
                            <CardTitle>Availability Settings</CardTitle>
                            <CardDescription>
                                Set your weekly availability for sessions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AvailabilitySettings userId={user.id} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
