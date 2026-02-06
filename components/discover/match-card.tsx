"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { UserPlus, Loader2, ArrowRight, ArrowLeft, Sparkles } from "lucide-react"

interface MatchCardProps {
    user: {
        id: string
        full_name: string | null
        bio: string | null
    }
    matchScore: number
    theyCanTeach: string[]
    youCanTeach: string[]
    matchReason: string
    onConnect: (userId: string) => void
    isConnecting: boolean
}

export function MatchCard({
    user,
    matchScore,
    theyCanTeach,
    youCanTeach,
    matchReason,
    onConnect,
    isConnecting
}: MatchCardProps) {
    const getInitials = (name: string | null) => {
        if (!name) return "?"
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-emerald-500"
        if (score >= 60) return "text-blue-500"
        if (score >= 40) return "text-amber-500"
        return "text-gray-500"
    }

    const getProgressColor = (score: number) => {
        if (score >= 80) return "bg-emerald-500"
        if (score >= 60) return "bg-blue-500"
        if (score >= 40) return "bg-amber-500"
        return "bg-gray-500"
    }

    return (
        <Card className="border border-border/50 bg-card hover:shadow-lg transition-all duration-300 overflow-hidden">
            <CardContent className="p-5">
                {/* Header with Score */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-foreground font-bold text-lg border-2 border-primary/30"
                        >
                            {getInitials(user.full_name)}
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-foreground">
                                {user.full_name || "Anonymous"}
                            </h3>
                            {user.bio && (
                                <p className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
                                    {user.bio}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(matchScore)}`}>
                            {matchScore}%
                        </div>
                        <div className="text-xs text-muted-foreground">Match</div>
                    </div>
                </div>

                {/* Match Score Bar */}
                <div className="mb-4">
                    <Progress value={matchScore} className="h-2" />
                </div>

                {/* AI Match Reason */}
                <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-foreground">{matchReason}</p>
                    </div>
                </div>

                {/* Skills Exchange */}
                <div className="space-y-3 mb-4">
                    {theyCanTeach.length > 0 && (
                        <div className="flex items-start gap-2">
                            <ArrowLeft className="w-4 h-4 text-emerald-500 mt-1 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">They can teach you</p>
                                <div className="flex flex-wrap gap-1">
                                    {theyCanTeach.map((skill) => (
                                        <Badge
                                            key={skill}
                                            variant="secondary"
                                            className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                        >
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {youCanTeach.length > 0 && (
                        <div className="flex items-start gap-2">
                            <ArrowRight className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">You can teach them</p>
                                <div className="flex flex-wrap gap-1">
                                    {youCanTeach.map((skill) => (
                                        <Badge
                                            key={skill}
                                            variant="secondary"
                                            className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                        >
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Connect Button */}
                <Button
                    onClick={() => onConnect(user.id)}
                    disabled={isConnecting}
                    className="w-full gap-2"
                >
                    {isConnecting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <UserPlus className="w-4 h-4" />
                    )}
                    Connect
                </Button>
            </CardContent>
        </Card>
    )
}
