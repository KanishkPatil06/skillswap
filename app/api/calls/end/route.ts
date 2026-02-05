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

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error ending call:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
