import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center space-y-6">
        <div>
          <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">Page not found</h2>
        </div>
        <p className="text-muted-foreground max-w-sm">Sorry, we couldn&apos;t find the page you&apos;re looking for.</p>
        <Link href="/dashboard">
          <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
