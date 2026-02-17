"use client"

import { motion, type Variants } from "framer-motion"
import { cn } from "@/lib/utils"

interface GlowingCardProps {
    children: React.ReactNode
    className?: string
    gradient?: string
    delay?: number
    variants?: Variants
}

export function GlowingCard({ className, children, gradient = "from-primary/20 via-primary/5 to-transparent", delay = 0, variants }: GlowingCardProps) {
    return (
        <motion.div
            variants={variants}
            initial={variants ? undefined : { opacity: 0, y: 20 }}
            animate={variants ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            whileHover={{ y: -2 }}
            className={cn(
                "group relative overflow-hidden rounded-3xl border border-white/5 bg-black/40 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5",
                className
            )}
        >
            {/* Hover Gradient Blob */}
            <div
                className={cn(
                    "absolute -inset-px opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-br",
                    gradient
                )}
                style={{ zIndex: -1 }}
            />

            <div className="relative z-10 h-full p-6">
                {children}
            </div>
        </motion.div>
    )
}
