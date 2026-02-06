"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SessionBookingDialogProps {
    connectionId: string
    participantId: string
    participantName: string
    trigger?: React.ReactNode
}

export function SessionBookingDialog({
    connectionId,
    participantId,
    participantName,
    trigger
}: SessionBookingDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        skill: "",
        date: "",
        time: "",
        duration: "60"
    })

    const supabase = createClient()
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            // Combine date and time
            const scheduledAt = new Date(`${formData.date}T${formData.time}:00`)

            const { data, error } = await supabase.rpc('create_session', {
                p_connection_id: connectionId,
                p_initiator_id: user.id,
                p_participant_id: participantId,
                p_title: formData.title,
                p_description: formData.description,
                p_skill_to_teach: formData.skill,
                p_scheduled_at: scheduledAt.toISOString(),
                p_duration_minutes: parseInt(formData.duration)
            })

            if (error) throw error

            toast({
                title: "Session Requested!",
                description: `Your session request has been sent to ${participantName}`
            })

            setOpen(false)
            setFormData({
                title: "",
                description: "",
                skill: "",
                date: "",
                time: "",
                duration: "60"
            })
        } catch (error) {
            console.error("Session booking error:", error)
            toast({
                title: "Error",
                description: "Failed to book session",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <Calendar className="w-4 h-4" />
                        Book Session
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <DialogHeader>
                    <DialogTitle>Book a Skill Exchange Session</DialogTitle>
                    <DialogDescription>
                        Schedule a session with {participantName}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Session Title *</Label>
                        <Input
                            id="title"
                            placeholder="e.g., React Hooks Deep Dive"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="skill">Skill to Teach/Learn *</Label>
                        <Input
                            id="skill"
                            placeholder="e.g., React, Python, Design"
                            value={formData.skill}
                            onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="What would you like to cover in this session?"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date *</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                min={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="time">Time *</Label>
                            <Input
                                id="time"
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="duration">Duration (minutes) *</Label>
                        <Input
                            id="duration"
                            type="number"
                            min="15"
                            step="15"
                            value={formData.duration}
                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                            required
                        />
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-1 gap-2">
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Calendar className="w-4 h-4" />
                            )}
                            {loading ? "Booking..." : "Book Session"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
