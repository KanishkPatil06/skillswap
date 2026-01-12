import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ProfileContent from "@/components/profile/profile-content"

export default async function ProfilePage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/")
    }

    return <ProfileContent user={user} />
}
