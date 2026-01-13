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
import { useToast } from "@/hooks/use-toast"

export function AuthForm() {
    const router = useRouter()
    const supabase = createClient()
    const { toast } = useToast()

    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [fullName, setFullName] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showResetDialog, setShowResetDialog] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
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
                    toast({ title: "Success", description: "Welcome back!" })
                    router.push("/dashboard")
                    router.refresh()
                }
            } else {
                // Validate full name for signup
                if (!fullName.trim()) {
                    toast({
                        title: "Validation Error",
                        description: "Please enter your full name",
                        variant: "destructive"
                    })
                    setLoading(false)
                    return
                }

                // Sign up with email and password
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                })

                if (error) throw error

                if (data.user) {
                    // Update profile with full name
                    const { error: profileError } = await supabase
                        .from("profiles")
                        .update({ full_name: fullName.trim() })
                        .eq("id", data.user.id)

                    if (profileError) {
                        console.error("Profile update error:", profileError)
                        // Don't throw error, profile was created by trigger
                    }

                    toast({ title: "Success", description: "Account created successfully!" })
                    router.push("/dashboard")
                    router.refresh()
                }
            }
        } catch (err: any) {
            toast({
                title: "Authentication Error",
                description: err.message || "An error occurred during authentication",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md mx-auto space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                            id="fullName"
                            type="text"
                            placeholder="Your full name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            disabled={loading}
                            className="w-full"
                        />
                    </div>
                )}

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
                                    <ResetPasswordForm onSuccess={() => setShowResetDialog(false)} />
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
                        setFullName("")
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
