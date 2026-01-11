"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <div>
          <h1 className="text-4xl font-bold text-destructive mb-2">Error</h1>
          <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
        </div>
        <p className="text-muted-foreground text-sm">{error?.message || "An unexpected error occurred."}</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => reset()} variant="outline">
            Try again
          </Button>
          <Button onClick={() => router.push("/")} className="bg-primary hover:bg-primary/90">
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}
