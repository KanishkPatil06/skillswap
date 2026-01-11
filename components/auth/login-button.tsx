"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AuthForm } from "./auth-form"

export function LoginButton() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gradient-primary hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
          Get Started
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-900 border border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text">SkillSwap</DialogTitle>
          <DialogDescription className="text-base">
            Sign in or create an account to start exchanging skills
          </DialogDescription>
        </DialogHeader>
        <AuthForm />
      </DialogContent>
    </Dialog>
  )
}
