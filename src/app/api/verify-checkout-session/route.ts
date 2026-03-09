import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase'
import { CREDITS_MONTHLY, CREDITS_YEARLY } from '@/lib/tokens'

/**
 * Verifies a Stripe checkout session and updates the user's subscription status.
 * Called when the user lands on /dashboard?checkout=success&session_id=xxx to
 * avoid relying on webhook timing (webhooks can be delayed).
 */
export async function POST(req: NextRequest) {
  try {
    const { session_id: sessionId } = await req.json()

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      )
    }

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

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'subscription.items.data.price'],
    })

    // Allow trial (payment_status can be 'unpaid') or paid
    const isPaidOrTrial = checkoutSession.payment_status === 'paid' ||
      checkoutSession.payment_status === 'unpaid' ||
      checkoutSession.payment_status === 'no_payment_required'
    if (!isPaidOrTrial) {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      )
    }

    const customerId = checkoutSession.customer
    if (!customerId || typeof customerId !== 'string') {
      return NextResponse.json(
        { error: 'No customer on session' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id, stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    if (!userRecord) {
      return NextResponse.json(
        { error: 'User record not found' },
        { status: 404 }
      )
    }

    const sessionBelongsToUser = userRecord.stripe_customer_id === customerId ||
      (checkoutSession.customer_email && user.email && checkoutSession.customer_email.toLowerCase() === user.email.toLowerCase())

    if (!sessionBelongsToUser) {
      return NextResponse.json(
        { error: 'Session does not belong to this user' },
        { status: 403 }
      )
    }

    if (!userRecord.stripe_customer_id) {
      await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    let subscriptionStatus: 'active' | 'trialing' = 'active'
    const subscription = checkoutSession.subscription
    if (subscription && typeof subscription === 'object' && 'status' in subscription) {
      subscriptionStatus = subscription.status === 'trialing' ? 'trialing' : 'active'
    }

    const priceId = subscription && typeof subscription === 'object' && 'items' in subscription && subscription.items?.data?.[0]?.price
      ? (typeof subscription.items.data[0].price === 'object'
          ? subscription.items.data[0].price.id
          : subscription.items.data[0].price) ?? ''
      : ''
    const isYearly = priceId === process.env.STRIPE_PRICE_ID_YEARLY
    const creditsLimit = isYearly ? CREDITS_YEARLY : CREDITS_MONTHLY
    const resetAt = new Date()
    if (isYearly) resetAt.setFullYear(resetAt.getFullYear() + 1)
    else resetAt.setMonth(resetAt.getMonth() + 1)

    await supabaseAdmin
      .from('users')
      .update({
        subscription_status: subscriptionStatus,
        tokens_remaining: creditsLimit,
        tokens_limit: creditsLimit,
        tokens_reset_at: resetAt.toISOString(),
      })
      .eq('id', user.id)

    return NextResponse.json({ success: true, subscriptionStatus })
  } catch (error) {
    console.error('Verify checkout session error:', error)
    return NextResponse.json(
      { error: 'Failed to verify checkout session' },
      { status: 500 }
    )
  }
}
