"use client"

import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AnimatedAvatarProps {
    src?: string | null
    fallback: string
    className?: string
}

export function AnimatedAvatar({ src, fallback, className }: AnimatedAvatarProps) {
    return (
        <motion.div
            className="relative inline-block"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            {/* Pulse Ring */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 opacity-0 transition-opacity duration-300 group-hover:opacity-50 blur-sm" />

            {/* Active State Ring */}
            <motion.div
                className="absolute -inset-[2px] rounded-full border border-transparent bg-gradient-to-r from-cyan-500 to-purple-500"
                style={{ mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />

            <Avatar className={className}>
                <AvatarImage src={src || undefined} />
                <AvatarFallback className="bg-zinc-900 text-zinc-100 font-bold">{fallback}</AvatarFallback>
            </Avatar>
        </motion.div>
    )
}
