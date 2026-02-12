import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: availability, error } = await supabase
            .from('availabilities')
            .select('*')
            .eq('user_id', user.id);

        if (error) {
            console.error('Error fetching availability:', error);
            return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
        }

        return NextResponse.json(availability);
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { availabilities } = body;

        if (!Array.isArray(availabilities)) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        // 1. Delete existing availability for the user
        const { error: deleteError } = await supabase
            .from('availabilities')
            .delete()
            .eq('user_id', user.id);

        if (deleteError) {
            console.error('Error clearing old availability:', deleteError);
            return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 });
        }

        // 2. Insert new availability
        if (availabilities.length > 0) {
            const { error: insertError } = await supabase
                .from('availabilities')
                .insert(
                    availabilities.map((slot: any) => ({
                        user_id: user.id,
                        day_of_week: slot.day_of_week,
                        start_time: slot.start_time,
                        end_time: slot.end_time,
                    }))
                );

            if (insertError) {
                console.error('Error inserting new availability:', insertError);
                return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
