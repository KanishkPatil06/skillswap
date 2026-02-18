-- Add 'call' to message_type check constraint

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

-- Add the new constraint with 'audio' and 'call'
ALTER TABLE public.chat_messages
ADD CONSTRAINT chat_messages_message_type_check 
CHECK (message_type IN ('text', 'file', 'note', 'audio', 'call'));
