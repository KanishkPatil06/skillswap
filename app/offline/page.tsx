"use client"

export default function OfflinePage() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center px-6 max-w-md">
                    <div className="text-6xl mb-6">📡</div>
                    <h1 className="text-3xl font-bold text-foreground mb-3">
                        You're Offline
                    </h1>
                    <p className="text-muted-foreground text-lg mb-8">
                        It looks like you've lost your internet connection.
                        Some features may be unavailable until you're back online.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        Try Again
                    </button>
                    <p className="text-sm text-muted-foreground mt-6">
                        Cached pages may still be available.
                    </p>
                </div>
            </div>
        </div>
    )
}
