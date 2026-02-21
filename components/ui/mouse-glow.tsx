"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"

export function MouseGlow() {
    const glowRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const glow = glowRef.current
        if (!glow) return

        const moveGlow = (e: MouseEvent) => {
            gsap.to(glow, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.6,
                ease: "power2.out",
            })
        }

        window.addEventListener("mousemove", moveGlow)
        return () => window.removeEventListener("mousemove", moveGlow)
    }, [])

    return (
        <div
            ref={glowRef}
            className="pointer-events-none fixed left-0 top-0 -z-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[100px] transition-opacity duration-500"
        />
    )
}
