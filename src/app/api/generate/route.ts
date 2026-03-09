import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getCreditBalance, deductCredits, CREDITS_GENERATION } from '@/lib/tokens'

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

const SYSTEM_PROMPT = `You write LinkedIn posts that sound like a real person—someone smart, a bit flawed, and genuinely interesting. Every post must pass the "would a human actually write this?" test. No corporate polish. No AI vibes.

## VOICE (what makes it human)
- Contractions everywhere: I've, don't, isn't, won't, that's. Never "do not" when "don't" fits.
- Start sentences with And or But when it feels right. Real people do this.
- Casual asides in parentheses. (No joke.) (Took me way too long to learn this.)
- Second-guessing: "Maybe I'm wrong but..." "Could be crazy here..."
- Self-deprecation: "I messed this up for years." "Probably obvious to everyone else."
- Rhetorical questions that sound genuine: "Ever notice how...?" "Why does nobody talk about this?"
- Micro-stories with concrete details: real numbers, specific moments, actual dialogue.
- Vary emotional temperature: one post earnest, next wry, next frustrated—never one-note.

## HOOK (first 210 characters—critical)
60-70% never click "See more." The hook IS the post.
- Bold claim. Surprising stat. Contrarian take. Tension question.
- "I analyzed 500 posts. One pattern." "5 years. 3 failed startups. Here's what stuck."
- Never: "In today's..." "Let me share..." "I'm excited to..." Generic inspiration.

## STRUCTURE
1. Hook (1-3 lines, ≤210 chars)
2. Context: why it matters. Credibility = specific ("ran 2 exits", "lost 3 clients before I figured this out") not vague ("experienced leader")
3. Body: short paragraphs, 1-2 sentences max. ~8 line breaks per 100 chars. Dense blocks kill engagement.
4. CTA: "Agree?" "What's worked for you?" "Drop a comment." Never "Feel free to share below."

## EXACT RULES
- Length: 1,300-1,900 chars (sweet spot for engagement)
- Paragraph max: 1-2 sentences. Double line break between sections.
- Hashtags: 2-4 at end. Relevant only. No #motivation #growth #mindset spam.
- Emojis: 0-2 max, only if they fit naturally. Never 🚀💡✨🎯 chains.
- Bold (*text*) sparingly for punch.

## AUTHENTICITY
- SPECIFIC: "14 days → 3.2 days" not "optimized onboarding"
- Varied sentence length: 5 words. Then 18. Then 8. Never uniform.
- Real stakes: "I almost didn't post this." "Biggest mistake I made." "Cost me a deal."
- BAN: leverage, synergize, ecosystem, unlock, dive deep, game-changer, journey, pivot, paradigm shift, thought leadership
- Write like you're texting a smart friend who gets it. Slightly messy. Honest.

## NEVER
- "Firstly... Secondly... Finally"
- Every post same format or structure
- Generic "here are 5 tips" without real specifics
- Corporate speak, inspirational fluff, or motivational poster energy
- Walls of text
- Exclamation overuse!!!
- Anything that sounds like a press release or blog SEO filler

Return ONLY valid JSON: [{"rank": 1, "score": 95, "post": "content..."}, ...]
Score 1-100: engagement, authenticity, hook strength, clarity. Weave keywords naturally.
NO intro text, no "Here are the posts", no markdown—just the raw JSON array.`

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const balance = await getCreditBalance(user.id)
    if (!balance?.canGenerate) {
      return NextResponse.json(
        { error: 'Insufficient credits. Generation uses 20 credits. Upgrade or wait for your monthly reset.' },
        { status: 402 }
      )
    }

    const body = await req.json()
    const keywords = body.keywords as string[]
    const audience = (body.audience as string) || 'General'
    const tone = (body.tone as string) || 'Authority'

    if (!keywords?.length || !Array.isArray(keywords)) {
      return NextResponse.json({ error: 'Missing or invalid keywords' }, { status: 400 })
    }

    const keywordList = keywords.slice(0, 20).join(', ')

    const { ok, remaining } = await deductCredits(user.id, CREDITS_GENERATION)
    if (!ok) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please try again.' },
        { status: 402 }
      )
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Keywords: ${keywordList}\nTarget Audience: ${audience}\nTone: ${tone}\n\nGenerate exactly 16 LinkedIn posts.`,
        },
      ],
      temperature: 0.92,
      max_tokens: 4000,
    })

    const text = completion.choices[0].message.content?.trim() ?? ''
    let parsed: Array<{ rank: number; score: number; post: string }>

    // Extract JSON from response (model sometimes adds intro text or markdown code blocks)
    const extractJson = (raw: string): string | null => {
      const jsonMatch = raw.match(/\[[\s\S]*\]/)
      if (jsonMatch) return jsonMatch[0]
      const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1]
      if (codeBlock) return codeBlock.trim()
      return null
    }

    try {
      const jsonStr = extractJson(text) ?? text
      parsed = JSON.parse(jsonStr || '[]')
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Empty or invalid')
    } catch {
      parsed = [{ rank: 1, score: 85, post: text || 'Failed to generate' }]
    }

    const ranked = parsed
      .slice(0, 16)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .map((p, i) => ({ ...p, rank: i + 1, platform: 'linkedin' as const }))

    const supabaseAdmin = getSupabaseAdmin()
    const { data: generation, error: genError } = await supabaseAdmin
      .from('generations')
      .insert({
        user_id: user.id,
        transcript: keywordList,
        posts: ranked,
        audience,
        goal: 'Content Creation',
        tone,
        status: 'completed',
      })
      .select('id')
      .single()

    if (genError || !generation) {
      console.error('Generation DB error:', genError)
      return NextResponse.json({ error: 'Failed to save generation' }, { status: 500 })
    }

    await supabaseAdmin.from('posts').insert(
      ranked.map((p) => ({
        generation_id: generation.id,
        platform: p.platform,
        content: p.post,
        score: p.score ?? 0,
        rank: p.rank,
      }))
    )

    return NextResponse.json({
      generationId: generation.id,
      posts: ranked,
      creditsRemaining: remaining,
    })
  } catch (error) {
    console.error('Generate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
