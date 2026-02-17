"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTASection() {
    return (
        <section className="relative py-24 px-6 lg:px-8 overflow-hidden">
            {/* Glow Bomb */}
            <div className="absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20 blur-[100px]" />

            <div className="mx-auto max-w-3xl text-center">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-4xl font-bold tracking-tight sm:text-6xl bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60"
                >
                    Ready to accelerate your <br />
                    <span className="text-white">learning journey?</span>
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mt-6 text-lg leading-8 text-muted-foreground"
                >
                    Join thousands of developers, designers, and creators sharing their skills today.
                    Free to join, priceless to learn.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-10 flex items-center justify-center gap-x-6"
                >
                    <Link href="/signin">
                        <Button size="lg" className="h-12 px-8 rounded-full text-base bg-white text-black hover:bg-white/90 font-semibold shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                            Get Started Now
                        </Button>
                    </Link>
                    <Link href="/about" className="text-sm font-semibold leading-6 text-white hover:text-primary transition-colors flex items-center gap-1 group">
                        Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </motion.div>
            </div>
        </section>
    )
}
