import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            userSkillId,
            score,
            maxScore,
            questions,
            userAnswers
        } = await request.json()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Calculate percentage
        const percentage = (score / maxScore) * 100
        const passed = percentage >= 80

        // Get the skill_id from userSkillId
        const { data: userSkill, error: fetchError } = await supabase
            .from("user_skills")
            .select("skill_id, user_id")
            .eq("id", userSkillId)
            .single()

        if (fetchError || !userSkill) {
            console.error("User skill lookup failed:", fetchError)
            return NextResponse.json({ error: "User skill not found" }, { status: 404 })
        }

        if (userSkill.user_id !== user.id) {
            return NextResponse.json({ error: "Unauthorized access to skill" }, { status: 403 })
        }

        // Record the assessment attempt (assessments table may not exist yet)
        try {
            const { error: assessmentError } = await supabase
                .from("assessments")
                .insert({
                    user_id: user.id,
                    skill_id: userSkill.skill_id,
                    score,
                    max_score: maxScore,
                    passed,
                    questions: questions,
                    answers: userAnswers,
                })

            if (assessmentError) {
                console.warn("Failed to save assessment history (table may not exist):", assessmentError.message)
            }
        } catch (historyErr) {
            console.warn("Assessment history save skipped:", historyErr)
        }

        // If passed, update the user_skill as verified
        if (passed) {
            try {
                const { error: updateError } = await supabase
                    .from("user_skills")
                    .update({ verified_at: new Date().toISOString() })
                    .eq("id", userSkillId)

                if (updateError) {
                    // verified_at column may not exist yet - log but don't fail
                    console.warn("Could not set verified_at (column may not exist):", updateError.message)
                }
            } catch (verifyErr) {
                console.warn("Verified update skipped:", verifyErr)
            }
        }

        return NextResponse.json({
            success: true,
            passed,
            percentage
        })

    } catch (error) {
        console.error("Assessment submit error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
