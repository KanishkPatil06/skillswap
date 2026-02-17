import { NextRequest, NextResponse } from "next/server"

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

const SYSTEM_PROMPT = `You are SkillSwap AI Assistant, a helpful chatbot for the SkillSwap platform.

SkillSwap is a community-driven skill exchange platform where users can:
- Create profiles and add their skills (Technical & Non-Technical)
- Discover other users with complementary skills
- Send connection requests to connect with others
- Chat in real-time with their connections
- Create help requests when they need assistance with something
- Voice/video call their connections

Key Navigation Tips:
- Dashboard (/dashboard): View stats, quick actions, and profile overview
- Discover (/discover): Find and connect with other skilled users
- Connections (/connections): View and manage your connections, chat with them
- Help Requests (/help-requests): Browse or create help requests
- Profile (/profile): Edit your profile and manage your skills

Skills are categorized as:
- Technical: Web Development, React, Python, AI/ML, DevOps, etc.
- Non-Technical: Graphic Design, Content Writing, Project Management, etc.

Be friendly, helpful, and concise. Guide users on how to use the platform effectively. If asked about programming or skills, provide helpful guidance. Keep responses brief but informative.

CRITICAL UI DESIGN GUIDELINES:
1. Popups & Modals: All popups, modals, dialogs, drawers, and floating elements (like chat windows) MUST be fully opaque. NEVER use transparent, glassmorphism, or backdrop-blur styles for their backgrounds. Use solid theme colors (bg-background, bg-popover).
2. Dark Mode Visibility: In dark mode, all borders and inputs must have sufficient contrast to be clearly visible against the dark background. Use lighter border colors (e.g., oklch(0.35 0 0) or border-gray-700) instead of the default dark borders. Component borders should be distinct.`

export async function POST(request: NextRequest) {
    try {
        const { messages } = await request.json()

        if (!OPENROUTER_API_KEY) {
            return NextResponse.json(
                {
                    error: "AI service not configured. Please add OPENROUTER_API_KEY to your .env.local file.",
                    message: "I'm not fully configured yet! Please ask the developer to add the OpenRouter API key to enable AI responses."
                },
                { status: 200 }
            )
        }

        // Format messages for OpenRouter (OpenAI-compatible format)
        const formattedMessages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages.map((msg: { role: string; content: string }) => ({
                role: msg.role,
                content: msg.content
            }))
        ]

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "SkillSwap AI Assistant"
            },
            body: JSON.stringify({
                model: "google/gemma-2-9b-it",
                messages: formattedMessages,
                max_tokens: 1024,
                temperature: 0.7
            })
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error("OpenRouter API error:", JSON.stringify(errorData, null, 2))
            console.error("OpenRouter Status:", response.status)
            return NextResponse.json(
                {
                    error: "Failed to get AI response",
                    message: `AI Error: ${errorData.error?.message || "Unknown error"}`
                },
                { status: 200 }
            )
        }

        const data = await response.json()
        const aiMessage = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response."

        return NextResponse.json({ message: aiMessage })
    } catch (error) {
        console.error("Chat API error:", error)
        return NextResponse.json(
            {
                error: "Internal server error",
                message: "Sorry, something went wrong. Please try again!"
            },
            { status: 200 }
        )
    }
}
