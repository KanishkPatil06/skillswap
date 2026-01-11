"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

export function ResetPasswordForm() {
    const supabase = createClient()

    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(false)
        setLoading(true)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/reset-password`,
            })

            if (error) throw error

            setSuccess(true)
            setEmail("")
        } catch (err: any) {
            setError(err.message || "An error occurred while sending reset email")
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="text-center space-y-4">
                <div className="p-4 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
                    Password reset email sent! Check your inbox for instructions.
                </div>
                <Button
                    variant="outline"
                    onClick={() => setSuccess(false)}
                    className="w-full bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                >
                    Send Another Email
                </Button>
            </div>
        )
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

            {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                </div>
            )}

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
