"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"

export default function ResetPasswordPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        // Check if we have a valid session from the reset link
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession()
            if (!data.session) {
                setError("Invalid or expired reset link. Please request a new password reset.")
            }
        }
        checkSession()
    }, [supabase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long")
            return
        }

        setLoading(true)

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            })

            if (error) throw error

            setSuccess(true)
            setTimeout(() => {
                router.push("/")
            }, 2000)
        } catch (err: any) {
            setError(err.message || "An error occurred while resetting your password")
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-card">
                <div className="max-w-md w-full mx-auto p-8 bg-card border border-border rounded-lg shadow-lg">
                    <div className="text-center space-y-4">
                        <h1 className="text-2xl font-bold text-foreground">Password Reset Successful!</h1>
                        <p className="text-muted-foreground">
                            Your password has been updated. Redirecting you to the login page...
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-card">
            <div className="max-w-md w-full mx-auto p-8 bg-card border border-border rounded-lg shadow-lg">
                <div className="text-center space-y-2 mb-6">
                    <h1 className="text-2xl font-bold text-foreground">Reset Your Password</h1>
                    <p className="text-sm text-muted-foreground">
                        Enter your new password below
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter new password"
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

                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <Input
                            id="confirm-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={loading}
                            className="w-full"
                        />
                    </div>

                    {error && (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Resetting password...
                            </>
                        ) : (
                            "Reset Password"
                        )}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={() => router.push("/")}
                        className="text-sm text-primary hover:underline"
                    >
                        Back to login
                    </button>
                </div>
            </div>
        </div>
    )
}
