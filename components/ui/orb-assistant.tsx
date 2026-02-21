"use client"

import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

interface OrbAssistantProps {
    onClick: () => void
    isOpen: boolean
}

export function OrbAssistant({ onClick, isOpen }: OrbAssistantProps) {
    return (
        <motion.button
            onClick={onClick}
            className="fixed bottom-6 right-6 z-50 group"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
            {/* The Glowing Orb */}
            <div className="relative flex h-16 w-16 items-center justify-center">
                {/* Core Gradient */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-90 blur-sm" />

                {/* Inner Glow/Highlight */}
                <div className="absolute inset-[2px] rounded-full bg-black/40 backdrop-blur-sm" />

                {/* Pulse Effect */}
                <motion.div
                    className="absolute -inset-4 rounded-full bg-indigo-500/30 blur-xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />

                {/* Icon */}
                <Sparkles className="relative z-10 h-6 w-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />

                {/* Orbiting particles (optional, keeps it alive) */}
                <motion.div
                    className="absolute inset-0 rounded-full border border-white/20"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                >
                    <div className="absolute top-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_10px_white]" />
                </motion.div>
            </div>

            {!isOpen && (
                <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground opacity-0 transition-opacity group-hover:opacity-100 shadow-xl border border-border">
                    Ask AI Assistant
                </div>
            )}
        </motion.button>
    )
}
