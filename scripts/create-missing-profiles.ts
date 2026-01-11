/**
 * Profile Auto-Creation Utility
 * 
 * This script ensures all authenticated users have profiles in the database.
 * Run this to fix missing profiles without accessing Supabase dashboard.
 */

import { createClient } from '@supabase/supabase-js'

// You'll need to set these environment variables or replace with your values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key needed for admin operations

async function createMissingProfiles() {
    console.log('🔍 Checking for users without profiles...')

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })

    try {
        // Get all users from auth.users
        const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

        if (usersError) {
            console.error('❌ Error fetching users:', usersError)
            return
        }

        console.log(`📊 Found ${users.length} total users`)

        // Get all existing profiles
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id')

        if (profilesError) {
            console.error('❌ Error fetching profiles:', profilesError)
            return
        }

        const existingProfileIds = new Set(profiles?.map(p => p.id) || [])
        console.log(`📊 Found ${existingProfileIds.size} existing profiles`)

        // Find users without profiles
        const usersWithoutProfiles = users.filter(user => !existingProfileIds.has(user.id))

        if (usersWithoutProfiles.length === 0) {
            console.log('✅ All users already have profiles!')
            return
        }

        console.log(`🔧 Creating profiles for ${usersWithoutProfiles.length} users...`)

        // Create profiles for users who don't have them
        const profilesToCreate = usersWithoutProfiles.map(user => ({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email || 'User',
            bio: null,
            linkedin_url: null,
            created_at: user.created_at,
            updated_at: new Date().toISOString()
        }))

        const { data, error } = await supabase
            .from('profiles')
            .insert(profilesToCreate)
            .select()

        if (error) {
            console.error('❌ Error creating profiles:', error)
            return
        }

        console.log(`✅ Successfully created ${data.length} profiles!`)
        console.log('\n📋 Created profiles for:')
        data.forEach(profile => {
            console.log(`  - ${profile.full_name} (${profile.id})`)
        })

    } catch (error) {
        console.error('❌ Unexpected error:', error)
    }
}

// Run the function
createMissingProfiles()
    .then(() => {
        console.log('\n✨ Profile creation complete!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n❌ Failed:', error)
        process.exit(1)
    })
