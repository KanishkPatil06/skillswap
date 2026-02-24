"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import Particles, { initParticlesEngine } from "@tsparticles/react"
import { loadSlim } from "@tsparticles/slim"

export function ParticlesBackground() {
    const [init, setInit] = useState(false)
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === "dark"

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine)
        }).then(() => {
            setInit(true)
        })
    }, [])

    if (!init) return null

    // Light theme: deep purple particles | Dark theme: muted white/silver particles
    const particleColor = isDark ? "#4b5563" : "#6b21a8" // Darker gray for dark mode, deeper purple for light mode
    const linkColor = isDark ? "#4b5563" : "#581c87"
    const particleOpacity = isDark ? 0.4 : 0.25 // Increased opacity to make them "darker" and more visible
    const linkOpacity = isDark ? 0.2 : 0.15

    return (
        <Particles
            id="tsparticles"
            key={resolvedTheme}
            className="fixed inset-0 -z-10"
            options={{
                fullScreen: { enable: false },
                background: {
                    color: {
                        value: "transparent",
                    },
                },
                fpsLimit: 120,
                interactivity: {
                    events: {
                        onHover: {
                            enable: true,
                            mode: "grab",
                        },
                        resize: { enable: true },
                    },
                    modes: {
                        grab: {
                            distance: 140,
                            links: {
                                opacity: 0.5,
                            },
                        },
                        push: {
                            quantity: 4,
                        },
                    },
                },
                particles: {
                    color: {
                        value: particleColor,
                    },
                    links: {
                        color: linkColor,
                        distance: 150,
                        enable: true,
                        opacity: linkOpacity,
                        width: 1,
                    },
                    move: {
                        direction: "none",
                        enable: true,
                        outModes: {
                            default: "bounce",
                        },
                        random: false,
                        speed: 0.5,
                        straight: false,
                    },
                    number: {
                        density: {
                            enable: true,
                            width: 800,
                            height: 800,
                        },
                        value: 60,
                    },
                    opacity: {
                        value: particleOpacity,
                    },
                    shape: {
                        type: "circle",
                    },
                    size: {
                        value: { min: 1, max: 3 },
                    },
                },
                detectRetina: true,
            }}
        />
    )
}
