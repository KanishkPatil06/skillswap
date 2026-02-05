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
            <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-accent/5" />

            {/* Animated mesh gradient */}
            <div className="absolute inset-0 opacity-30">
                <div
                    className="absolute w-[600px] h-[600px] rounded-full blur-3xl transition-all duration-1000 ease-out"
                    style={{
                        background: "radial-gradient(circle, rgba(147, 51, 234, 0.4) 0%, transparent 70%)",
                        left: `${mousePosition.x - 300}px`,
                        top: `${mousePosition.y - 300}px`,
                        opacity: isHovering ? 1 : 0.5,
                    }}
                />
            </div>

            {/* Secondary gradient blob */}
            <div className="absolute inset-0 opacity-20">
                <div
                    className="absolute w-[500px] h-[500px] rounded-full blur-3xl transition-all duration-700 ease-out"
                    style={{
                        background: "radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, transparent 70%)",
                        left: `${mousePosition.x - 100}px`,
                        top: `${mousePosition.y - 100}px`,
                        opacity: isHovering ? 1 : 0.3,
                    }}
                />
            </div>

            {/* Tertiary gradient blob */}
            <div className="absolute inset-0 opacity-15">
                <div
                    className="absolute w-[700px] h-[700px] rounded-full blur-3xl transition-all duration-500 ease-out"
                    style={{
                        background: "radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)",
                        left: `${mousePosition.x + 100}px`,
                        top: `${mousePosition.y + 100}px`,
                        opacity: isHovering ? 1 : 0.4,
                    }}
                />
            </div>

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 opacity-[0.02]">
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
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-primary/20 rounded-full animate-float"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 10}s`,
                            animationDuration: `${15 + Math.random() * 10}s`,
                        }}
                    />
                ))}
            </div>
        </div>
    )
}
