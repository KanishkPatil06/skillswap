import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LoginButton } from "@/components/auth/login-button"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Sparkles, Users, MessageCircle, TrendingUp, Shield, Zap } from "lucide-react"
import { ThemeSwitch } from "@/components/ui/theme-switch"

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 animate-gradient">
      <nav className="glass border-b border-border/50 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold gradient-text">SkillSwap</div>
          <div className="flex items-center gap-3">
            <ThemeSwitch />
            <LoginButton />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-20">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-32">
          <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>Community-Driven Learning</span>
            </div>

            <h1 className="text-6xl font-bold leading-tight">
              Learn from{" "}
              <span className="gradient-text">Real People</span>
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed">
              Connect with skilled professionals and community members. Exchange knowledge, get mentorship, and grow
              together through transparent, experience-based learning.
            </p>

            <div className="flex gap-4">
              <LoginButton />
              <Link href="#features">
                <Button variant="outline" size="lg" className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  Explore Features
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-8">
              <div>
                <div className="text-3xl font-bold gradient-text">1000+</div>
                <div className="text-sm text-muted-foreground">Skills Shared</div>
              </div>
              <div>
                <div className="text-3xl font-bold gradient-text">500+</div>
                <div className="text-sm text-muted-foreground">Active Learners</div>
              </div>
              <div>
                <div className="text-3xl font-bold gradient-text">100%</div>
                <div className="text-sm text-muted-foreground">Free Forever</div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-8 space-y-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-in fade-in slide-in-from-right duration-700">
            {[
              {
                icon: Users,
                title: "Discover Skills",
                desc: "Browse and find people with expertise",
                gradient: "gradient-primary"
              },
              {
                icon: MessageCircle,
                title: "Build Connections",
                desc: "Connect with mentors and learners",
                gradient: "gradient-secondary"
              },
              {
                icon: TrendingUp,
                title: "Exchange Knowledge",
                desc: "Learn through real conversations",
                gradient: "gradient-tertiary"
              },
            ].map((feature, i) => {
              const Icon = feature.icon
              return (
                <div key={i} className="flex gap-4 group">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${feature.gradient} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:glow-primary`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold">Why SkillSwap?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A modern platform designed for authentic learning and meaningful connections
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Community-Driven",
                desc: "No misleading influencers or paid courses. Real people sharing real expertise.",
                gradient: "gradient-primary",
              },
              {
                icon: TrendingUp,
                title: "Transparent Learning",
                desc: "Grow your skills through contributions. Skill levels increase as you help others.",
                gradient: "gradient-secondary",
              },
              {
                icon: Zap,
                title: "Minimal & Focused",
                desc: "Clean, distraction-free interface designed for productivity and learning.",
                gradient: "gradient-tertiary",
              },
            ].map((feature, i) => {
              const Icon = feature.icon
              return (
                <div
                  key={i}
                  className="glass rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group animate-in fade-in-50 duration-500"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className={`w-14 h-14 rounded-xl ${feature.gradient} flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:glow-primary`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-xl mb-3 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-32 text-center space-y-8">
          <div className="glass rounded-3xl p-12 max-w-3xl mx-auto transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <h2 className="text-4xl font-bold mb-4">Ready to Start Learning?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join our community today and connect with skilled professionals
            </p>
            <LoginButton />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-32">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2026 SkillSwap. Built with ❤️ for the learning community.</p>
        </div>
      </footer>
    </div>
  )
}
