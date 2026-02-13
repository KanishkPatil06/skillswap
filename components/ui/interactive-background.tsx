"use client"

import { useEffect, useState } from "react"

export function InteractiveBackground() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [isHovering, setIsHovering] = useState(false)

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY })
            setIsHovering(true)
        }

        const handleMouseLeave = () => {
            setIsHovering(false)
        }

        window.addEventListener("mousemove", handleMouseMove)
        document.addEventListener("mouseleave", handleMouseLeave)

        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            document.removeEventListener("mouseleave", handleMouseLeave)
        }
    }, [])

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/10 to-accent/10" />

            {/* Animated mesh gradient - Primary Purple - MUCH MORE VISIBLE */}
            <div className="absolute inset-0 opacity-60">
                <div
                    className="absolute w-[700px] h-[700px] rounded-full blur-2xl transition-all duration-1000 ease-out"
                    style={{
                        background: "radial-gradient(circle, rgba(147, 51, 234, 0.8) 0%, rgba(147, 51, 234, 0.3) 50%, transparent 70%)",
                        left: `${mousePosition.x - 350}px`,
                        top: `${mousePosition.y - 350}px`,
                        opacity: isHovering ? 1 : 0.7,
                    }}
                />
            </div>

            {/* Tertiary gradient blob - Pink - MUCH MORE VISIBLE - PREFER INCOMING */}
            <div className="absolute inset-0 opacity-45">
                <div
                    className="absolute w-[800px] h-[800px] rounded-full blur-2xl transition-all duration-500 ease-out"
                    style={{
                        background: "radial-gradient(circle, rgba(236, 72, 153, 0.7) 0%, rgba(236, 72, 153, 0.3) 30%, transparent 80%)",
                        left: `${mousePosition.x + 200}px`,
                        top: `${mousePosition.y + 2000}px`,
                        opacity: isHovering ? 1 : 0.6,
                    }}
                />
            </div>

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 opacity-[0.03]">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
                        backgroundSize: "40px 40px",
                    }}
                />
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0">
                {[...Array(20)].map((_, i) => {
                    // Deterministic pseudo-random to avoid hydration mismatch
                    const seed = (n: number) => ((n * 9301 + 49297) % 233280) / 233280
                    const left = seed(i * 4 + 1) * 100
                    const top = seed(i * 4 + 2) * 100
                    const delay = seed(i * 4 + 3) * 10
                    const duration = 15 + seed(i * 4 + 4) * 10
                    return (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-primary/30 rounded-full animate-float"
                            style={{
                                left: `${left}%`,
                                top: `${top}%`,
                                animationDelay: `${delay}s`,
                                animationDuration: `${duration}s`,
                            }}
                        />
                    )
                })}
            </div>
        </div>
    )
}
