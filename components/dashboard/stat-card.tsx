"use client"

import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
    icon: LucideIcon
    label: string
    value: string | number
    trend?: string
    trendUp?: boolean
    delay?: number
    colorClass?: string
}

export function StatCard({
    icon: Icon,
    label,
    value,
    trend,
    trendUp,
    delay = 0,
    colorClass = "text-primary"
}: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className="group relative overflow-hidden rounded-[24px] glass-proper !bg-white/5 dark:!bg-black/5 backdrop-blur-xl p-4 sm:p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 border border-white/10 dark:border-white/5"
        >
            {/* Background Gradient Blob */}
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-70" />

            <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex items-start justify-between">
                    <div className={`rounded-xl bg-white/10 p-2.5 ${colorClass} ring-1 ring-white/5`}>
                        <Icon className="h-5 w-5" />
                    </div>
                    {trend && (
                        <div className={`flex items-center text-xs font-medium ${trendUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                            {trendUp ? "+" : ""}{trend}
                        </div>
                    )}
                </div>

                <div className="mt-4">
                    <h3 className="text-3xl font-bold tracking-tight text-foreground">
                        {value}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-muted-foreground/80">
                        {label}
                    </p>
                </div>
            </div>
        </motion.div>
    )
}
