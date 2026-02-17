"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trophy, Medal, Crown } from "lucide-react"

interface LeaderboardUser {
    id: string
    full_name: string
    avatar_url: string
    points: number
    user_badges: {
        badges: {
            name: string
            icon_url: string
        }
    }[]
}

export function Leaderboard() {
    const [users, setUsers] = useState<LeaderboardUser[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await fetch('/api/gamification/leaderboard')
                if (res.ok) {
                    const data = await res.json()
                    setUsers(data)
                }
            } catch (error) {
                console.error("Failed to fetch leaderboard", error)
            } finally {
                setLoading(false)
            }
        }

        fetchLeaderboard()
    }, [])

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <Crown className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            case 1: return <Medal className="w-5 h-5 text-gray-400 fill-gray-400" />
            case 2: return <Medal className="w-5 h-5 text-amber-700 fill-amber-700" />
            default: return <span className="font-bold text-muted-foreground w-5 text-center">{index + 1}</span>
        }
    }

    if (loading) {
        return <div className="text-center p-8 text-muted-foreground">Loading leaderboard...</div>
    }

    return (
        <div className="w-full overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="p-6 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-b">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Trophy className="text-yellow-500" />
                    Leaderboard
                </h2>
                <p className="text-muted-foreground">Top learners and mentors in the community</p>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px] text-center">Rank</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead className="hidden md:table-cell">Badges</TableHead>
                        <TableHead className="text-right">Points</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user, index) => (
                        <TableRow key={user.id} className={index < 3 ? "bg-muted/10 font-medium" : ""}>
                            <TableCell className="text-center font-bold">
                                <div className="flex justify-center">{getRankIcon(index)}</div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-8 h-8 md:w-10 md:h-10 border-2 border-background shadow-sm">
                                        <AvatarImage src={user.avatar_url} />
                                        <AvatarFallback>{user.full_name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span>{user.full_name}</span>
                                        <span className="text-xs text-muted-foreground md:hidden">{user.points} pts</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                                <div className="flex -space-x-1.5 overflow-hidden p-1">
                                    {user.user_badges?.slice(0, 5).map((ub, i) => (
                                        <div key={i} className="bg-background rounded-full p-0.5 border shadow-sm" title={ub.badges?.name}>
                                            <span className="text-lg leading-none select-none grayscale-0">{ub.badges?.icon_url}</span>
                                        </div>
                                    ))}
                                    {user.user_badges?.length > 5 && (
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium border border-background">
                                            +{user.user_badges.length - 5}
                                        </div>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-bold text-primary">
                                {user.points.toLocaleString()}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
