-- Add 'audio' to message_type check constraint

-- 1. Drop the existing constraint
-- Note: The constraint name is usually auto-generated if not specified, but valid postgres usually names it table_column_check.
-- However, line 10 in 12_add_file_notes_sharing.sql didn't name it.
-- We can try to drop it by name 'chat_messages_message_type_check' (default)
-- Or we can just alter column to drop check? Postgres doesn't work that way easily without name.
-- Let's try to drop the constraint by name.

DO $$
DECLARE
    con_name text;
BEGIN
    SELECT con.conname INTO con_name
    FROM pg_catalog.pg_constraint con
    INNER JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
    INNER JOIN pg_catalog.pg_namespace nsp ON nsp.oid = connamespace
    WHERE nsp.nspname = 'public'
    AND rel.relname = 'chat_messages'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) LIKE '%message_type%';

    IF con_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.chat_messages DROP CONSTRAINT ' || con_name;
    END IF;
END $$;

-- 2. Add the new constraint with 'audio'
ALTER TABLE public.chat_messages
ADD CONSTRAINT chat_messages_message_type_check 
CHECK (message_type IN ('text', 'file', 'note', 'audio'));
