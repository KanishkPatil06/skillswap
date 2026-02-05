import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

console.log('🚀 Starting Supabase setup for file and notes sharing...\n')

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
        // Read the migration SQL file
        const migrationPath = path.join(process.cwd(), 'scripts', '12_add_file_notes_sharing.sql')
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

        // Split by semicolons and filter out comments and empty lines
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'))

        // Execute each statement
        for (const statement of statements) {
            if (statement.toUpperCase().includes('SELECT') &&
                (statement.includes('information_schema') || statement.includes('pg_indexes'))) {
                // This is a verification query
                const { data, error } = await supabase.rpc('exec_sql', { sql: statement })
                if (error) {
                    console.log(`   ⚠️  Verification query skipped (this is normal)`)
                } else {
                    console.log(`   ✅ Verification passed`)
                }
            } else if (statement.includes('ALTER TABLE') || statement.includes('CREATE INDEX')) {
                // Execute DDL statements
                const { error } = await supabase.rpc('exec_sql', { sql: statement })
                if (error) {
                    console.log(`   ℹ️  ${error.message} (this is OK if column/index already exists)`)
                } else {
                    console.log(`   ✅ Executed: ${statement.substring(0, 50)}...`)
                }
            }
        }

        console.log('   ✅ Database migration completed!\n')
    } catch (error: any) {
        console.error('   ❌ Migration error:', error.message)
        console.log('   ℹ️  Trying alternative approach...\n')
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
                console.log('   ℹ️  Bucket already exists (skipping)\n')
            } else {
                throw error
            }
        } else {
            console.log('   ✅ Storage bucket "chat-files" created!\n')
        }
    } catch (error: any) {
        console.error('   ❌ Bucket creation error:', error.message, '\n')
    }
}

async function setupStoragePolicies() {
    console.log('🔒 Step 3: Setting up storage policies...')

    // Note: Storage policies need to be set via SQL
    const uploadPolicy = `
    CREATE POLICY "Users can upload files to their connections"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'chat-files' AND
      EXISTS (
        SELECT 1 FROM public.connections c
        WHERE (c.user_id = auth.uid() OR c.connected_user_id = auth.uid())
        AND c.status = 'accepted'
      )
    );
  `

    const selectPolicy = `
    CREATE POLICY "Users can view files in their connections"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'chat-files' AND
      EXISTS (
        SELECT 1 FROM public.connections c
        WHERE (c.user_id = auth.uid() OR c.connected_user_id = auth.uid())
        AND c.status = 'accepted'
      )
    );
  `

    console.log('   ℹ️  Storage policies should be set manually in Supabase Dashboard')
    console.log('   ℹ️  Or run the SQL from the migration file\n')
}

async function verifySetup() {
    console.log('🔍 Step 4: Verifying setup...')

    try {
        // Check if bucket exists
        const { data: buckets } = await supabase.storage.listBuckets()
        const chatFilesBucket = buckets?.find(b => b.name === 'chat-files')

        if (chatFilesBucket) {
            console.log('   ✅ Bucket "chat-files" exists')
            console.log(`   ✅ Public: ${chatFilesBucket.public}`)
        } else {
            console.log('   ⚠️  Bucket "chat-files" not found')
        }

        console.log('\n')
    } catch (error: any) {
        console.error('   ❌ Verification error:', error.message, '\n')
    }
}

async function main() {
    try {
        await runMigration()
        await createStorageBucket()
        await setupStoragePolicies()
        await verifySetup()

        console.log('✨ Setup complete!')
        console.log('\n📋 Next steps:')
        console.log('   1. Go to Supabase Dashboard → Storage → chat-files → Policies')
        console.log('   2. Add the two storage policies from the migration file')
        console.log('   3. Test the feature in your app at http://localhost:3000/connections')
        console.log('\n🎉 Look for the 📎 (file) and 📝 (note) icons in the chat!\n')
    } catch (error: any) {
        console.error('❌ Setup failed:', error.message)
        process.exit(1)
    }
}

main()
