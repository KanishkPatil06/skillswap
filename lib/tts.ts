/**
 * Text-to-Speech utility using the Web Speech API.
 * Handles Chrome's async voice loading.
 */

const PREFERRED_VOICES = [
    "Google US English",
    "Microsoft Zira",
    "Google UK English Female",
    "Samantha",
    "Alex",
]

let cachedVoice: SpeechSynthesisVoice | null = null
let voicesReady = false

function loadVoices(): void {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    const voices = window.speechSynthesis.getVoices()
    if (voices.length === 0) return
    voicesReady = true
    for (const name of PREFERRED_VOICES) {
        const match = voices.find((v) => v.name === name)
        if (match) { cachedVoice = match; return }
    }
    cachedVoice = voices.find((v) => v.lang.startsWith("en")) || voices[0]
}

// Auto-init
if (typeof window !== "undefined" && window.speechSynthesis) {
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
}

function clean(text: string): string {
    return text
        .replace(/```[\s\S]*?```/g, " code block ")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/[*_~]{1,3}/g, "")
        .replace(/#{1,6}\s/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[^\w\s.,!?;:'"()-]/g, "")
        .replace(/\s+/g, " ")
        .trim()
}

export function speak(text: string): void {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    stop()
    const cleaned = clean(text)
    if (!cleaned) return

    if (!voicesReady) loadVoices()

    const u = new SpeechSynthesisUtterance(cleaned)
    u.rate = 1.0
    u.pitch = 1.0
    u.volume = 1.0
    if (cachedVoice) u.voice = cachedVoice
    window.speechSynthesis.speak(u)
}

export function stop(): void {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
}
