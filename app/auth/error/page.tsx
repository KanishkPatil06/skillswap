export default function AuthErrorPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="text-muted-foreground">Something went wrong during sign in.</p>
      </div>
    </div>
  )
}
