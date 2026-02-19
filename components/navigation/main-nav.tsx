"use client"

import type { User } from "@supabase/supabase-js"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Menu, X, LogOut } from "lucide-react"
import { ThemeSwitch } from "@/components/ui/theme-switch"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { InstallPWA } from "@/components/pwa/install-button"
import { useOnlineStatus } from "@/hooks/use-online-status"

export function MainNav({ user }: { user: User }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useOnlineStatus(user.id)

  useEffect(() => {
    const fetchUnreadCount = async () => {
      // 1. Get all connections for the user
      const { data: connections } = await supabase
        .from("connections")
        .select("id")
        .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`)
        .eq("status", "accepted")

      if (!connections?.length) return

      const connectionIds = connections.map(c => c.id)

      // 2. Count unread messages in these connections sent by others
      const { count } = await supabase
        .from("chat_messages")
        .select("*", { count: "exact", head: true })
        .in("connection_id", connectionIds)
        .neq("sender_id", user.id)
        .is("read_at", null)

      setUnreadCount(count || 0)

      // 3. Subscribe to changes
      const channel = supabase
        .channel("global_notifications")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "chat_messages",
          },
          async (payload) => {
            // Check if the message belongs to one of user's connections
            // @ts-ignore
            if (connectionIds.includes(payload.new.connection_id)) {
              // Refresh the count to be accurate
              const { count: newCount } = await supabase
                .from("chat_messages")
                .select("*", { count: "exact", head: true })
                .in("connection_id", connectionIds)
                .neq("sender_id", user.id)
                .is("read_at", null)

              setUnreadCount(newCount || 0)
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    fetchUnreadCount()
  }, [user.id, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Discover", href: "/discover" },
    { label: "Help Requests", href: "/help-requests" },
    { label: "Connections", href: "/connections" },
    { label: "Sessions", href: "/sessions" },
  ]

  return (
    <nav className="glass border-b border-border/50 sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold gradient-text hover:scale-105 transition-all duration-300">
            SkillSwap
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href} className="group">
                  <div
                    className={`relative px-4 py-2 text-sm font-semibold transition-colors duration-300 ${isActive
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                      }`}
                  >
                    <span className="relative">
                      {item.label}
                      <span className={`absolute -bottom-1 left-0 h-[3px] bg-primary rounded-t-full transition-all duration-300 ease-in-out ${isActive ? "w-full opacity-100" : "w-0 opacity-0 group-hover:w-full group-hover:opacity-100"}`}></span>
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <NotificationBell userId={user.id} />
            <Link
              href="/profile"
              className="flex items-center gap-2 text-sm text-muted-foreground px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="relative w-6 h-6 rounded-full bg-muted flex items-center justify-center text-foreground text-xs font-medium border border-border/20" style={{ boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.1), 0 6px 12px rgba(0,0,0,0.1)' }}>
                {user.email?.charAt(0).toUpperCase()}
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-purple-500 rounded-full border-2 border-background"></span>
              </div>
              {user.email}
            </Link>
            <InstallPWA />
            <ThemeSwitch />
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2 bg-transparent transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>

          <button
            className="md:hidden p-2 hover:bg-primary/10 rounded-lg transition-all duration-300 relative"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden mt-4 space-y-2 pb-4 animate-in fade-in slide-in-from-top duration-300">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-start relative ${isActive ? "bg-primary/10 text-primary font-semibold" : ""
                      }`}
                  >
                    {item.label}
                  </Button>
                </Link>
              )
            })}
            <div className="flex items-center gap-2">
              <NotificationBell userId={user.id} />
              <ThemeSwitch />
              <div className="md:hidden">
                <InstallPWA />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex-1 justify-start gap-2 bg-transparent"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
