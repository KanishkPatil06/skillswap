import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

export async function POST(request: Request) {
    try {
        const { connectionId, callerId, receiverId } = await request.json()

        // Verify authentication
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || user.id !== callerId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Generate a unique channel ID for WebRTC signaling
        const callChannelId = `${connectionId}-${randomUUID().slice(0, 8)}`

        // Create call history record
        const { data: callRecord, error: dbError } = await supabase
            .from('call_history')
            .insert({
                connection_id: connectionId,
                caller_id: callerId,
                receiver_id: receiverId,
                call_type: 'voice',
                status: 'ringing',
                room_url: callChannelId, // Store channel ID for reference
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
            callChannelId,
            callId: callRecord.id,
        })
    } catch (error) {
        console.error('Error creating call room:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
