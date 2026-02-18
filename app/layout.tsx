"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { AIChatbot } from "@/components/chatbot/ai-chatbot"
import { createClient } from "@/lib/supabase/client"
import { useOnlineStatus } from "@/hooks/use-online-status"
import "./globals.css"
import { ParticlesBackground } from "@/components/ui/particles-background"
import { MouseGlow } from "@/components/ui/mouse-glow"

const geistSans = Geist({ subsets: ["latin"], variable: "--font-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsAuthenticated(!!data.user)
      setUserId(data.user?.id)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session)
      setUserId(session?.user?.id)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  // Track online status for authenticated users
  useOnlineStatus(userId)

  return (
    <>
      <ParticlesBackground />
      <MouseGlow />
      {children}
      {isAuthenticated && !pathname?.startsWith('/chat') && !pathname?.startsWith('/sessions/room') && <AIChatbot />}
    </>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7c3aed" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SkillSwap" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="SkillSwap" />
        <meta name="msapplication-TileColor" content="#7c3aed" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClientLayout>{children}</ClientLayout>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
