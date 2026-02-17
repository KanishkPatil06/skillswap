"use client"

import { GlowingCard } from "@/components/ui/glowing-card"
import { Users, Zap, Shield, Globe } from "lucide-react"

export function FeaturesSection() {
    const features = [
        {
            title: "Smart Matching",
            description: "Our AI algorithm finds the perfect mentor for your specific learning goals.",
            icon: Zap,
            gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
        },
        {
            title: "Global Community",
            description: "Connect with experts from over 50 countries and diverse cultural backgrounds.",
            icon: Globe,
            gradient: "from-blue-500/20 via-cyan-500/10 to-transparent",
        },
        {
            title: "Verified Skills",
            description: "Earn reputation points and badges to showcase your expertise on the leaderboard.",
            icon: Shield,
            gradient: "from-purple-500/20 via-pink-500/10 to-transparent",
        },
        {
            title: "Real-time Collaboration",
            description: "Built-in video calls, chat, and scheduling make learning seamless.",
            icon: Users,
            gradient: "from-green-500/20 via-emerald-500/10 to-transparent",
        },
    ]

    return (
        <section className="relative py-24 sm:py-32">
            {/* Section Header */}
            <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center mb-16">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                    Everything you need to <br /> level up your skills.
                </h2>
            </div>

            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {features.map((feature, i) => (
                        <GlowingCard key={feature.title} delay={i * 0.1} gradient={feature.gradient}>
                            <div className="flex flex-col h-full justify-between">
                                <div className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10`}>
                                    <feature.icon className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold leading-8 text-white">{feature.title}</h3>
                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        </GlowingCard>
                    ))}
                </div>
            </div>
        </section>
    )
}
