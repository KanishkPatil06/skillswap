"use client"

import type { User } from "@supabase/supabase-js"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { MainNav } from "@/components/navigation/main-nav"
import { useRouter } from "next/navigation"
import {
  Users, MessageSquare, HelpCircle,
  User as UserIcon, ArrowRight, Sparkles,
  BookOpen, Clock, Star, Trophy, ArrowUpRight
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { StatCard } from "./stat-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GlowingCard } from "@/components/ui/glowing-card"
import { AnimatedAvatar } from "@/components/ui/animated-avatar"

import { subDays, isAfter, isBefore, parseISO } from "date-fns"

export default function DashboardContent({ user }: { user: User }) {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    skills: 0,
    connections: 0,
    requests: 0,
    sessions_completed: 0,
    learning_hours: 0,
    reputation_score: 0,
    // Trends
    sessions_trend: "",
    sessions_trend_up: true,
    learning_trend: "",
    learning_trend_up: true,
    connections_trend: "",
    connections_trend_up: true
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchProfile = async () => {
    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    const { data: userSkills } = await supabase.from("user_skills").select("*").eq("user_id", user.id)
    const { data: connections } = await supabase
      .from("connections")
      .select("*")
      .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`)
      .eq("status", "accepted")

    const { data: requests } = await supabase
      .from("help_requests")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "open")

    const { data: sessions } = await supabase
      .from("sessions")
      .select("*")
      .or(`initiator_id.eq.${user.id},participant_id.eq.${user.id}`)

    // Process Sessions & Learning Hours
    const completedSessions = sessions?.filter(s => s.status === 'completed') || []
    const learningSessions = completedSessions.filter(s => s.initiator_id === user.id)

    const totalMinutes = learningSessions.reduce((acc, s) => acc + (s.duration_minutes || 60), 0)
    const learningHours = parseFloat((totalMinutes / 60).toFixed(1))

    // Growth Calculations (Last 7 Days vs Previous 7 Days)
    const now = new Date()
    const oneWeekAgo = subDays(now, 7)
    const twoWeeksAgo = subDays(now, 14)

    // Sessions Growth
    const currentWeekSessions = completedSessions.filter(s =>
      s.completed_at && isAfter(parseISO(s.completed_at), oneWeekAgo)
    ).length

    const previousWeekSessions = completedSessions.filter(s =>
      s.completed_at &&
      isAfter(parseISO(s.completed_at), twoWeeksAgo) &&
      isBefore(parseISO(s.completed_at), oneWeekAgo)
    ).length

    const sessionGrowth = previousWeekSessions === 0
      ? currentWeekSessions * 100
      : Math.round(((currentWeekSessions - previousWeekSessions) / previousWeekSessions) * 100)

    // Learning Hours Growth
    const currentWeekMinutes = learningSessions
      .filter(s => s.completed_at && isAfter(parseISO(s.completed_at), oneWeekAgo))
      .reduce((acc, s) => acc + (s.duration_minutes || 60), 0)

    const previousWeekMinutes = learningSessions
      .filter(s => s.completed_at && isAfter(parseISO(s.completed_at), twoWeeksAgo) && isBefore(parseISO(s.completed_at), oneWeekAgo))
      .reduce((acc, s) => acc + (s.duration_minutes || 60), 0)

    const learningGrowth = previousWeekMinutes === 0
      ? (currentWeekMinutes > 0 ? 100 : 0)
      : Math.round(((currentWeekMinutes - previousWeekMinutes) / previousWeekMinutes) * 100)

    setProfile(profileData)
    setStats({
      skills: userSkills?.length || 0,
      connections: connections?.length || 0,
      requests: requests?.length || 0,
      sessions_completed: completedSessions.length,
      learning_hours: learningHours,
      reputation_score: profileData?.rating_score || 0,
      // Trends
      sessions_trend: `${sessionGrowth > 0 ? '+' : ''}${sessionGrowth}% this week`,
      sessions_trend_up: sessionGrowth >= 0,
      learning_trend: `${learningGrowth > 0 ? '+' : ''}${learningGrowth}% vs last week`,
      learning_trend_up: learningGrowth >= 0,
      connections_trend: "New request",
      connections_trend_up: true
    })
    setLoading(false)
  }

  useEffect(() => {
    fetchProfile()

    // Realtime Subscription
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
        fetchProfile()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'help_requests' }, () => {
        fetchProfile()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, () => {
        fetchProfile()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, () => {
        fetchProfile()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user.id, supabase])

  const getInitials = (name: string | null) => {
    if (!name) return user.email?.charAt(0).toUpperCase() || "?"
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
  }

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 overflow-hidden relative">
      <MainNav user={user} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* Header Section */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <motion.div variants={item}>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                Welcome back, {user.user_metadata?.full_name?.split(' ')[0] || 'User'}
              </h1>
              <p className="mt-2 text-lg text-muted-foreground">
                Your skill exchange dashboard is looking active today.
              </p>
            </motion.div>

            <motion.div variants={item}>
              <Button
                onClick={() => router.push('/discover')}
                size="lg"
                className="group relative overflow-hidden bg-primary/90 hover:bg-primary transition-all duration-300 shadow-lg shadow-primary/25 rounded-full px-8"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Find Mentors
                </span>
                <div className="absolute inset-0 -translate-x-[100%] group-hover:translate-x-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000" />
              </Button>
            </motion.div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={BookOpen}
              label="Sessions"
              value={stats.sessions_completed}
              trend={stats.sessions_trend}
              trendUp={stats.sessions_trend_up}
              delay={0.1}
              colorClass="text-blue-500"
            />
            <StatCard
              icon={Clock}
              label="Learning Hours"
              value={stats.learning_hours}
              trend={stats.learning_trend}
              trendUp={stats.learning_trend_up}
              delay={0.2}
              colorClass="text-violet-500"
            />
            <StatCard
              icon={Star}
              label="Reputation"
              value={stats.reputation_score}
              delay={0.3}
              colorClass="text-amber-500"
            />
            <StatCard
              icon={Users}
              label="Connections"
              value={stats.connections}
              trend={stats.connections_trend}
              trendUp={stats.connections_trend_up}
              delay={0.4}
              colorClass="text-pink-500"
            />
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 h-full">
            {/* Quick Actions - Large Card */}
            {/* Quick Actions - Large Card */}
            <GlowingCard
              variants={item}
              className="lg:col-span-2 p-0 bg-transparent border-0"
              gradient="from-blue-500/10 via-purple-500/10 to-transparent"
            >
              <div className="h-full rounded-[20px] bg-black/40 border border-white/5 p-6 md:p-8 backdrop-blur-xl">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-semibold tracking-tight">Quick Actions</h2>
                  <div className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-md border border-white/5">
                    Shortcuts
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { title: "Discover People", desc: "Find skilled individuals", icon: Users, href: "/discover", color: "from-blue-500/20" },
                    { title: "Help Requests", desc: "Ask the community", icon: HelpCircle, href: "/help-requests", color: "from-purple-500/20" },
                    { title: "Direct Messages", desc: "Chat with contacts", icon: MessageSquare, href: "/connections", color: "from-pink-500/20" },
                    { title: "Edit Profile", desc: "Update your skills", icon: UserIcon, href: "/profile", color: "from-orange-500/20" },
                  ].map((action, i) => (
                    <Link key={i} href={action.href}>
                      <div className="group relative flex h-full flex-col justify-between rounded-2xl border border-white/5 bg-white/5 p-5 transition-all duration-300 hover:scale-[1.02] hover:bg-white/10 hover:shadow-lg dark:hover:bg-white/10 overflow-hidden">
                        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${action.color} to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="rounded-xl bg-background/50 p-2.5 shadow-sm backdrop-blur-sm border border-white/5">
                            <action.icon className="h-5 w-5 text-foreground" />
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                        </div>
                        <div className="relative z-10 mt-4">
                          <h3 className="font-semibold text-foreground">{action.title}</h3>
                          <p className="text-sm text-muted-foreground">{action.desc}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Leaderboard Banner */}
                <Link href="/leaderboard" className="mt-4 block group">
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-transparent p-5 transition-all duration-300 hover:scale-[1.01] border border-amber-500/20">
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-amber-500/20 p-2 border border-amber-500/20">
                          <Trophy className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">Community Leaderboard</h3>
                          <p className="text-sm text-muted-foreground">See who's topping the charts this week</p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-amber-500 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              </div>
            </GlowingCard>

            {/* Profile Card */}
            {/* Profile Card */}
            <GlowingCard
              variants={item}
              className="p-0 bg-transparent border-0"
              gradient="from-pink-500/10 via-rose-500/10 to-transparent"
              delay={0.2}
            >
              <div className="flex h-full flex-col items-center justify-center rounded-[20px] bg-black/40 border border-white/5 p-6 text-center backdrop-blur-xl">
                <div className="relative mb-6">
                  <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 blur-xl opacity-50 animate-pulse" />
                  <AnimatedAvatar
                    src={profile?.avatar_url}
                    fallback={getInitials(profile?.full_name)}
                    className="h-28 w-28 border-4 border-black relative z-10"
                  />
                </div>

                <h3 className="text-xl font-bold tracking-tight">{profile?.full_name || user.email?.split('@')[0]}</h3>
                <p className="text-sm text-muted-foreground mb-6 line-clamp-2 px-4">{profile?.bio || "No bio yet"}</p>

                <div className="grid w-full grid-cols-2 gap-3 mb-6 px-2">
                  <div className="rounded-2xl bg-white/5 p-4 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="text-2xl font-bold tracking-tight text-white">{stats.skills}</div>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-1">Skills</div>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="text-2xl font-bold tracking-tight text-white">{stats.reputation_score}</div>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-1">Score</div>
                  </div>
                </div>

                <div className="w-full px-2">
                  <Link href="/profile" className="block w-full">
                    <Button variant="outline" className="w-full rounded-full border-white/10 bg-white/5 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all h-10 font-medium">
                      View Full Profile
                    </Button>
                  </Link>
                </div>
              </div>
            </GlowingCard>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

