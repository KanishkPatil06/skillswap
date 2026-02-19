"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Plus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface LogLearningModalProps {
    userId: string
    onSuccess?: () => void
}

export function LogLearningModal({ userId, onSuccess }: LogLearningModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [skillName, setSkillName] = useState("")
    const [description, setDescription] = useState("")
    const [duration, setDuration] = useState("60")
    const { toast } = useToast()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!skillName || !duration) return

        setLoading(true)
        try {
            const { error } = await supabase
                .from("learning_logs")
                .insert({
                    user_id: userId,
                    skill_name: skillName,
                    description: description,
                    duration_minutes: parseInt(duration),
                    learned_at: new Date().toISOString()
                })

            if (error) throw error

            toast({
                title: "Learning logged!",
                description: `Added ${duration} minutes of ${skillName}.`,
            })

            setOpen(false)
            setSkillName("")
            setDescription("")
            setDuration("60")

            if (onSuccess) {
                onSuccess()
            }
        } catch (error: any) {
            console.error("Error logging learning:", error)
            toast({
                title: "Error",
                description: "Failed to log learning time. Please try again.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 hover:bg-primary/10 hover:text-primary transition-all">
                    <Plus className="w-4 h-4" />
                    Log Learning
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Log Learning Time</DialogTitle>
                    <DialogDescription>
                        Track your self-study hours to improve your stats.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="skill">Skill / Topic</Label>
                        <Input
                            id="skill"
                            placeholder="e.g. React, Python, Design..."
                            value={skillName}
                            onChange={(e) => setSkillName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="duration">Duration (minutes)</Label>
                        <Input
                            id="duration"
                            type="number"
                            min="1"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="What did you learn today?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Log Time"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
