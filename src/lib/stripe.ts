import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

export type BillingPlan = 'monthly' | 'yearly'

export const getStripeCheckoutSession = async ({
  customerId,
  customerEmail,
  successUrl,
  cancelUrl,
  plan = 'monthly',
}: {
  customerId?: string
  customerEmail?: string
  successUrl: string
  cancelUrl: string
  plan?: BillingPlan
}) => {
  const selectedPriceId =
    plan === 'yearly'
      ? process.env.STRIPE_PRICE_ID_YEARLY
      : process.env.STRIPE_PRICE_ID_MONTHLY || process.env.STRIPE_PRICE_ID

  if (!selectedPriceId) {
    throw new Error(`Missing Stripe price ID for ${plan} plan`)
  }

  const session = await stripe.checkout.sessions.create({
    ...(customerId ? { customer: customerId } : {}),
    ...(!customerId && customerEmail ? { customer_email: customerEmail } : {}),
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price: selectedPriceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  return session
}

export const createStripeCustomer = async (email: string) => {
  const customer = await stripe.customers.create({
    email,
  })

  return customer
}
