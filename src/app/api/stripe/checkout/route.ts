import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripeCheckoutSession, createStripeCustomer } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const origin = (req.headers.get('origin') ?? req.nextUrl.origin).replace(/\/$/, '')
    
    // Get user from session
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let customerId = userData.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await createStripeCustomer(userData.email)
      customerId = customer.id

      // Update user with Stripe customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const session = await getStripeCheckoutSession({
      customerId,
      successUrl: `${origin}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/pricing?checkout=canceled`,
    })

    return NextResponse.json({ sessionId: session.id })

  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const origin = (req.headers.get('origin') ?? req.nextUrl.origin).replace(/\/$/, '')
    
    // For direct signup redirect, create a simple checkout session
    const session = await getStripeCheckoutSession({
      customerId: 'cus_placeholder', // Will be created after user signup
      successUrl: `${origin}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/pricing?checkout=canceled`,
    })

    return NextResponse.redirect(session.url!, 303)

  } catch (error) {
    console.error('Checkout redirect error:', error)
    const fallbackOrigin = (req.headers.get('origin') ?? req.nextUrl.origin).replace(/\/$/, '')
    return NextResponse.redirect(`${fallbackOrigin}/pricing?checkout=error`)
  }
}
