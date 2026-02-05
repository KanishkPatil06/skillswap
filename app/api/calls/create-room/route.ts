import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    try {
        const { connectionId, callerId, receiverId } = await request.json()

        // Verify authentication
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || user.id !== callerId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // For now, we'll use a simple room naming instead of Daily.co API
        // This allows testing without Daily.co API key first
        const roomUrl = `https://meet.daily.co/${connectionId}-${Date.now()}`

        // Create call history record
        const { data: callRecord, error: dbError } = await supabase
            .from('call_history')
            .insert({
                connection_id: connectionId,
                caller_id: callerId,
                receiver_id: receiverId,
                call_type: 'voice',
                status: 'ringing',
                room_url: roomUrl,
                started_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (dbError) {
            console.error('Database error:', dbError)
            return NextResponse.json({ error: 'Failed to save call record' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            roomUrl,
            callId: callRecord.id,
        })
    } catch (error) {
        console.error('Error creating call room:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
