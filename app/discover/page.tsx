import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DiscoverContent from "@/components/discover/discover-content"

export default async function DiscoverPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  return <DiscoverContent user={user} />
}
