import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    try {
        const { callId, status, duration } = await request.json()

        // Verify authentication
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Update call record
        const updateData: any = {
            status,
            ended_at: new Date().toISOString(),
        }

        if (duration) {
            updateData.duration_seconds = Math.floor(duration)
        }

        const { error } = await supabase
            .from('call_history')
            .update(updateData)
            .eq('id', callId)
            .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ error: 'Failed to update call record' }, { status: 500 })
        }

        // Fetch the full call record to get connection_id and caller/receiver details
        const { data: callRecord, error: fetchError } = await supabase
            .from('call_history')
            .select('*')
            .eq('id', callId)
            .single()

        if (!fetchError && callRecord) {
            const isMissed = status === 'rejected' || status === 'missed'
            const messageContent = isMissed ? 'Missed call' : 'Voice call'

            // Insert chat message
            await supabase.from('chat_messages').insert({
                connection_id: callRecord.connection_id,
                sender_id: callRecord.caller_id, // The caller "sent" the call
                content: messageContent,
                message_type: 'call',
                file_name: status, // Store status in file_name
                file_size: duration || 0, // Store duration in file_size
                file_type: 'call' // specific type tag
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error ending call:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
