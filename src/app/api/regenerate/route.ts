import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { generationId, originalPost, rank } = await req.json()

    if (!generationId || !originalPost || !rank) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get user from session
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim()
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user } } = token
      ? await supabaseAuth.auth.getUser(token)
      : { data: { user: (await supabaseAuth.auth.getSession()).data.session?.user } }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get generation details
    const { data: generation, error: genError } = await supabaseAdmin
      .from('generations')
      .select('*')
      .eq('id', generationId)
      .eq('user_id', user.id)
      .single()

    if (genError || !generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
    }

    // Generate a new post using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You regenerate LinkedIn posts so they sound like a real human wrote them—not polished, not corporate, genuinely interesting.

VOICE: Use contractions (I've, don't, isn't). Start sentences with And or But when it flows. Casual asides (like this). Second-guessing ("Maybe I'm wrong but..."). Self-deprecation when it fits. Micro-stories with concrete details. Vary emotional temperature—earnest, wry, frustrated. Write like texting a smart friend.

RULES:
- Hook ≤210 chars. Bold claim, stat, or contrarian take. Never generic.
- 1-2 sentences per paragraph. ~8 line breaks per 100 chars.
- SPECIFIC: "14 days → 3" not "optimized process."
- BAN: leverage, synergize, unlock, ecosystem, game-changer, journey, paradigm shift.
- 2-4 hashtags, 0-2 emojis. Natural CTA: "Agree?" "What's worked for you?"
- Vulnerability and real stakes when they fit.

REGENERATE with a completely DIFFERENT angle—different hook, different structure, different vibe. Same core message. Make it feel like a different person could have written it.

Audience: ${generation.audience} | Goal: ${generation.goal} | Tone: ${generation.tone}

Return ONLY the post. No intro, no markdown, no "Here's a revised version."`
        },
        {
          role: "user",
          content: `Original post: ${originalPost}

Please regenerate this LinkedIn post with a completely different angle while maintaining the same core message.`
        }
      ],
      temperature: 0.9,
      max_tokens: 1000,
    })

    const newPostContent = completion.choices[0].message.content

    if (!newPostContent) {
      return NextResponse.json({ error: 'Failed to regenerate post' }, { status: 500 })
    }

    // Create new post object with same rank but new content
    const newPost = {
      rank: rank,
      score: Math.floor(Math.random() * 20) + 80, // Random score between 80-100
      post: newPostContent.trim()
    }

    // Update the specific post in the generation
    const updatedPosts = generation.posts.map((p: any) =>
      p.rank === rank ? newPost : p
    )

    // Update generation in database
    const { data: updatedGeneration, error: updateError } = await supabaseAdmin
      .from('generations')
      .update({ posts: updatedPosts })
      .eq('id', generationId)
      .select()
      .single()

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json({ error: 'Failed to update generation' }, { status: 500 })
    }

    return NextResponse.json({
      post: newPost,
      generation: updatedGeneration
    })

  } catch (error) {
    console.error('Regenerate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
