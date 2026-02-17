"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AuthModal } from "./auth-modal"

export function LoginButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="rounded-full bg-white/10 px-6 font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20 border border-white/5 shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)]"
      >
        Sign In
      </Button>
      <AuthModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
