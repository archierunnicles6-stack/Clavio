import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  let session = null
  if (token) {
    const { data } = await supabase.auth.getUser(token)
    session = { user: data.user }
  } else {
    const { data } = await supabase.auth.getSession()
    session = data.session
  }

  // Protected routes
  if (req.nextUrl.pathname.startsWith('/dashboard') || 
      req.nextUrl.pathname.startsWith('/create') ||
      req.nextUrl.pathname.startsWith('/results')) {
    
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Check subscription status
    const { data: user } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('id', session.user.id)
      .single()

    if (!user || (user.subscription_status !== 'active' && user.subscription_status !== 'trialing')) {
      return NextResponse.redirect(new URL('/pricing', req.url))
    }
  }

  // API routes
  if (req.nextUrl.pathname.startsWith('/api/generate')) {
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('id', session.user.id)
      .single()

    if (!user || (user.subscription_status !== 'active' && user.subscription_status !== 'trialing')) {
      return NextResponse.json({ error: 'Subscription required' }, { status: 403 })
    }
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/create/:path*', '/results/:path*', '/api/generate/:path*']
}
