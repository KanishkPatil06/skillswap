import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

interface UserSkill {
    id: string
    level: string
    skill: { id: string; name: string; category: string }
}

interface UserProfile {
    id: string
    full_name: string | null
    bio: string | null
    linkedin_url: string | null
    user_skills: UserSkill[]
}

interface MatchResult {
    user: UserProfile
    matchScore: number
    theyCanTeach: string[]
    youCanTeach: string[]
    matchReason: string
}

// Calculate skill level score (Expert = 4, Advanced = 3, etc.)
function getLevelScore(level: string): number {
    const scores: Record<string, number> = {
        "Expert": 4,
        "Advanced": 3,
        "Intermediate": 2,
        "Beginner": 1
    }
    return scores[level] || 1
}

// Calculate match score between two users
function calculateMatchScore(
    currentUserSkills: any[],
    targetUserSkills: any[]
): { score: number; theyCanTeach: string[]; youCanTeach: string[] } {
    const currentSkillNames = new Set(currentUserSkills.map(s => s.skill?.name).filter(Boolean))
    const targetSkillNames = new Set(targetUserSkills.map(s => s.skill?.name).filter(Boolean))

    // Skills they have that you don't (they can teach you)
    const theyCanTeach: string[] = []
    targetUserSkills.forEach(s => {
        if (s.skill?.name && !currentSkillNames.has(s.skill.name)) {
            theyCanTeach.push(s.skill.name)
        }
    })

    // Skills you have that they don't (you can teach them)
    const youCanTeach: string[] = []
    currentUserSkills.forEach(s => {
        if (s.skill?.name && !targetSkillNames.has(s.skill.name)) {
            youCanTeach.push(s.skill.name)
        }
    })

    // Scoring factors
    let score = 0

    // Complementary skills bonus (40% weight)
    const complementaryScore = Math.min((theyCanTeach.length + youCanTeach.length) * 10, 40)
    score += complementaryScore

    // Mentorship potential (30% weight) - Expert teaching Beginner/Intermediate
    let mentorshipScore = 0
    targetUserSkills.forEach(ts => {
        currentUserSkills.forEach(cs => {
            if (ts.skill?.name && cs.skill?.name && ts.skill.name === cs.skill.name) {
                const levelDiff = Math.abs(getLevelScore(ts.level) - getLevelScore(cs.level))
                if (levelDiff >= 2) {
                    mentorshipScore += 15 // Good mentorship match
                } else if (levelDiff === 1) {
                    mentorshipScore += 10 // Some mentorship potential
                }
            }
        })
    })
    score += Math.min(mentorshipScore, 30)

    // Shared interests bonus (30% weight) - Same skills for collaboration
    let sharedSkillsCount = 0
    currentSkillNames.forEach(name => {
        if (targetSkillNames.has(name)) sharedSkillsCount++
    })
    const sharedScore = Math.min(sharedSkillsCount * 10, 30)
    score += sharedScore

    return {
        score: Math.min(Math.round(score), 100),
        theyCanTeach: theyCanTeach.slice(0, 5),
        youCanTeach: youCanTeach.slice(0, 5)
    }
}

// Generate match explanation using AI (optional, falls back to template)
async function generateMatchReason(
    currentUser: any,
    targetUser: any,
    theyCanTeach: string[],
    youCanTeach: string[],
    score: number
): Promise<string> {
    // Simple template-based explanation if no API key
    if (!OPENROUTER_API_KEY) {
        if (theyCanTeach.length > 0 && youCanTeach.length > 0) {
            return `Great skill exchange potential! They can teach you ${theyCanTeach.slice(0, 2).join(", ")} while you can share your ${youCanTeach.slice(0, 2).join(", ")} expertise.`
        } else if (theyCanTeach.length > 0) {
            return `They have expertise in ${theyCanTeach.slice(0, 2).join(", ")} that could help you grow.`
        } else if (youCanTeach.length > 0) {
            return `You could mentor them in ${youCanTeach.slice(0, 2).join(", ")}.`
        }
        return "Potential for skill sharing and collaboration."
    }

    try {
        const currentSkills = currentUser.user_skills?.map((s: any) => s.skill?.name).filter(Boolean).join(", ") || "various skills"
        const targetSkills = targetUser.user_skills?.map((s: any) => s.skill?.name).filter(Boolean).join(", ") || "various skills"

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "google/gemma-2-9b-it",
                messages: [{
                    role: "user",
                    content: `Generate a brief, friendly 1-sentence match explanation for skill exchange.
User A skills: ${currentSkills}
User B (${targetUser.full_name || "User"}) skills: ${targetSkills}
They can teach: ${theyCanTeach.join(", ") || "nothing new"}
You can teach them: ${youCanTeach.join(", ") || "nothing new"}
Match score: ${score}%

Keep it under 20 words, positive and encouraging.`
                }],
                max_tokens: 60,
                temperature: 0.7
            })
        })

        const data = await response.json()
        return data.choices?.[0]?.message?.content?.trim() || "Great potential for skill exchange!"
    } catch (error) {
        console.error("AI explanation error:", error)
        return "Great potential for skill exchange and collaboration!"
    }
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get current user's skills
        const { data: currentUserData } = await supabase
            .from("profiles")
            .select("id, full_name, bio, user_skills(id, level, skill:skills(id, name, category))")
            .eq("id", user.id)
            .single()

        if (!currentUserData || !currentUserData.user_skills?.length) {
            return NextResponse.json({
                matches: [],
                message: "Add some skills to your profile to get matched!"
            })
        }

        // Get all other users with skills
        const { data: otherUsers } = await supabase
            .from("profiles")
            .select("id, full_name, bio, linkedin_url, user_skills(id, level, skill:skills(id, name, category))")
            .neq("id", user.id)

        if (!otherUsers || otherUsers.length === 0) {
            return NextResponse.json({
                matches: [],
                message: "No other users found yet."
            })
        }

        // Calculate matches
        const matches: MatchResult[] = []

        for (const targetUser of otherUsers) {
            if (!targetUser.user_skills?.length) continue

            const { score, theyCanTeach, youCanTeach } = calculateMatchScore(
                currentUserData.user_skills,
                targetUser.user_skills
            )

            // Only include matches with score > 20
            if (score > 20) {
                const matchReason = await generateMatchReason(
                    currentUserData,
                    targetUser,
                    theyCanTeach,
                    youCanTeach,
                    score
                )

                matches.push({
                    user: {
                        id: targetUser.id,
                        full_name: targetUser.full_name,
                        bio: targetUser.bio,
                        linkedin_url: targetUser.linkedin_url,
                        user_skills: targetUser.user_skills as any
                    },
                    matchScore: score,
                    theyCanTeach,
                    youCanTeach,
                    matchReason
                })
            }
        }

        // Sort by match score (highest first)
        matches.sort((a, b) => b.matchScore - a.matchScore)

        return NextResponse.json({
            matches: matches.slice(0, 10), // Top 10 matches
            total: matches.length
        })
    } catch (error) {
        console.error("Skill match error:", error)
        return NextResponse.json(
            { error: "Failed to find matches" },
            { status: 500 }
        )
    }
}
