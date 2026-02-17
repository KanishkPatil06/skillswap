"use client"

import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Star, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ReputationBadgeProps {
    score: number
    size?: "sm" | "md" | "lg"
    className?: string
}

export function ReputationBadge({ score, size = "md", className }: ReputationBadgeProps) {
    const getBadgeConfig = (score: number) => {
        if (score >= 4000) return { icon: Trophy, label: "Legend", color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" }
        if (score >= 2000) return { icon: Medal, label: "Master", color: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800" }
        if (score >= 1000) return { icon: Star, label: "Expert", color: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800" }
        if (score >= 500) return { icon: Shield, label: "Helper", color: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/30 dark:text-fuchsia-400 dark:border-fuchsia-800" }
        return { icon: Shield, label: "Member", color: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700" }
    }

    const config = getBadgeConfig(score)
    const Icon = config.icon

    const sizeClasses = {
        sm: "text-xs px-2 py-0.5",
        md: "text-sm px-2.5 py-0.5",
        lg: "text-base px-3 py-1",
    }

    const iconSizes = {
        sm: "w-3 h-3 mr-1",
        md: "w-4 h-4 mr-1.5",
        lg: "w-5 h-5 mr-2",
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge
                        variant="outline"
                        className={cn(config.color, sizeClasses[size], "font-medium hover:bg-opacity-80 transition-colors cursor-help", className)}
                    >
                        <Icon className={iconSizes[size]} />
                        <span>{config.label}</span>
                        <span className="ml-1 opacity-75">({score})</span>
                    </Badge>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Reputation Score: {score}</p>
                    <p className="text-xs text-muted-foreground">Earn points by helping others and being active!</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
