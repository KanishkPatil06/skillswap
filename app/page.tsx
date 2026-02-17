import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { ParallaxSteps } from "@/components/landing/parallax-steps"
import { CTASection } from "@/components/landing/cta-section"
import { ThemeSwitch } from "@/components/ui/theme-switch"
import { LoginButton } from "@/components/auth/login-button"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/30">
      {/* Floating Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Logo / Brand */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-purple-500/20" />
              <span className="text-xl font-bold tracking-tight text-white">SkillSwap</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block">
                <ThemeSwitch />
              </div>
              <LoginButton />
            </div>
          </div>
        </div>
        {/* Nav Blur Backdrop */}
        <div className="absolute inset-0 -z-10 bg-black/0 backdrop-blur-[2px] mask-[linear-gradient(to_bottom,black_0%,transparent_100%)]" />
      </nav>

      <main>
        <HeroSection />
        <FeaturesSection />
        <ParallaxSteps />
        <CTASection />
      </main>

      <footer className="border-t border-white/5 bg-black py-12">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-muted-foreground lg:px-8">
          <p>&copy; 2026 SkillSwap Inc. All rights reserved. Designed for the future of learning.</p>
        </div>
      </footer>
    </div>
  )
}
