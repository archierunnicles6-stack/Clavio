import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export interface Idea {
  rank: number
  hook: string
  angle: string
  why_it_works: string
  score: number
}

export const transcribeAudio = async (audioBuffer: ArrayBuffer): Promise<string> => {
  const transcription = await openai.audio.transcriptions.create({
    file: new File([audioBuffer], 'audio.wav', { type: 'audio/wav' }),
    model: 'whisper-1',
  })

  return transcription.text
}

export const generateIdeas = async (transcript: string, audience: string, goal: string, tone: string): Promise<Idea[]> => {
  const prompt = `
Generate 15 LinkedIn post ideas from this transcript. Optimized from 3,000+ high-engagement post analysis.

Transcript: "${transcript}"
Audience: ${audience} | Goal: ${goal} | Tone: ${tone}

Per idea:
1. HOOK (≤210 chars): Bold claim, contrarian take, stat, or tension question. 60-70% never click See more—hook must stop scroll.
2. ANGLE: Specific. Numbers, scenarios. Not generic "5 tips."
3. WHY_IT_WORKS: Engagement psychology. Authenticity.
4. SCORE: 1-100.

BAN: leverage, unlock, ecosystem, journey. Curiosity gaps. Actionable over inspirational. Mix stories + tactical.

Return JSON: [{"rank": 1, "hook": "...", "angle": "...", "why_it_works": "...", "score": number}, ...]
`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are an expert LinkedIn content strategist who creates highly engaging post ideas.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
  })

  const response = completion.choices[0].message.content
  if (!response) throw new Error('No response from OpenAI')

  try {
    const ideas = JSON.parse(response)
    return ideas.sort((a: Idea, b: Idea) => b.score - a.score).map((idea: Idea, index: number) => ({
      ...idea,
      rank: index + 1
    }))
  } catch (error) {
    throw new Error('Failed to parse OpenAI response')
  }
}
