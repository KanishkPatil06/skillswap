"use client"

import { motion } from "framer-motion"

export function TrustedBy() {
    const companies = ["Acme Corp", "Linear", "Vercel", "Stripe", "Raycast", "Supabase"]

    return (
        <section className="border-t border-white/5 py-12 bg-black/20 backdrop-blur-sm">
            <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
                <p className="mb-8 text-sm font-medium opacity-50">TRUSTED BY INNOVATORS AT</p>
                <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 opacity-50 grayscale transition-all duration-500 hover:opacity-100 hover:grayscale-0">
                    {companies.map((company, i) => (
                        <motion.div
                            key={company}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="text-xl font-bold tracking-tight text-white hover:text-primary transition-colors cursor-default"
                        >
                            {company}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
