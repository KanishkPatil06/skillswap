"use client"

import type { User } from "@supabase/supabase-js"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Menu, X, LogOut } from "lucide-react"

export function MainNav({ user }: { user: User }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Discover", href: "/discover" },
    { label: "Help Requests", href: "/help-requests" },
    { label: "Connections", href: "/connections" },
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
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`transition-all duration-300 ${isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "hover:bg-primary/5"
                      }`}
                  >
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <span className="text-sm text-muted-foreground px-3 py-1 rounded-full bg-muted/50">
              {user.email}
            </span>
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
            className="md:hidden p-2 hover:bg-primary/10 rounded-lg transition-all duration-300"
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
                    className={`w-full justify-start ${isActive ? "bg-primary/10 text-primary font-semibold" : ""
                      }`}
                  >
                    {item.label}
                  </Button>
                </Link>
              )
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start gap-2 bg-transparent"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}
