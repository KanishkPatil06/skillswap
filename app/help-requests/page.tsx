import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import HelpRequestsContent from "@/components/help-requests/help-requests-content"

export default async function HelpRequestsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  return <HelpRequestsContent user={user} />
}
