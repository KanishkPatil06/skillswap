const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
const envPath = path.join(__dirname, '.env.local')
const envFile = fs.readFileSync(envPath, 'utf-8')
const env = {}
envFile.split('\n').forEach(line => {
    const [key, ...values] = line.split('=')
    if (key && values.length) {
        env[key.trim()] = values.join('=').trim()
    }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

console.log('🚀 Starting Supabase setup for file and notes sharing...\n')
console.log(`📍 Supabase URL: ${supabaseUrl}\n`)

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function runMigration() {
    console.log('📝 Step 1: Running database migration...')

    try {
        // Add columns one by one
        const alterStatements = [
            `ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'note'))`,
            `ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS file_url TEXT`,
            `ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS file_name TEXT`,
            `ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS file_size BIGINT`,
            `ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS file_type TEXT`,
            `ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS note_title TEXT`,
            `ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS note_content TEXT`,
            `CREATE INDEX IF NOT EXISTS idx_chat_messages_message_type ON public.chat_messages(message_type)`
        ]

        for (const statement of alterStatements) {
            const { data, error } = await supabase.rpc('exec', { sql: statement })
            if (error && !error.message.includes('already exists')) {
                console.log(`   ⚠️  ${error.message}`)
            } else {
                const action = statement.includes('ADD COLUMN') ? 'Added column' : 'Created index'
                const match = statement.match(/(?:ADD COLUMN IF NOT EXISTS |CREATE INDEX IF NOT EXISTS )\w+/)
                const name = match ? match[0].split(' ').pop() : ''
                console.log(`   ✅ ${action}: ${name}`)
            }
        }

        console.log('   ✅ Database migration completed!\n')
        return true
    } catch (error) {
        console.error('   ❌ Migration error:', error.message)
        console.log('   ℹ️  You may need to run the SQL manually in Supabase Dashboard\n')
        return false
    }
}

async function createStorageBucket() {
    console.log('📦 Step 2: Creating storage bucket...')

    try {
        const { data, error } = await supabase.storage.createBucket('chat-files', {
            public: true,
            fileSizeLimit: 10485760, // 10MB
        })

        if (error) {
            if (error.message.includes('already exists')) {
                console.log('   ℹ️  Bucket "chat-files" already exists (skipping)\n')
                return true
            } else {
                throw error
            }
        } else {
            console.log('   ✅ Storage bucket "chat-files" created successfully!\n')
            return true
        }
    } catch (error) {
        console.error('   ❌ Bucket creation error:', error.message, '\n')
        return false
    }
}

async function verifySetup() {
    console.log('🔍 Step 3: Verifying setup...')

    try {
        // Check if bucket exists
        const { data: buckets, error } = await supabase.storage.listBuckets()

        if (error) {
            console.log('   ⚠️  Could not verify buckets:', error.message)
            return
        }

        const chatFilesBucket = buckets?.find(b => b.name === 'chat-files')

        if (chatFilesBucket) {
            console.log('   ✅ Bucket "chat-files" exists')
            console.log(`   ✅ Public: ${chatFilesBucket.public}`)
            console.log(`   ✅ File size limit: ${chatFilesBucket.file_size_limit || 'Not set'}\n`)
        } else {
            console.log('   ⚠️  Bucket "chat-files" not found\n')
        }
    } catch (error) {
        console.error('   ❌ Verification error:', error.message, '\n')
    }
}

async function main() {
    try {
        const migrationSuccess = await runMigration()
        const bucketSuccess = await createStorageBucket()
        await verifySetup()

        console.log('═'.repeat(60))
        if (migrationSuccess && bucketSuccess) {
            console.log('✨ Setup completed successfully!\n')
        } else {
            console.log('⚠️  Setup partially completed\n')
        }

        console.log('📋 IMPORTANT: Storage Policies')
        console.log('   You need to set storage policies in Supabase Dashboard:')
        console.log('   1. Go to Storage → chat-files → Policies')
        console.log('   2. Add INSERT policy for uploads')
        console.log('   3. Add SELECT policy for downloads')
        console.log('   (See COPY_PASTE_SETUP.md for exact SQL)\n')

        console.log('🎉 Next: Test the feature!')
        console.log('   1. Open http://localhost:3000/connections')
        console.log('   2. Open any chat')
        console.log('   3. Look for 📎 (file) and 📝 (note) icons\n')
        console.log('═'.repeat(60))
    } catch (error) {
        console.error('❌ Setup failed:', error.message)
        process.exit(1)
    }
}

main()
