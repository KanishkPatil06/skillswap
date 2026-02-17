import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTables() {
    console.log('Verifying session tables...');

    try {
        const { data, error } = await supabase.from('sessions').select('id, scheduled_at, duration_minutes, status').limit(1);

        if (error) {
            if (error.code === '42P01') { // undefined_table
                console.error('❌ Table "sessions" does not exist.');
                process.exit(1);
            } else {
                console.error('❌ Error checking "sessions" table:', error.message);
                process.exit(1);
            }
        }

        console.log('✅ Table "sessions" exists.');

        // Check constraints or columns if needed, but existence is a good start.
        process.exit(0);
    } catch (err) {
        console.error('❌ Unexpected error:', err);
        process.exit(1);
    }
}

verifyTables();
