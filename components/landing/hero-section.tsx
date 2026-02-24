"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles, Play } from "lucide-react"
import { AuthModal } from "@/components/auth/auth-modal"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function HeroSection() {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
    return (
        <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-20 text-center sm:px-6 lg:px-8">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[120px] opacity-50" />



            {/* Main Headline */}
            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl bg-gradient-to-b from-gray-950 via-gray-800 to-gray-600 dark:from-white dark:to-white/50 bg-clip-text text-transparent"
            >
                Master any skill <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    through connection.
                </span>
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
            >
                The premium platform for trading expertise. Connect with mentors,
                swap skills, and level up your career in a gamified, community-driven ecosystem.
            </motion.p>

            {/* Buttons */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center"
            >
                <Button
                    size="lg"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="h-12 rounded-full px-8 text-base shadow-[0_0_20px_rgba(124,58,237,0.5)] transition-shadow hover:shadow-[0_0_30px_rgba(124,58,237,0.7)] bg-primary hover:bg-primary/90"
                >
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </motion.div>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                defaultMode="signup"
            />

            {/* Hero Image/Mockup */}

        </section>
    )
}
