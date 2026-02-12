"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Award, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface EndorsementButtonProps {
    endorsedUserId: string
    skillId: string
    initialEndorsed?: boolean
    skillName: string
    onEndorsementChange?: () => void
    disabled?: boolean
    className?: string
}

export function EndorsementButton({
    endorsedUserId,
    skillId,
    initialEndorsed = false,
    skillName,
    onEndorsementChange,
    disabled = false,
    className
}: EndorsementButtonProps) {
    const [isEndorsed, setIsEndorsed] = useState(initialEndorsed)
    const [isLoading, setIsLoading] = useState(false)

    const handleEndorse = async () => {
        if (isEndorsed || isLoading || disabled) return

        setIsLoading(true)

        try {
            const response = await fetch("/api/endorsements", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    endorsed_user_id: endorsedUserId,
                    skill_id: skillId,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                if (response.status === 409) {
                    setIsEndorsed(true)
                    toast.info(`You have already endorsed ${skillName}`)
                    return
                }
                throw new Error(data.error || "Failed to endorse skill")
            }

            setIsEndorsed(true)
            toast.success(`Endorsed ${skillName}!`)
            onEndorsementChange?.()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            variant={isEndorsed ? "secondary" : "outline"}
            size="sm"
            className={cn("gap-1.5", className)}
            onClick={handleEndorse}
            disabled={isEndorsed || isLoading || disabled}
            title={isEndorsed ? "You have endorsed this skill" : "Endorse this skill"}
        >
            {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isEndorsed ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
            ) : (
                <Award className="h-3.5 w-3.5" />
            )}
            {isEndorsed ? "Endorsed" : "Endorse"}
        </Button>
    )
}
