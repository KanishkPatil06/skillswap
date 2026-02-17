"use client"

import { Leaderboard } from "@/components/gamification/leaderboard"
import { MainNav } from "@/components/navigation/main-nav"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { BadgeList } from "@/components/gamification/badge-list"
import { Card, CardContent } from "@/components/ui/card"

export default function LeaderboardPage() {
    const [user, setUser] = useState<User | null>(null)
    const supabase = createClient()

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        getUser()
    }, [supabase])

    if (!user) return null

    return (
        <div className="min-h-screen bg-background pb-20">
            <MainNav user={user} />
            <main className="container max-w-5xl mx-auto px-4 py-8 space-y-8">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Main Leaderboard - Takes 2 cols */}
                    <div className="md:col-span-2">
                        <Leaderboard />
                    </div>

                    {/* Sidebar - My Stats */}
                    <div className="space-y-6">
                        <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-500 to-purple-600 text-white overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-10 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                            <CardContent className="p-6 relative z-10">
                                <h3 className="text-lg font-semibold mb-2 opacity-90">My Performance</h3>
                                <div className="text-4xl font-bold mb-1">
                                    {/* TODO: Add real point count here by fetching profile again or passing prop */}
                                    Stats
                                </div>
                                <p className="text-sm opacity-75">Keep learning to earn more points!</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <BadgeList userId={user.id} />
                            </CardContent>
                        </Card>
                    </div>
                </div>

            </main>
        </div>
    )
}
