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
import { InteractiveBackground } from "@/components/ui/interactive-background"

export function LoginButton() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gradient-primary hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
          Get Started
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] border-0 bg-transparent shadow-none overflow-visible p-0">
        {/* Interactive Background - Highly Visible */}
        <div className="absolute inset-0 -inset-4 rounded-2xl overflow-hidden opacity-70">
          <InteractiveBackground />
        </div>

        {/* Main Card - Solid Background for Both Modes */}
        <div className="relative bg-white dark:bg-gray-900 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
          {/* Accent Top Border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500" />

          {/* Content */}
          <div className="p-10">
            <DialogHeader className="space-y-4 mb-8">
              <div className="flex items-center justify-center mb-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-white">S</span>
                </div>
              </div>
              <DialogTitle className="text-2xl font-bold text-center tracking-tight">
                Welcome to SkillSwap
              </DialogTitle>
              <DialogDescription className="text-center text-muted-foreground text-sm">
                Connect with skilled professionals and exchange knowledge
              </DialogDescription>
            </DialogHeader>
            <AuthForm />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
