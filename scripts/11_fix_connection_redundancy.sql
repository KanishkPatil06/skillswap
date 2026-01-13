-- ============================================================================
-- FIX CONNECTION REDUNDANCY
-- ============================================================================
-- This script prevents duplicate connections between users in both directions.
-- It ensures that if User A connects to User B, User B cannot create
-- another connection to User A (and vice versa).
--
-- IMPORTANT: This will remove any existing duplicate connections.
-- ============================================================================

-- Step 1: Find and display duplicate connections (for review)
-- This query shows which connections will be removed
SELECT 
    LEAST(user_id, connected_user_id) as user_a,
    GREATEST(user_id, connected_user_id) as user_b,
    COUNT(*) as connection_count,
    array_agg(id ORDER BY created_at) as connection_ids,
    array_agg(status ORDER BY created_at) as statuses,
    array_agg(created_at ORDER BY created_at) as created_dates
FROM connections
GROUP BY LEAST(user_id, connected_user_id), GREATEST(user_id, connected_user_id)
HAVING COUNT(*) > 1;

-- Step 2: Remove duplicate connections (keeps the oldest one)
-- This keeps the first connection created and removes newer duplicates
WITH duplicates AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY LEAST(user_id, connected_user_id), GREATEST(user_id, connected_user_id)
            ORDER BY created_at ASC
        ) as rn
    FROM connections
)
DELETE FROM connections
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Step 3: Drop the old unique constraint
-- The constraint name is auto-generated, so we need to find and drop it
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the constraint name
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'connections'::regclass
    AND contype = 'u'
    AND array_length(conkey, 1) = 2
    AND conkey @> ARRAY[
        (SELECT attnum FROM pg_attribute WHERE attrelid = 'connections'::regclass AND attname = 'user_id'),
        (SELECT attnum FROM pg_attribute WHERE attrelid = 'connections'::regclass AND attname = 'connected_user_id')
    ];
    
    -- Drop the constraint if it exists
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE connections DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'Old constraint not found, skipping drop';
    END IF;
END $$;

-- Step 4: Create bidirectional unique index
-- This prevents connections in both directions (A→B and B→A)
CREATE UNIQUE INDEX IF NOT EXISTS unique_connection_pair 
ON connections (LEAST(user_id, connected_user_id), GREATEST(user_id, connected_user_id));

-- Step 5: Verify the index was created
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'connections' 
AND indexname = 'unique_connection_pair';

-- Step 6: Test the constraint (optional verification query)
-- Uncomment to verify - this should return 0 rows if working correctly
-- SELECT 
--     LEAST(user_id, connected_user_id) as user_a,
--     GREATEST(user_id, connected_user_id) as user_b,
--     COUNT(*) as connection_count
-- FROM connections
-- GROUP BY LEAST(user_id, connected_user_id), GREATEST(user_id, connected_user_id)
-- HAVING COUNT(*) > 1;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
-- If you see this without errors, the migration was successful!
-- The unique_connection_pair index now prevents duplicate connections.
-- ============================================================================
