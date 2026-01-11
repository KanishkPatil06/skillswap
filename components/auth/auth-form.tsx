"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { ResetPasswordForm } from "./reset-password-form"

export function AuthForm() {
    const router = useRouter()
    const supabase = createClient()

    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [showResetDialog, setShowResetDialog] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setMessage(null)
        setLoading(true)

        try {
            if (isLogin) {
                // Login with email and password
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })

                if (error) throw error

                if (data.user) {
                    router.push("/dashboard")
                    router.refresh()
                }
            } else {
                // Sign up with email and password
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                })

                if (error) throw error

                if (data.user) {
                    setMessage("Account created successfully! Redirecting to dashboard...")
                    setTimeout(() => {
                        router.push("/dashboard")
                        router.refresh()
                    }, 1500)
                }
            }
        } catch (err: any) {
            setError(err.message || "An error occurred during authentication")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md mx-auto space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        {isLogin && (
                            <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                                <DialogTrigger asChild>
                                    <button
                                        type="button"
                                        className="text-xs text-primary hover:underline"
                                    >
                                        Forgot password?
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px] bg-white border-gray-200">
                                    <DialogHeader>
                                        <DialogTitle className="text-gray-900">Reset Password</DialogTitle>
                                        <DialogDescription className="text-gray-600">
                                            Enter your email address and we'll send you a link to reset your password.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <ResetPasswordForm />
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            className="w-full pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            disabled={loading}
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
                        {message}
                    </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isLogin ? "Signing in..." : "Creating account..."}
                        </>
                    ) : (
                        <>{isLogin ? "Sign In" : "Sign Up"}</>
                    )}
                </Button>
            </form>

            <div className="text-center">
                <button
                    type="button"
                    onClick={() => {
                        setIsLogin(!isLogin)
                        setError(null)
                        setMessage(null)
                    }}
                    className="text-sm text-primary hover:underline"
                    disabled={loading}
                >
                    {isLogin
                        ? "Don't have an account? Sign up"
                        : "Already have an account? Sign in"}
                </button>
            </div>
        </div>
    )
}
