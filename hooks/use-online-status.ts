"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export function useOnlineStatus(userId: string | undefined) {
    const supabase = createClient()

    useEffect(() => {
        if (!userId) return

        // Update last_seen immediately when component mounts
        const updatePresence = async () => {
            await supabase.rpc('mark_user_online', { user_id_param: userId })
        }

        updatePresence()

        // Update last_seen every 2 minutes while user is active
        const interval = setInterval(updatePresence, 2 * 60 * 1000)

        // Update on visibility change (tab becomes active)
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                updatePresence()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        // Cleanup
        return () => {
            clearInterval(interval)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [userId, supabase])
}
