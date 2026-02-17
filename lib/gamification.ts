import { createClient } from '@/lib/supabase/server'

export async function awardPoints(userId: string, amount: number, reason: string) {
    const supabase = await createClient()

    try {
        // 1. Update Profile Points
        const { error: profileError } = await supabase.rpc('increment_points', {
            row_id: userId,
            amount: amount
        })

        // Fallback if RPC doesn't exist (though RPC is safer for concurrency)
        // For now, let's just do a fetch-update if RPC isn't set up, or better, 
        // let's assume standard update for simplicity unless we want to add an RPC function.
        // Actually, simple update is fine for this scale.

        const { data: profile } = await supabase.from('profiles').select('points').eq('id', userId).single()
        const currentPoints = profile?.points || 0
        const newPoints = currentPoints + amount

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ points: newPoints })
            .eq('id', userId)

        if (updateError) throw updateError

        // 2. Log History
        const { error: historyError } = await supabase
            .from('point_history')
            .insert({
                user_id: userId,
                amount,
                reason
            })

        if (historyError) console.error("Failed to log points:", historyError)

        // 3. Check for new badges
        await checkBadges(userId, newPoints)

    } catch (error) {
        console.error("Error awarding points:", error)
    }
}

export async function checkBadges(userId: string, currentPoints: number) {
    const supabase = await createClient()

    // Fetch badges compatible with points (category 'community' or 'sessions' based on points)
    // For simplicity, we check all point-based badges that the user doesn't have.

    // 1. Get all badges related to points
    const { data: pointBadges } = await supabase
        .from('badges')
        .select('*')
        .gt('required_points', 0)
        .lte('required_points', currentPoints)

    if (!pointBadges?.length) return

    // 2. Get user's existing badges
    const { data: userBadges } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', userId)

    const existingBadgeIds = new Set(userBadges?.map(b => b.badge_id))

    // 3. Award new badges
    const newBadges = pointBadges.filter(b => !existingBadgeIds.has(b.id))

    if (newBadges.length > 0) {
        const badgesToInsert = newBadges.map(b => ({
            user_id: userId,
            badge_id: b.id
        }))

        const { error } = await supabase.from('user_badges').insert(badgesToInsert)

        if (!error) {
            // Trigger notifications directly
            const notifications = newBadges.map(b => ({
                user_id: userId,
                type: 'badge_earned',
                title: 'New Badge Unlocked!',
                message: `You earned the "${b.name}" badge!`,
                link: '/profile',
                metadata: { badge_id: b.id, badge_icon: b.icon_url }
            }))

            await supabase.from('notifications').insert(notifications)
        }
    }
}
