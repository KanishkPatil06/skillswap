import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ConnectionsContent from "@/components/connections/connections-content"

export default async function ConnectionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  return <ConnectionsContent user={user} />
}
