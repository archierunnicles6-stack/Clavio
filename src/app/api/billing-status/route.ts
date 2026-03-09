import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { getSupabaseAdmin } = await import('@/lib/supabase')
    const admin = getSupabaseAdmin()
    const { data: userRecord } = await admin
      .from('users')
      .select('stripe_customer_id, subscription_status')
      .eq('id', user.id)
      .single()

    if (!userRecord?.stripe_customer_id) {
      return NextResponse.json({
        status: userRecord?.subscription_status ?? 'incomplete',
        plan: null,
        nextBillingDate: null,
      })
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: userRecord.stripe_customer_id,
      status: 'all',
      limit: 1,
    })

    const sub = subscriptions.data[0]
    const status = sub?.status === 'active' || sub?.status === 'trialing' ? 'active' : sub?.status === 'canceled' ? 'canceled' : 'incomplete'
    let plan: string | null = 'Pro Unlimited'
    let nextBillingDate: string | null = null

    const periodEnd = sub?.items?.data?.[0]?.current_period_end
    if (periodEnd) {
      nextBillingDate = new Date(periodEnd * 1000).toLocaleDateString('en-US')
    }
    if (sub?.items?.data?.[0]?.price?.nickname) {
      plan = sub.items.data[0].price.nickname
    }

    return NextResponse.json({
      status,
      plan,
      nextBillingDate,
    })
  } catch (error) {
    console.error('Billing status error:', error)
    return NextResponse.json({ error: 'Failed to fetch billing status' }, { status: 500 })
  }
}
