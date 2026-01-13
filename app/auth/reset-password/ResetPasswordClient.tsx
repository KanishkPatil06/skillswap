"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"   // ✅ removed useSearchParams
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2 } from "lucide-react"

export default function ResetPasswordClient() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        setError("Invalid or expired reset link.")
      }
    }
    checkSession()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push("/"), 2000)
  }

  if (success) {
    return <div className="min-h-screen flex items-center justify-center">Password updated</div>
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-20 space-y-4">
      <Label>New Password</Label>
      <Input
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <Label>Confirm Password</Label>
      <Input
        type={showPassword ? "text" : "password"}
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)}
      />

      {error && <p className="text-red-500">{error}</p>}

      <Button disabled={loading}>
        {loading ? <Loader2 className="animate-spin" /> : "Reset Password"}
      </Button>
    </form>
  )
}
