"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Star, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface SessionReviewModalProps {
    sessionId: string
    revieweeId: string
    revieweeName: string
    onReviewSubmitted?: () => void
    children?: React.ReactNode
}

export function SessionReviewModal({
    sessionId,
    revieweeId,
    revieweeName,
    onReviewSubmitted,
    children
}: SessionReviewModalProps) {
    const [open, setOpen] = useState(false)
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [comment, setComment] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (rating === 0) {
            toast.error("Please select a rating")
            return
        }

        setIsSubmitting(true)
        try {
            const response = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionId,
                    reviewee_id: revieweeId,
                    rating,
                    comment
                })
            })

            const data = await response.json()

            if (!response.ok) {
                if (response.status === 409) {
                    toast.error("You have already reviewed this session")
                    // Close modal anyway since they can't re-submit
                    setOpen(false)
                    onReviewSubmitted?.()
                    router.refresh()
                } else {
                    throw new Error(data.error || "Failed to submit review")
                }
                return
            }

            toast.success("Review submitted successfully!")
            setOpen(false)
            onReviewSubmitted?.()
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || <Button variant="outline">Write Review</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Review Session</DialogTitle>
                    <DialogDescription>
                        How was your session with {revieweeName}?
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="flex flex-col items-center gap-2">
                        <Label>Rating</Label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className="text-2xl focus:outline-none transition-transform hover:scale-110"
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                >
                                    <Star
                                        className={`w-8 h-8 ${(hoverRating || rating) >= star
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-muted-foreground"
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="comment">Feedback (Optional)</Label>
                        <Textarea
                            id="comment"
                            placeholder="Share your experience..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || rating === 0}>
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Submit Review
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
