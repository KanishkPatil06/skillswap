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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Star, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface RateUserDialogProps {
    userId: string
    userName: string
    trigger?: React.ReactNode
}

export function RateUserDialog({ userId, userName, trigger }: RateUserDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [rating, setRating] = useState(0)
    const [hover, setHover] = useState(0)
    const [feedback, setFeedback] = useState("")

    const supabase = createClient()
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (rating === 0) {
            toast({
                title: "Rating Required",
                description: "Please select a rating",
                variant: "destructive"
            })
            return
        }

        setLoading(true)

        try {
            // Use the reviews API which inserts into the correct `reviews` table
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reviewee_id: userId,
                    rating: rating,
                    comment: feedback || null,
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to submit rating")
            }

            toast({
                title: "Rating Submitted!",
                description: `Thank you for rating ${userName}`
            })

            setOpen(false)
            setRating(0)
            setFeedback("")
        } catch (error: any) {
            console.error("Rating error:", error)
            toast({
                title: "Error",
                description: error.message || "Failed to submit rating",
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
                        <Star className="w-4 h-4" />
                        Rate User
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <DialogHeader>
                    <DialogTitle>Rate {userName}</DialogTitle>
                    <DialogDescription>
                        Share your experience with this skill exchange
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3">
                        <Label>Rating *</Label>
                        <div className="flex gap-2 justify-center py-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHover(star)}
                                    onMouseLeave={() => setHover(0)}
                                    className="transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={cn(
                                            "w-10 h-10 transition-colors",
                                            (hover || rating) >= star
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-gray-300 dark:text-gray-600"
                                        )}
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="text-sm text-center text-muted-foreground">
                            {rating > 0 && (
                                <>
                                    {rating === 1 && "Poor"}
                                    {rating === 2 && "Fair"}
                                    {rating === 3 && "Good"}
                                    {rating === 4 && "Very Good"}
                                    {rating === 5 && "Excellent"}
                                </>
                            )}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="feedback">Feedback (Optional)</Label>
                        <Textarea
                            id="feedback"
                            placeholder="Share your thoughts about the skill exchange"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={4}
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
                        <Button type="submit" disabled={loading || rating === 0} className="flex-1 gap-2">
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Star className="w-4 h-4" />
                            )}
                            {loading ? "Submitting..." : "Submit Rating"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
