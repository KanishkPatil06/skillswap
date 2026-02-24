"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Mail, Lock, Github, Chrome, Eye, EyeOff, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import * as Dialog from "@radix-ui/react-dialog"

interface AuthModalProps {
    isOpen: boolean
    onClose: () => void
    defaultMode?: "login" | "signup"
}

export function AuthModal({ isOpen, onClose, defaultMode = "login" }: AuthModalProps) {
    const [isLogin, setIsLogin] = useState(defaultMode === "login")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        if (isOpen) {
            setIsLogin(defaultMode === "login")
        }
    }, [isOpen, defaultMode])

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                router.push("/dashboard")
                onClose()
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${location.origin}/auth/callback`,
                    },
                })
                if (error) throw error
                toast.success("Check your email to confirm your account")
                onClose()
            }
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleOAuth = async (provider: "github" | "google") => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${location.origin}/auth/callback`,
                },
            })
            if (error) throw error
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AnimatePresence>
                {isOpen && (
                    <Dialog.Portal forceMount>
                        {/* Backdrop - Renders at root level via Portal */}
                        <Dialog.Overlay asChild>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-[60px]"
                            />
                        </Dialog.Overlay>

                        {/* Modal Container */}
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <Dialog.Content asChild>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                                    className="relative w-full max-w-md max-h-full outline-none"
                                >
                                    {/* Gradient Border Wrapper */}
                                    <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-indigo-500/50 via-purple-500/50 to-pink-500/50 opacity-100 blur-[1px]" />

                                    {/* Card Content - Solid Opaque */}
                                    <div className="relative overflow-y-auto max-h-[calc(100vh-2rem)] rounded-3xl border border-black/5 dark:border-white/10 bg-white dark:bg-black p-8 shadow-2xl">
                                        {/* Close Button */}
                                        <Dialog.Close asChild>
                                            <button
                                                className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground dark:hover:text-white"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </Dialog.Close>

                                        {/* Header */}
                                        <div className="mb-8 text-center">
                                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_30px_-5px_rgba(124,58,237,0.5)]">
                                                <span className="text-2xl font-bold text-white">S</span>
                                            </div>
                                            <Dialog.Title className="text-2xl font-bold tracking-tight text-foreground dark:text-white">
                                                {isLogin ? "Welcome back" : "Create an account"}
                                            </Dialog.Title>
                                            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                                                Enter your details to access your workspace
                                            </Dialog.Description>
                                        </div>

                                        {/* Social Login */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <motion.button
                                                whileHover={{ scale: 1.02, y: -1 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleOAuth("github")}
                                                className="flex items-center justify-center gap-2 rounded-xl border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 py-3 text-sm font-medium text-foreground dark:text-white transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                                            >
                                                <Github className="h-4 w-4" />
                                                GitHub
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.02, y: -1 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleOAuth("google")}
                                                className="flex items-center justify-center gap-2 rounded-xl border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 py-3 text-sm font-medium text-foreground dark:text-white transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                                            >
                                                <Chrome className="h-4 w-4" />
                                                Google
                                            </motion.button>
                                        </div>

                                        <div className="relative my-8">
                                            <div className="absolute inset-0 flex items-center">
                                                <span className="w-full border-t border-black/5 dark:border-white/10" />
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
                                                <span className="bg-white dark:bg-black/50 px-2 text-muted-foreground backdrop-blur-xl">
                                                    Or continue with
                                                </span>
                                            </div>
                                        </div>

                                        {/* Form */}
                                        <form onSubmit={handleAuth} className="space-y-4">
                                            <div className="space-y-2">
                                                <div className="relative group">
                                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                                    <input
                                                        type="email"
                                                        placeholder="name@example.com"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        className="w-full rounded-xl border border-black/5 dark:border-white/10 bg-black/5 dark:bg-black/20 pl-10 py-3 text-sm text-foreground dark:text-white placeholder:text-muted-foreground shadow-[inner_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[inner_0_2px_4px_rgba(0,0,0,0.4)] transition-all focus:border-primary/50 focus:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="relative group">
                                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="Enter your password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        className="w-full rounded-xl border border-black/5 dark:border-white/10 bg-black/5 dark:bg-black/20 pl-10 pr-10 py-3 text-sm text-foreground dark:text-white placeholder:text-muted-foreground shadow-[inner_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[inner_0_2px_4px_rgba(0,0,0,0.4)] transition-all focus:border-primary/50 focus:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors"
                                                    >
                                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </div>

                                            <motion.button
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                                type="submit"
                                                disabled={isLoading}
                                                className="relative w-full rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/40 disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden group"
                                            >
                                                <span className="relative z-10 flex items-center justify-center gap-2">
                                                    {isLoading ? (
                                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                    ) : (
                                                        <>
                                                            {isLogin ? "Sign In" : "Create Account"}
                                                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                                        </>
                                                    )}
                                                </span>
                                                <div className="absolute inset-0 z-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
                                            </motion.button>
                                        </form>

                                        {/* Footer */}
                                        <div className="mt-6 text-center text-sm">
                                            <button
                                                onClick={() => setIsLogin(!isLogin)}
                                                className="text-muted-foreground transition-colors hover:text-foreground dark:hover:text-white"
                                            >
                                                {isLogin ? "Don't have an account? " : "Already have an account? "}
                                                <span className="font-medium text-primary underline-offset-4 hover:underline">
                                                    {isLogin ? "Sign up" : "Log in"}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </Dialog.Content>
                        </div>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    )
}
