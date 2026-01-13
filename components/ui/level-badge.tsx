import { Badge } from "@/components/ui/badge"

interface LevelBadgeProps {
    level: number
    levelName: string
    size?: "sm" | "md" | "lg"
    showLevel?: boolean
}

export function LevelBadge({ level, levelName, size = "md", showLevel = true }: LevelBadgeProps) {
    // Color scheme for each level
    const getLevelStyle = (lvl: number) => {
        switch (lvl) {
            case 1:
                return "bg-gray-500 hover:bg-gray-600 border-gray-600"
            case 2:
                return "bg-blue-500 hover:bg-blue-600 border-blue-600"
            case 3:
                return "bg-green-500 hover:bg-green-600 border-green-600"
            case 4:
                return "bg-purple-500 hover:bg-purple-600 border-purple-600"
            case 5:
                return "bg-orange-500 hover:bg-orange-600 border-orange-600"
            case 6:
                return "bg-red-500 hover:bg-red-600 border-red-600"
            case 7:
                return "bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 border-yellow-600 shadow-lg shadow-yellow-500/50"
            default:
                return "bg-gray-500 hover:bg-gray-600 border-gray-600"
        }
    }

    const sizeClasses = {
        sm: "text-[10px] px-1.5 py-0.5",
        md: "text-xs px-2 py-1",
        lg: "text-sm px-3 py-1.5"
    }

    return (
        <Badge
            className={`
        ${getLevelStyle(level)} 
        ${sizeClasses[size]}
        text-white font-semibold border transition-all duration-200
      `}
        >
            {showLevel ? `${levelName} • Lvl ${level}` : levelName}
        </Badge>
    )
}

// Helper function to get level info from rating score
export function getLevelInfo(ratingScore: number) {
    if (ratingScore >= 4000) return { level: 7, levelName: 'Legend', nextLevelAt: null, progress: 100 }
    if (ratingScore >= 2000) return { level: 6, levelName: 'Master', nextLevelAt: 4000, progress: ((ratingScore - 2000) / 2000) * 100 }
    if (ratingScore >= 1000) return { level: 5, levelName: 'Expert', nextLevelAt: 2000, progress: ((ratingScore - 1000) / 1000) * 100 }
    if (ratingScore >= 500) return { level: 4, levelName: 'Helper', nextLevelAt: 1000, progress: ((ratingScore - 500) / 500) * 100 }
    if (ratingScore >= 250) return { level: 3, levelName: 'Contributor', nextLevelAt: 500, progress: ((ratingScore - 250) / 250) * 100 }
    if (ratingScore >= 100) return { level: 2, levelName: 'Explorer', nextLevelAt: 250, progress: ((ratingScore - 100) / 150) * 100 }
    return { level: 1, levelName: 'Newcomer', nextLevelAt: 100, progress: (ratingScore / 100) * 100 }
}
