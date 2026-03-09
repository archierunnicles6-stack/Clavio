import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase'

async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim()
  const { data: { user } } = token
    ? await supabaseAuth.auth.getUser(token)
    : { data: { user: (await supabaseAuth.auth.getSession()).data.session?.user } }
  return user
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { generationId, rank, content } = await req.json()

    if (!generationId || rank == null || !content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Missing required fields: generationId, rank, content' },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()

    const { data: generation, error: genError } = await admin
      .from('generations')
      .select('posts, user_id')
      .eq('id', generationId)
      .eq('user_id', user.id)
      .single()

    if (genError || !generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
    }

    const trimmedContent = content.trim()
    if (!trimmedContent) {
      return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 })
    }

    // Update posts table if rows exist
    await admin
      .from('posts')
      .update({ content: trimmedContent })
      .eq('generation_id', generationId)
      .eq('rank', rank)

    // Update generations.posts to keep in sync
    const posts = (generation.posts ?? []) as Array<{ rank: number; score: number; post?: string; content?: string }>
    const updatedPosts = posts.map((p) =>
      p.rank === rank
        ? { ...p, post: trimmedContent, content: trimmedContent }
        : p
    )

    const { error: updateError } = await admin
      .from('generations')
      .update({ posts: updatedPosts })
      .eq('id', generationId)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      post: { rank, content: trimmedContent },
    })
  } catch (error) {
    console.error('Post update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
