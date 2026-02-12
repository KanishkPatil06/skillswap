"use client"

import { useEffect, useState } from "react"
import { RatingStars } from "./RatingStars"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { Loader2 } from "lucide-react"

interface Review {
    id: string
    rating: number
    comment: string
    created_at: string
    reviewer: {
        id: string
        full_name: string
        avatar_url: string
    }
}

interface ReviewListProps {
    userId: string
}

export function ReviewList({ userId }: ReviewListProps) {
    const [reviews, setReviews] = useState<Review[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await fetch(`/api/reviews?userId=${userId}`)
                if (!response.ok) {
                    throw new Error("Failed to fetch reviews")
                }
                const data = await response.json()
                setReviews(data)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setIsLoading(false)
            }
        }

        if (userId) {
            fetchReviews()
        }
    }, [userId])

    if (isLoading) {
        return (
            <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error) {
        return <div className="text-red-500 p-4">Error loading reviews: {error}</div>
    }

    if (reviews.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                    No reviews yet.
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Reviews ({reviews.length})</h3>
            {reviews.map((review) => (
                <Card key={review.id}>
                    <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
                        <Avatar>
                            <AvatarImage src={review.reviewer.avatar_url} alt={review.reviewer.full_name} />
                            <AvatarFallback>{review.reviewer.full_name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium">{review.reviewer.full_name}</h4>
                                <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                                </span>
                            </div>
                            <RatingStars rating={review.rating} size="sm" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
