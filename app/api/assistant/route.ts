import { NextRequest, NextResponse } from "next/server"

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

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
   - "name": The name of the user (e.g., "Ian Lopes", "Kanishk").
   - TRIGGER: "Open [Name] profile", "View [Name]", "Click [Name]".
   - NOTE: If a specific name is mentioned, use this action, NOT "navigate".

3. "open_chatbot": Open the AI Chatbot assistant.
   - TRIGGER: "Open chatbot", "Talk to AI", "Ask AI", "Chat with helper", "Open assistant".

4. "click": Click a button, link, or element with specific text.
   - "text": The text on the button/link (e.g., "Connect", "Saved", "Filters").
   - TRIGGER: "Click [Text]", "Select [Text]", "Press [Text]".
   - FALLBACK: "Open [Text]" (if [Text] is NOT a page, profile, or chatbot, treat it as a click).

5. "search": Search for a skill or user.
   - "query": string

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

export async function POST(request: NextRequest) {
    try {
        const { text } = await request.json()

        if (!OPENROUTER_API_KEY) {
            return NextResponse.json({
                action: "explain",
                response: "AI service not configured. Please add API key."
            })
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "SkillSwap Voice Assistant"
            },
            body: JSON.stringify({
                model: "google/gemma-2-9b-it",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: text }
                ],
                temperature: 0.1, // Low temperature for deterministic JSON commands
                max_tokens: 200
            })
        })

        if (!response.ok) {
            console.error("OpenRouter API error", response.status)
            return NextResponse.json({ action: "explain", response: "Sorry, I couldn't process that command." })
        }

        const data = await response.json()
        const aiMessage = data.choices?.[0]?.message?.content || "{}"

        // Clean up markdown if present (sometimes models add it despite instructions)
        const cleanJson = aiMessage.replace(/```json\n?|\n?```/g, "").trim()

        try {
            const command = JSON.parse(cleanJson)
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
