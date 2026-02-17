
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Role Key in environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
})

async function seedAvailability() {
    console.log('🌱 Seeding availability...')

    // 1. Get all profiles
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')

    if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        return
    }

    if (!profiles || profiles.length === 0) {
        console.log('No profiles found.')
        return
    }

    console.log(`Found ${profiles.length} profiles. Checking availability...`)

    let seededCount = 0

    for (const profile of profiles) {
        // 2. Check availability
        const { data: availability, error: availError } = await supabase
            .from('availabilities')
            .select('id')
            .eq('user_id', profile.id)

        if (availError) {
            console.error(`Error checking availability for ${profile.id}:`, availError)
            continue
        }

        if (availability && availability.length > 0) {
            console.log(`- ${profile.full_name || 'User ' + profile.id} already has availability.`)
            continue
        }

        // 3. Insert default availability (Mon-Fri, 09:00-17:00)
        console.log(`- Seeding availability for ${profile.full_name || 'User ' + profile.id}...`)

        const defaultAvailability = []
        for (let day = 1; day <= 5; day++) { // 1=Monday to 5=Friday
            defaultAvailability.push({
                user_id: profile.id,
                day_of_week: day,
                start_time: '09:00',
                end_time: '17:00'
            })
        }

        const { error: insertError } = await supabase
            .from('availabilities')
            .insert(defaultAvailability)

        if (insertError) {
            console.error(`  Error inserting availability:`, insertError)
        } else {
            console.log(`  Done.`)
            seededCount++
        }
    }
    console.log(`✨ Availability seeding complete. Seeded ${seededCount} profiles.`)
}

seedAvailability()
