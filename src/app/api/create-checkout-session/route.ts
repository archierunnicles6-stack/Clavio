import { NextRequest, NextResponse } from 'next/server'
import { BillingPlan, createStripeCustomer, getStripeCheckoutSession } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { email, userId, plan } = await request.json()
    const selectedPlan: BillingPlan = plan === 'yearly' ? 'yearly' : 'monthly'

    if (!email || !userId) {
      return NextResponse.json(
        { error: 'Email and userId are required' },
        { status: 400 }
      )
    }

    // Get or create Stripe customer
    const { data: userRecord, error: userRecordError } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (userRecordError && userRecordError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Failed to fetch user record' },
        { status: 500 }
      )
    }

    let customerId = userRecord?.stripe_customer_id ?? null

    // Attempt to re-use any existing Stripe customer id stored for same email.
    if (!customerId) {
      const { data: customers, error: customerError } = await supabaseAdmin
        .from('users')
        .select('stripe_customer_id')
        .eq('email', email)
        .not('stripe_customer_id', 'is', null)
        .limit(1)

      if (customerError) {
        return NextResponse.json(
          { error: 'Failed to check existing customer' },
          { status: 500 }
        )
      }

      if (customers && customers.length > 0) {
        customerId = customers[0].stripe_customer_id ?? null
      }
    }

    // Create Stripe customer if still missing, then persist it.
    if (!customerId) {
      const customer = await createStripeCustomer(email)
      customerId = customer.id

      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)

      if (updateError) {
        console.error('Failed to persist Stripe customer id:', updateError)
      }
    }

    // Prefer the incoming request origin to avoid stale env host/port redirects
    // (e.g. local dev on :3001 while NEXT_PUBLIC_APP_URL is still :3000).
    const appUrl = (request.headers.get('origin') ?? request.nextUrl.origin ?? process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')

    // Create checkout session
    const session = await getStripeCheckoutSession({
      customerId: customerId ?? undefined,
      customerEmail: email,
      successUrl: `${appUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/pricing`,
      plan: selectedPlan,
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: unknown) {
    console.error('Error creating checkout session:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
