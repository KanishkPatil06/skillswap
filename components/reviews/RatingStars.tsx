"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface RatingStarsProps {
    rating: number
    maxRating?: number
    interactive?: boolean
    onRatingChange?: (rating: number) => void
    size?: "sm" | "md" | "lg"
    className?: string
}

export function RatingStars({
    rating,
    maxRating = 5,
    interactive = false,
    onRatingChange,
    size = "md",
    className,
}: RatingStarsProps) {
    const [hoverRating, setHoverRating] = useState<number | null>(null)

    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-6 h-6",
    }

    return (
        <div className={cn("flex items-center gap-0.5", className)}>
            {Array.from({ length: maxRating }).map((_, index) => {
                const starValue = index + 1
                const isFilled = (hoverRating !== null ? hoverRating : rating) >= starValue

                return (
                    <Star
                        key={index}
                        className={cn(
                            sizeClasses[size],
                            "transition-colors",
                            isFilled
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-muted text-muted-foreground",
                            interactive ? "cursor-pointer hover:scale-110" : ""
                        )}
                        onMouseEnter={() => interactive && setHoverRating(starValue)}
                        onMouseLeave={() => interactive && setHoverRating(null)}
                        onClick={() => interactive && onRatingChange?.(starValue)}
                    />
                )
            })}
        </div>
    )
}
