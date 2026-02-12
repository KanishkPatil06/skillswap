import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MainNav } from "@/components/navigation/main-nav"
import { MySessions } from "@/components/sessions/my-sessions"

export default async function SessionsPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/auth")
    }

    return (
        <div className="min-h-screen bg-background">
            <MainNav user={user} />
            <main className="container mx-auto py-8">
                <MySessions user={user} />
            </main>
        </div>
    )
}
