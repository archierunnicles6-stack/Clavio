import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * Creates a Stripe Customer Billing Portal session for the authenticated user.
 * User is redirected to Stripe to manage subscription, payment methods, invoices, etc.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace(/^Bearer\s+/i, '').trim()
    )

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (userError || !userRecord) {
      return NextResponse.json(
        { error: 'User record not found' },
        { status: 404 }
      )
    }

    const customerId = userRecord.stripe_customer_id
    if (!customerId) {
      return NextResponse.json(
        { error: 'No billing account. Subscribe first to manage billing.' },
        { status: 400 }
      )
    }

    const appUrl = (req.headers.get('origin') ?? req.nextUrl.origin ?? process.env.NEXT_PUBLIC_APP_URL ?? '')
      .replace(/\/$/, '')
    const returnUrl = `${appUrl}/dashboard`

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('Billing portal error:', error)
    return NextResponse.json(
      { error: 'Failed to open billing portal' },
      { status: 500 }
    )
  }
}
