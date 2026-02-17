"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, Lock } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface BadgeItem {
    id: string
    name: string
    description: string
    icon_url: string
    category: string
    required_points: number
}

interface BadgeListProps {
    userId: string
    className?: string
}

export function BadgeList({ userId, className }: BadgeListProps) {
    const [badges, setBadges] = useState<BadgeItem[]>([])
    const [earnedBadgeIds, setEarnedBadgeIds] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchBadges = async () => {
            setLoading(true)

            // 1. Fetch all badges
            const { data: allBadges } = await supabase
                .from("badges")
                .select("*")
                .order("required_points", { ascending: true })

            // 2. Fetch user's earned badges
            const { data: userBadges } = await supabase
                .from("user_badges")
                .select("badge_id")
                .eq("user_id", userId)

            if (allBadges) setBadges(allBadges)
            if (userBadges) {
                setEarnedBadgeIds(new Set(userBadges.map(b => b.badge_id)))
            }

            setLoading(false)
        }

        fetchBadges()
    }, [userId, supabase])

    if (loading) {
        return <div className="text-sm text-muted-foreground animate-pulse">Loading badges...</div>
    }

    return (
        <div className={className}>
            <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold text-lg">Badges & Achievements</h3>
            </div>

            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {badges.map((badge) => {
                    const isEarned = earnedBadgeIds.has(badge.id)

                    return (
                        <TooltipProvider key={badge.id}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className={`
                      flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-300
                      ${isEarned
                                                ? "bg-gradient-to-br from-yellow-50 to-amber-100 border-amber-200 dark:from-yellow-900/20 dark:to-amber-900/10 dark:border-amber-900/30 scale-100 opacity-100 shadow-sm"
                                                : "bg-muted/30 border-dashed border-border opacity-60 grayscale hover:opacity-80 hover:scale-105"
                                            }
                    `}
                                    >
                                        <div className="text-2xl mb-1 filter drop-shadow-sm">
                                            {isEarned ? badge.icon_url : "🔒"}
                                        </div>
                                        <div className="text-xs font-medium truncate w-full">
                                            {badge.name}
                                        </div>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <div className="text-center">
                                        <p className="font-semibold">{badge.name}</p>
                                        <p className="text-xs text-muted-foreground">{badge.description}</p>
                                        {!isEarned && (
                                            <p className="text-xs text-amber-600 mt-1">Requires {badge.required_points} points</p>
                                        )}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )
                })}
            </div>
        </div>
    )
}
