"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function ResetPasswordForm({ onSuccess }: { onSuccess?: () => void }) {
    const supabase = createClient()
    const { toast } = useToast()

    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/reset-password`,
            })

            if (error) throw error

            toast({
                title: "Success",
                description: "Password reset email sent! Check your inbox for instructions."
            })
            setEmail("")
            // Auto-close dialog after success
            if (onSuccess) {
                setTimeout(() => onSuccess(), 1000)
            }
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message || "An error occurred while sending reset email",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-gray-700">Email</Label>
                <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full bg-white border-gray-300 text-gray-900"
                />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending reset email...
                    </>
                ) : (
                    "Send Reset Email"
                )}
            </Button>
        </form>
    )
}
