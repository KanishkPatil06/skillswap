"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import { CheckCircle2, Search, MessageSquare, Trophy } from "lucide-react"

export function ParallaxSteps() {
    const containerRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    })

    const steps = [
        {
            title: "Create Profile",
            description: "Showcase your expertise. List your skills, connect your portfolio, and set your learning goals.",
            icon: CheckCircle2,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
        },
        {
            title: "Find a Mentor",
            description: "Use our smart search to find the perfect match based on skills, availability, and reputation.",
            icon: Search,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20",
        },
        {
            title: "Connect & Learn",
            description: "Schedule sessions, video chat, and exchange knowledge in real-time.",
            icon: MessageSquare,
            color: "text-pink-500",
            bg: "bg-pink-500/10",
            border: "border-pink-500/20",
        },
        {
            title: "Earn Reputation",
            description: "Get endorsed, earn badges, and climb the leaderboard as you help others.",
            icon: Trophy,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20",
        },
    ]

    return (
        <section ref={containerRef} className="relative py-32 overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mb-20 text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">How SkillSwap Works</h2>
                    <p className="mt-4 text-lg text-muted-foreground">From sign up to mastery in four simple steps.</p>
                </div>

                <div className="relative mx-auto max-w-2xl">
                    {/* Connecting Line */}
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border/40 md:left-1/2 md:-ml-px" />

                    {/* Animated Draw Line */}
                    <motion.div
                        className="absolute left-8 top-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 md:left-1/2 md:-ml-px"
                        style={{ height: useTransform(scrollYProgress, [0, 0.8], ["0%", "100%"]) }}
                    />

                    <div className="space-y-20">
                        {steps.map((step, i) => (
                            <motion.div
                                key={step.title}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className={`relative flex items-center gap-8 ${i % 2 === 0 ? "md:flex-row-reverse" : ""
                                    }`}
                            >
                                {/* Icon Marker */}
                                <div className="absolute left-8 -translate-x-1/2 md:left-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background dark:border-black dark:bg-zinc-900 shadow-[0_0_0_8px_hsl(var(--background))] dark:shadow-[0_0_0_8px_black]">
                                    <div className={`h-3 w-3 rounded-full ${step.color.replace('text-', 'bg-')}`} />
                                </div>

                                {/* Content Card */}
                                <div className={`flex-1 ml-16 md:ml-0 ${i % 2 === 0 ? "md:text-right md:pr-12" : "md:pl-12"
                                    }`}>
                                    <div className={`group rounded-2xl border ${step.border} ${step.bg} p-6 backdrop-blur-sm transition-colors hover:bg-opacity-20`}>
                                        <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg ${step.bg} ${step.color} ring-1 ring-inset ${step.border}`}>
                                            <step.icon className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-foreground dark:text-white">{step.title}</h3>
                                        <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                                    </div>
                                </div>

                                {/* Empty Space for alignment */}
                                <div className="hidden md:block flex-1" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
