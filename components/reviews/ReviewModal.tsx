"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RatingStars } from "./RatingStars"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface ReviewModalProps {
    isOpen: boolean
    onClose: () => void
    revieweeId: string
    revieweeName: string
    onSuccess?: () => void
}

export function ReviewModal({
    isOpen,
    onClose,
    revieweeId,
    revieweeName,
    onSuccess,
}: ReviewModalProps) {
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error("Please select a rating")
            return
        }

        setIsSubmitting(true)

        try {
            const response = await fetch("/api/reviews", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    reviewee_id: revieweeId,
                    rating,
                    comment,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to submit review")
            }

            toast.success("Review submitted successfully!")
            onSuccess?.()
            onClose()
            setRating(0)
            setComment("")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Review {revieweeName}</DialogTitle>
                    <DialogDescription>
                        Share your experience with {revieweeName}. Your feedback helps the community.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex flex-col items-center gap-2">
                        <Label htmlFor="rating">Rating</Label>
                        <RatingStars
                            rating={rating}
                            maxRating={5}
                            interactive
                            onRatingChange={setRating}
                            size="lg"
                        />
                    </div>
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="comment">Comment (Optional)</Label>
                        <Textarea
                            id="comment"
                            placeholder="Tell us more about your experience..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Review
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
