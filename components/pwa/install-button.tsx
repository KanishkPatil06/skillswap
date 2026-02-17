"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function InstallPWA() {
    const [supportsPWA, setSupportsPWA] = useState(false)
    const [promptInstall, setPromptInstall] = useState<any>(null)

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault()
            setSupportsPWA(true)
            setPromptInstall(e)
        }
        window.addEventListener("beforeinstallprompt", handler)

        return () => window.removeEventListener("beforeinstallprompt", handler)
    }, [])

    const onClick = async () => {
        if (!promptInstall) {
            return
        }
        promptInstall.prompt()
    }

    if (!supportsPWA) {
        return null
    }

    return (
        <Button
            variant="outline"
            size="sm"
            className="hidden md:flex gap-2 text-violet-600 border-violet-200 hover:bg-violet-50 dark:text-violet-400 dark:border-violet-900 dark:hover:bg-violet-900/30"
            onClick={onClick}
        >
            <Download className="w-4 h-4" />
            Install App
        </Button>
    )
}
