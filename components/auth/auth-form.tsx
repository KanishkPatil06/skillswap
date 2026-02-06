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
            // Show user-friendly error messages
            let errorMessage = err.message || "An error occurred during authentication"

            // Check for invalid credentials error
            if (err.message?.includes("Invalid login credentials") || err.message?.includes("invalid_credentials")) {
                errorMessage = "Invalid login credentials. Please check your email and password."
            } else if (err.message?.includes("Email not confirmed")) {
                errorMessage = "Please verify your email address before logging in."
            } else if (err.message?.includes("User not found")) {
                errorMessage = "No account found with this email address."
            }

            toast({
                title: isLogin ? "Login Failed" : "Signup Failed",
                description: errorMessage,
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <Label htmlFor="fullName" className="text-sm font-medium text-foreground/90">
                            Full Name
                        </Label>
                        <Input
                            id="fullName"
                            type="text"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            disabled={loading}
                            className="h-11 bg-background border-border/60 focus:border-primary/60 transition-colors duration-200"
                        />
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground/90">
                        Email Address
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        className="h-11 bg-background border-border/60 focus:border-primary/60 transition-colors duration-200"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm font-medium text-foreground/90">
                            Password
                        </Label>
                        {isLogin && (
                            <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                                <DialogTrigger asChild>
                                    <button
                                        type="button"
                                        className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                                    >
                                        Forgot?
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                                    <DialogHeader>
                                        <DialogTitle className="text-foreground">Reset Password</DialogTitle>
                                        <DialogDescription className="text-muted-foreground">
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
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            className="h-11 pr-10 bg-background border-border/60 focus:border-primary/60 transition-colors duration-200"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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

                <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 mt-6"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isLogin ? "Signing in..." : "Creating account..."}
                        </>
                    ) : (
                        <>{isLogin ? "Sign In" : "Create Account"}</>
                    )}
                </Button>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
            </div>

            <div className="text-center">
                <button
                    type="button"
                    onClick={() => {
                        setIsLogin(!isLogin)
                        setFullName("")
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    disabled={loading}
                >
                    {isLogin
                        ? <>Don't have an account? <span className="text-primary font-medium">Sign up</span></>
                        : <>Already have an account? <span className="text-primary font-medium">Sign in</span></>}
                </button>
            </div>
        </div>
    )
}
