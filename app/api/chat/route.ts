import { NextRequest, NextResponse } from "next/server"

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

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || (OPENROUTER_API_KEY?.startsWith("AIzaSy") ? OPENROUTER_API_KEY : undefined)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://skillswap.vercel.app"

export async function POST(request: NextRequest) {
    try {
        const { messages } = await request.json()

        if (!GEMINI_API_KEY && !OPENROUTER_API_KEY) {
            return NextResponse.json(
                {
                    error: "AI service not configured. Please add an API key.",
                    message: "I'm not fully configured yet! Please add a GEMINI_API_KEY or OPENROUTER_API_KEY to your .env.local file."
                },
                { status: 200 }
            )
        }

        let aiMessage: string | null = null

        // Gemini requires conversations to start with "user" — strip any leading assistant messages
        // (e.g. the welcome message the UI sends as the first item)
        const userMessages: { role: string; content: string }[] = messages
        const firstUserIdx = userMessages.findIndex((m: { role: string }) => m.role === "user")
        const trimmedMessages = firstUserIdx >= 0 ? userMessages.slice(firstUserIdx) : userMessages

        // Priority 1: Google Gemini API (ultra-fast, reliable, free tier supported)
        if (GEMINI_API_KEY) {
            try {
                // Convert messages to Gemini contents format (must start with "user")
                const contents = trimmedMessages.map((m: { role: string; content: string }) => ({
                    role: m.role === "assistant" ? "model" : "user",
                    parts: [{ text: m.content }]
                }))

                const geminiRes = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${GEMINI_API_KEY}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            systemInstruction: {
                                parts: [{ text: SYSTEM_PROMPT }]
                            },
                            contents,
                            generationConfig: {
                                temperature: 0.7,
                                maxOutputTokens: 1024
                            }
                        })
                    }
                )

                if (geminiRes.ok) {
                    const data = await geminiRes.json()
                    aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || null
                } else {
                    console.error("Gemini API error in chat route:", geminiRes.status, await geminiRes.text())
                }
            } catch (err) {
                console.error("Gemini fetch error in chat:", err)
            }
        }

        // Priority 2: Fallback to OpenRouter with active free model
        if (!aiMessage && OPENROUTER_API_KEY && !OPENROUTER_API_KEY.startsWith("AIzaSy")) {
            const formattedMessages = [
                { role: "system", content: SYSTEM_PROMPT },
                ...trimmedMessages.map((msg: { role: string; content: string }) => ({
                    role: msg.role,
                    content: msg.content
                }))
            ]

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": APP_URL,
                    "X-Title": "SkillSwap AI Assistant"
                },
                body: JSON.stringify({
                    model: "meta-llama/llama-3.1-8b-instruct:free",
                    messages: formattedMessages,
                    max_tokens: 1024,
                    temperature: 0.7
                })
            })

            if (response.ok) {
                const data = await response.json()
                aiMessage = data.choices?.[0]?.message?.content || null
            } else {
                let errorData: any = {}
                try { errorData = await response.json() } catch {}
                console.error("OpenRouter API error in chat route:", errorData)
                // Do NOT surface raw API errors to the user
            }
        }

        if (!aiMessage) {
            aiMessage = "Hello! I'm SkillSwap Assistant. How can I help you find skills or connections today?"
        }

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
