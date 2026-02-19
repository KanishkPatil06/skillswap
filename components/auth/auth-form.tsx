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
            <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/auth/callback` } })} className="w-full">
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                        <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                    </svg>
                    Google
                </Button>
                <Button variant="outline" onClick={() => supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: `${location.origin}/auth/callback` } })} className="w-full">
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="github" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512">
                        <path fill="currentColor" d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-63.5 0-14 5.8-25.2 13.9-35.8-2.5-3.2-6-17 1.3-35.3 0 0 10.9-3.5 35.8 13.5 10.4-2.9 21.7-4.3 33-4.3 11.4 0 22.7 1.4 33.1 4.3 24.9-17 35.9-13.5 35.9-13.5 7.4 18.2 3.9 32.1 1.3 35.3 8.3 10.6 13.9 21.8 13.9 35.8 0 49.3-56.4 57.4-112.7 63.6 9.1 7.9 17.3 23.3 17.3 46.9 0 33.8-.3 61.1-.3 69.4 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"></path>
                    </svg>
                    GitHub
                </Button>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or continue with</span>
                </div>
            </div>

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
                                            Enter your email address and we&apos;ll send you a link to reset your password.
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
                        ? <>Don&apos;t have an account? <span className="text-primary font-medium">Sign up</span></>
                        : <>Already have an account? <span className="text-primary font-medium">Sign in</span></>}
                </button>
            </div>
        </div>
    )
}
