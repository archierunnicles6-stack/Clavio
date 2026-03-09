import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { getCreditBalance, deductCredits, CREDITS_CHAT_SIDEBAR, CREDITS_CHAT_PAGE } from '@/lib/tokens'
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await supabase.auth.getUser(token)
  return user
}

const SYSTEM_PROMPT = `You are a helpful AI assistant for Clavio, a LinkedIn content creation tool. You help users with:

1. **Hashtag suggestions** — Suggest relevant, high-performing hashtags for their topic, keywords, or industry. Mix popular and niche hashtags.
2. **Keyword ideas** — Suggest related or complementary keywords to expand their content topics.
3. **Audience & tone guidance** — Help them pick the right audience (Founders, Coaches, SaaS, Agency Owners) and tone (Authority, Storytelling, Educational, Direct) for their content.
4. **Content strategy** — Quick tips on hooks, structure, engagement, and what works on LinkedIn.
5. **General questions** — Answer questions about creating LinkedIn content, posting frequency, best practices.

Be concise and actionable. Use bullet points or short lists when helpful. If the user provides their current keywords, use those for context when suggesting hashtags or related topics.`

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const messages = body.messages as Array<{ role: string; content: string }>
    const context = body.context as { keywords?: string[]; audience?: string; tone?: string } | undefined
    const source = body.source as 'page' | 'sidebar' | undefined

    if (!messages?.length || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 })
    }

    const creditsNeeded = source === 'page' ? CREDITS_CHAT_PAGE : CREDITS_CHAT_SIDEBAR

    const balance = await getCreditBalance(user.id)
    if (!balance || balance.remaining < creditsNeeded) {
      return NextResponse.json(
        { error: `Insufficient credits. Chat uses ${creditsNeeded} credits. Upgrade or wait for your monthly reset.` },
        { status: 402 }
      )
    }

    const { ok, remaining } = await deductCredits(user.id, creditsNeeded)
    if (!ok) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please try again.' },
        { status: 402 }
      )
    }

    const contextNote = context?.keywords?.length
      ? `[Context: User's keywords: ${context.keywords.join(', ')}${context.audience ? `. Audience: ${context.audience}` : ''}${context.tone ? `. Tone: ${context.tone}` : ''}]`
      : ''

    const enrichedMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT + (contextNote ? `\n\n${contextNote}` : '') },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: enrichedMessages,
      temperature: 0.7,
      max_tokens: 600,
    })

    const reply = completion.choices[0]?.message?.content ?? 'Something went wrong. Please try again.'

    return NextResponse.json({ reply, creditsRemaining: remaining })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 })
  }
}
