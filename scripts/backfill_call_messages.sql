-- Backfill call history into chat_messages

DO $$
DECLARE
    call_record RECORD;
    msg_content TEXT;
    status_file_name TEXT;
BEGIN
    FOR call_record IN 
        SELECT * FROM public.call_history 
        WHERE status IN ('ended', 'missed', 'rejected')
    LOOP
        -- Determine content based on status
        IF call_record.status IN ('missed', 'rejected') THEN
            msg_content := 'Missed call';
            status_file_name := 'missed';
        ELSE
            msg_content := 'Voice call';
            status_file_name := 'ended';
        END IF;

        -- Check if message already exists (simple check by timestamp proximity could be better, but explicit check for now)
        -- We won't insert if a call message for this connection from this sender at roughly the same time exists
        IF NOT EXISTS (
            SELECT 1 FROM public.chat_messages 
            WHERE connection_id = call_record.connection_id 
            AND message_type = 'call'
            AND created_at = call_record.created_at
        ) THEN
            INSERT INTO public.chat_messages (
                connection_id,
                sender_id,
                content,
                message_type,
                file_name,
                file_size,
                file_type,
                created_at
            ) VALUES (
                call_record.connection_id,
                call_record.caller_id,
                msg_content,
                'call',
                status_file_name,
                COALESCE(call_record.duration_seconds, 0),
                'call',
                call_record.created_at
            );
        END IF;
    END LOOP;
END $$;
