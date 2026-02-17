import { createClient } from "@supabase/supabase-js"

/**
 * Creates a Supabase client with the service role key.
 * This bypasses RLS and has admin privileges.
 * Only use in server-side code (API routes) — NEVER expose to the client.
 */
export function createServiceRoleClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
        console.warn("[Supabase] SUPABASE_SERVICE_ROLE_KEY not set — admin operations will fail")
        return null
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}
