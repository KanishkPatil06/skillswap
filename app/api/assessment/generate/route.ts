import { NextRequest, NextResponse } from "next/server"

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

const SYSTEM_PROMPT = `You are an expert technical interviewer. Generate a skill assessment quiz.
Output MUST be valid JSON only, no markdown formatting.
Structure:
{
  "questions": [
    {
      "id": 1,
      "text": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0
    }
  ]
}
Difficulty levels: Beginner, Intermediate, Advanced, Expert.
Generate 5 multiple-choice questions. Questions should be challenging but fair for the level.
Highlight practical knowledge over trivia.`

export async function POST(request: NextRequest) {
    try {
        const { skillName, level } = await request.json()

        if (!OPENROUTER_API_KEY) {
            return NextResponse.json(
                { error: "AI service not configured" },
                { status: 500 }
            )
        }

        if (!skillName || !level) {
            return NextResponse.json(
                { error: "Missing skill name or level" },
                { status: 400 }
            )
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "google/gemma-2-9b-it",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    {
                        role: "user",
                        content: `Generate a ${level} level quiz for the skill: "${skillName}".`
                    }
                ],
                response_format: { type: "json_object" }
            })
        })

        const data = await response.json()
        const content = data.choices?.[0]?.message?.content

        if (!content) {
            throw new Error("No content received from AI")
        }

        // Clean up content if it contains markdown code blocks
        const jsonStr = content.replace(/```json\n?|\n?```/g, "").trim()

        try {
            const quiz = JSON.parse(jsonStr)
            return NextResponse.json(quiz)
        } catch (e) {
            console.error("JSON parse error:", e, content)
            return NextResponse.json(
                { error: "Failed to parse AI response" },
                { status: 500 }
            )
        }

    } catch (error) {
        console.error("Quiz generation error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
