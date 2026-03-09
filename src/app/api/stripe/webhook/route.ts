import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase'
import { CREDITS_MONTHLY, CREDITS_YEARLY } from '@/lib/tokens'

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: any

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id ?? ''

        const { data: user } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (user) {
          const subscriptionStatus = subscription.status === 'active' ? 'active' :
                                     subscription.status === 'trialing' ? 'trialing' : 'canceled'
          const isActive = subscriptionStatus === 'active' || subscriptionStatus === 'trialing'
          const priceId = subscription.items?.data?.[0]?.price?.id ?? ''
          const isYearly = priceId === process.env.STRIPE_PRICE_ID_YEARLY
          const creditsLimit = isYearly ? CREDITS_YEARLY : CREDITS_MONTHLY
          const resetAt = new Date()
          if (isYearly) resetAt.setFullYear(resetAt.getFullYear() + 1)
          else resetAt.setMonth(resetAt.getMonth() + 1)

          await supabaseAdmin
            .from('users')
            .update({
              subscription_status: subscriptionStatus,
              ...(isActive
                ? {
                    tokens_remaining: creditsLimit,
                    tokens_limit: creditsLimit,
                    tokens_reset_at: resetAt.toISOString(),
                  }
                : { tokens_remaining: 0 }),
            })
            .eq('id', user.id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id ?? ''

        const { data: user } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (user) {
          await supabaseAdmin
            .from('users')
            .update({ subscription_status: 'canceled', tokens_remaining: 0 })
            .eq('id', user.id)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id ?? ''

        const { data: user } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (user) {
          const subscriptionStatus = subscription.status === 'active' ? 'active' :
                                     subscription.status === 'trialing' ? 'trialing' : 'canceled'
          const isActive = subscriptionStatus === 'active' || subscriptionStatus === 'trialing'
          const priceId = subscription.items?.data?.[0]?.price?.id ?? ''
          const isYearly = priceId === process.env.STRIPE_PRICE_ID_YEARLY
          const creditsLimit = isYearly ? CREDITS_YEARLY : CREDITS_MONTHLY
          const resetAt = new Date()
          if (isYearly) resetAt.setFullYear(resetAt.getFullYear() + 1)
          else resetAt.setMonth(resetAt.getMonth() + 1)

          await supabaseAdmin
            .from('users')
            .update({
              subscription_status: subscriptionStatus,
              ...(isActive
                ? {
                    tokens_remaining: creditsLimit,
                    tokens_limit: creditsLimit,
                    tokens_reset_at: resetAt.toISOString(),
                  }
                : { tokens_remaining: 0 }),
            })
            .eq('id', user.id)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
