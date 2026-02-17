
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugSessions() {
    console.log('🔍 Debugging Sessions Table...')

    // 1. Count total sessions
    const { count, error: countError } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })

    if (countError) {
        console.error('❌ Error counting sessions:', countError)
        return
    }
    console.log(`📊 Total Sessions in DB: ${count}`)

    if (count === 0) {
        console.log('💡 No sessions found. "No upcoming sessions" is the expected empty state.')
        return
    }

    // 2. Fetch recent sessions details
    const { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
        id, 
        status, 
        scheduled_at, 
        topic:skill_id(name),
        mentor:mentor_id(full_name),
        learner:learner_id(full_name)
    `)
        .limit(5)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('❌ Error fetching details:', error)
        return
    }

    console.log(JSON.stringify(sessions, null, 2))
}

debugSessions()
