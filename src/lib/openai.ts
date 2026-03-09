import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function transcribeAudio(audioBuffer: ArrayBuffer): Promise<string> {
  const transcription = await openai.audio.transcriptions.create({
    file: new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' }),
    model: 'whisper-1',
  })

  return transcription.text
}

export async function generateLinkedInPosts(transcript: string, preferences: {
  audience: string
  tone: string
  goal: string
}): Promise<Array<{ rank: number; score: number; post: string }>> {
  const prompt = `
Transform this transcript into 15 LinkedIn posts that sound like a real person wrote them. Human, flawed, interesting—not corporate or AI-polished.

Transcript:
${transcript}

Audience: ${preferences.audience} | Tone: ${preferences.tone} | Goal: ${preferences.goal}

VOICE: Contractions (I've, don't). Start with And/But when it fits. Casual asides. Second-guessing. Self-deprecation. Micro-stories with concrete details. Write like texting a smart friend.

RULES:
- Hook ≤210 chars. Bold claim, stat, contrarian take.
- 1,300-1,900 chars. 1-2 sentences/paragraph. ~8 line breaks/100 chars.
- SPECIFIC: "14 days → 3" not "optimized." BAN: leverage, synergize, unlock, ecosystem, game-changer, journey.
- 2-4 hashtags, 0-2 emojis. Natural CTA. Vulnerability and real stakes when they fit.

Return JSON: [{"rank": 1, "score": 94, "post": "..."}, ...] Rank by engagement + authenticity.
`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You write LinkedIn posts that sound human—contractions, asides, vulnerability, varied sentence length. Hook ≤210 chars. 1-2 sentences/paragraph. SPECIFIC over vague. BAN: leverage, synergize, unlock. Natural CTA.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.92,
  })

  const response = completion.choices[0].message.content
  if (!response) {
    throw new Error('No response from OpenAI')
  }

  try {
    const posts = JSON.parse(response)
    return posts
  } catch (error) {
    throw new Error('Failed to parse OpenAI response')
  }
}
