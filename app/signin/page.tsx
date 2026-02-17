"use client"

import { AuthModal } from "@/components/auth/auth-modal"
import { useRouter } from "next/navigation"

export default function SignInPage() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-black relative flex items-center justify-center overflow-hidden">
            {/* Background - Reusing the cinematic dashboard concept or just a rich gradient */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
            </div>

            {/* We force the modal to be 'open' and redirect to home if closed */}
            <div className="relative z-10 w-full max-w-md px-4">
                <AuthModal isOpen={true} onClose={() => router.push('/')} />
            </div>
        </div>
    )
}
