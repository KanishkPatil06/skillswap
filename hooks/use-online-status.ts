"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"

export function useOnlineStatus(user: User | null) {
    const supabase = createClient()

    useEffect(() => {
        if (!user) return

        const updateLastSeen = async () => {
            try {
                await supabase
                    .from("profiles")
                    .update({ last_seen: new Date().toISOString() })
                    .eq("id", user.id)
            } catch (error) {
                console.error("Error updating last seen:", error)
            }
        }

        // Update immediately
        updateLastSeen()

        // Update every 5 minutes
        const interval = setInterval(updateLastSeen, 5 * 60 * 1000)

        // Update on window focus
        const handleFocus = () => updateLastSeen()
        window.addEventListener("focus", handleFocus)

        return () => {
            clearInterval(interval)
            window.removeEventListener("focus", handleFocus)
        }
    }, [user, supabase])
}
