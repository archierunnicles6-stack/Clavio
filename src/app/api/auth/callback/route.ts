import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { hasPaidAccess } from '@/lib/user-profile'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (data.user) {
      if (!data.user.email) {
        return NextResponse.redirect(`${origin}/login`)
      }

      const metadata = data.user.user_metadata as {
        full_name?: string
        name?: string
        avatar_url?: string
        picture?: string
      }

      const supabaseAdmin = getSupabaseAdmin()

      await supabaseAdmin.from('users').upsert(
        {
          id: data.user.id,
          email: data.user.email,
          full_name: metadata.full_name ?? metadata.name ?? null,
          avatar_url: metadata.avatar_url ?? metadata.picture ?? null,
        },
        { onConflict: 'id' }
      )

      const { data: subscriptionRecord } = await supabaseAdmin
        .from('users')
        .select('subscription_status')
        .eq('id', data.user.id)
        .single()

      const destination = hasPaidAccess((subscriptionRecord?.subscription_status ?? null) as 'active' | 'trialing' | 'canceled' | null)
        ? '/dashboard'
        : '/pricing'

      return NextResponse.redirect(`${origin}${destination}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login`)
}
