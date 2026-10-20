import { NextRequest, NextResponse } from "next/server"

const SYSTEM_PROMPT = `You are the SkillSwap Voice Command Assistant.
Your job is to extract structured commands from user speech.

Return ONLY a JSON object. Do not include markdown formatting like \`\`\`json.

Supported Actions:
1. "navigate": Go to a specific page.
   - valid "page" values: "dashboard", "discover", "connections", "messages", "profile", "settings", "help", "home", "sessions", "notifications", "back"
   - Mappings:
     - "chat", "dm", "message" -> "messages"
     - "previous", "last", "past", "back" -> "back"
     - "main", "start" -> "home"
     - "close", "leave" -> "back" or "dashboard"
   - CRITICAL RULES:
     - "Open chatbot", "Talk to AI" -> { "action": "open_chatbot" } (NEVER map "chatbot" to "messages")
     - "Open profile" or "My profile" -> { "action": "navigate", "page": "profile" }
     - "Go past" -> { "action": "navigate", "page": "back" } (NEVER map "past" to "profile")

2. "view_profile": Open a specific user's profile card on the current page.
   - "name": The name of the user (e.g., "Ian Lopes", "Kanishk", "Soham").
   - TRIGGER: "Open [Name] profile", "View [Name]", "Click [Name]".
   - NOTE: If a specific name is mentioned, use this action, NOT "navigate".
   - CRITICAL RULE: Do NOT return "View Profile" as the name. The name must be the person's name suitable for searching on screen.
   - EXAMPLE: "Open Soham profile" -> { "action": "view_profile", "name": "Soham" } (NOT "click View Profile")

3. "open_chatbot": Open the AI Chatbot assistant.
   - TRIGGER: "Open chatbot", "Talk to AI", "Ask AI", "Chat with helper", "Open assistant".

4. "click": Click a button, link, or element with specific text.
   - "text": The text on the button/link (e.g., "Connect", "Saved", "Filters").
   - TRIGGER: "Click [Text]", "Select [Text]", "Press [Text]".
   - FALLBACK: "Open [Text]" (if [Text] is NOT a page, profile, or chatbot, treat it as a click).
   - EXCEPTION: "Open [Name] profile" should be view_profile, NOT click.
   - FORBIDDEN: NEVER return { "action": "click", "text": "View Profile" }. This is ambiguous. YOU MUST EXTRACT THE NAME and use "view_profile".

5. "search": Search for a skill or user type.
   - "query": string
   - TRIGGER: "Show me [Skill]", "Find [Role]", "Search for [Skill]", "List [Role]".
   - CRITICAL RULE: Unless a specific person's name is mentioned, use "search".
     - "Open developers" -> { "action": "search", "query": "developers" }
     - "Show designers" -> { "action": "search", "query": "designers" }

6. "theme": Change theme.
   - "mode": "dark" | "light" | "toggle"

7. "explain": User is asking a question (not a command).
   - "response": Short, helpful answer (max 2 sentences).

8. "scroll": Scroll the page.
   - "direction": "up" | "down" | "top" | "bottom"

9. "type": Type text into the active input.
   - "text": The text to type.

Examples:
- "Open Ian Lopes profile" -> { "action": "view_profile", "name": "Ian Lopes" }
- "View profile for Kanishk" -> { "action": "view_profile", "name": "Kanishk" }
- "Find developers" -> { "action": "search", "query": "developers" }
- "Show me python experts" -> { "action": "search", "query": "python" }
- "Open my profile" -> { "action": "navigate", "page": "profile" }
- "Go to profile" -> { "action": "navigate", "page": "profile" }
- "Open chatbot" -> { "action": "open_chatbot" }
- "Talk to AI" -> { "action": "open_chatbot" }
- "Click Connect" -> { "action": "click", "text": "Connect" }
- "Open sessions" -> { "action": "navigate", "page": "sessions" }
- "Check notifications" -> { "action": "navigate", "page": "notifications" }
- "Go past" -> { "action": "navigate", "page": "back" }
- "Scroll down a bit" -> { "action": "scroll", "direction": "down" }
- "Type Hello World" -> { "action": "type", "text": "Hello World" }
- "What is SkillSwap?" -> { "action": "explain", "response": "SkillSwap is a platform to exchange skills..." }
`

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || (OPENROUTER_API_KEY?.startsWith("AIzaSy") ? OPENROUTER_API_KEY : undefined)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://skillswap.vercel.app"

export async function POST(request: NextRequest) {
    try {
        const { text } = await request.json()

        if (!GEMINI_API_KEY && !OPENROUTER_API_KEY) {
            return NextResponse.json({
                action: "explain",
                response: "AI service not configured. Please add an API key."
            })
        }

        let aiMessage = "{}"

        // Priority 1: Direct Google Gemini API (super fast, robust)
        if (GEMINI_API_KEY) {
            try {
                const geminiRes = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [
                                {
                                    role: "user",
                                    parts: [{ text: `${SYSTEM_PROMPT}\n\nUser speech to parse: "${text}"` }]
                                }
                            ],
                            generationConfig: {
                                temperature: 0.1,
                                maxOutputTokens: 250
                            }
                        })
                    }
                )

                if (geminiRes.ok) {
                    const data = await geminiRes.json()
                    aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}"
                } else {
                    console.error("Gemini API error:", geminiRes.status, await geminiRes.text())
                }
            } catch (err) {
                console.error("Gemini fetch error:", err)
            }
        }

        // Priority 2: Fallback to OpenRouter with verified active free model
        if (aiMessage === "{}" && OPENROUTER_API_KEY && !OPENROUTER_API_KEY.startsWith("AIzaSy")) {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": APP_URL,
                    "X-Title": "SkillSwap Voice Assistant"
                },
                body: JSON.stringify({
                    model: "meta-llama/llama-3.1-8b-instruct:free",
                    messages: [
                        { role: "system", content: SYSTEM_PROMPT },
                        { role: "user", content: text }
                    ],
                    temperature: 0.1,
                    max_tokens: 200
                })
            })

            if (response.ok) {
                const data = await response.json()
                aiMessage = data.choices?.[0]?.message?.content || "{}"
            } else {
                console.error("OpenRouter API error:", response.status)
            }
        }

        // Clean up markdown if present (sometimes models add it despite instructions)
        const cleanJson = aiMessage.replace(/```json\n?|\n?```/g, "").trim()

        try {
            const command = JSON.parse(cleanJson)

            // CRITICAL FIX: If AI returns "click" with "View Profile", it's useless (opens random profile).
            // Try to recover the name from the original text if possible, or fail gracefully.
            if (command.action === "click" && command.text?.toLowerCase().includes("view profile")) {
                console.warn("AI returned generic View Profile click. Attempting to extract name from:", text)
                // specific fix for "Open [Name] profile" which AI might have misclassified
                const nameMatch = text.match(/open\s+(.*?)\s+profile/i) || text.match(/view\s+(.*?)\s+profile/i)
                if (nameMatch && nameMatch[1]) {
                    const name = nameMatch[1].replace(/['"]+/g, '').trim()
                    if (name.toLowerCase() !== "my" && name.toLowerCase() !== "user") {
                        command.action = "view_profile"
                        command.name = name
                        delete command.text
                    }
                }
            }

            return NextResponse.json(command)
        } catch (e) {
            console.error("Failed to parse AI response as JSON:", aiMessage)
            return NextResponse.json({ action: "explain", response: "I didn't understand the command format." })
        }

    } catch (error) {
        console.error("Voice Assistant API error:", error)
        return NextResponse.json({
            action: "explain",
            response: "Sorry, something went wrong processing your request."
        })
    }
}
