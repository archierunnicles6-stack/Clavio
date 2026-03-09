import Link from 'next/link'
import { Footer } from '@/components/layout/Footer'

export const metadata = {
  title: 'Fulfillment Policy | Clavio',
  description: 'Fulfillment Policy for Clavio - delivery, refunds, and subscription terms.',
}

export default function FulfillmentPage() {
  return (
    <div className="min-h-screen bg-white text-[#0f1c2e]">
      <header className="border-b border-[#e7ecf2] bg-white px-4 py-4">
        <div className="mx-auto flex max-w-[720px] items-center justify-between sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/clavio-mark.svg" alt="" className="h-6 w-6 object-contain" aria-hidden />
            <span className="text-[17px] font-semibold tracking-tight text-[#16263c]">Clavio</span>
          </Link>
          <Link
            href="/"
            className="text-[14px] text-[#5e6c80] transition-colors hover:text-[#102033]"
          >
            ← Back to home
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-[720px] px-4 py-12 sm:px-6 lg:px-8">

        <h1 className="text-[36px] font-semibold tracking-tight text-[#0f2034] md:text-[42px]">
          Fulfillment Policy
        </h1>
        <p className="mt-2 text-[14px] text-[#6b7c91]">
          Last updated: March 8, 2026
        </p>

        <div className="mt-10 space-y-8 text-[15px] leading-7 text-[#3d4f66]">
          <section>
            <h2 className="text-[20px] font-semibold text-[#102033]">1. Overview</h2>
            <p>
              This Fulfillment Policy describes how Clavio delivers its services, handles subscription billing,
              and processes refund requests. By subscribing to Clavio, you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#102033]">2. Delivery of Service</h2>
            <p>
              Clavio is a software-as-a-service (SaaS) platform. Upon successful payment, you gain immediate
              access to your subscription tier and its associated features through your account. There are no
              physical products; access is provided digitally via our web application. You may need to complete
              authentication (e.g., sign in with Google) to access your account.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#102033]">3. Subscription Billing</h2>
            <p>
              Subscriptions are billed in advance on a monthly or yearly basis, depending on the plan you select.
              Your payment method will be charged automatically at the start of each billing cycle until you cancel.
              You will receive a receipt or invoice by email. Pricing is in effect at the time of your purchase;
              we will provide notice before any price changes apply to your plan.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#102033]">4. Cancellation</h2>
            <p>
              You may cancel your subscription at any time through your account settings or by contacting us.
              Cancellation takes effect at the end of your current billing period. You will retain access to
              paid features until the period ends. We do not provide prorated refunds for partial billing periods.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#102033]">5. Refund Policy</h2>
            <p>
              We offer refunds on a case-by-case basis. If you are dissatisfied with the Service within the first
              7 days of your initial subscription, you may request a full refund by contacting us at{' '}
              <a href="mailto:contact@clavio.io" className="text-[#0f2d52] underline hover:no-underline">
                contact@clavio.io
              </a>
              . Refund requests for subscriptions beyond the first 7 days may be considered for extenuating
              circumstances but are not guaranteed. Refunds, when granted, will be processed within 5–10 business
              days to your original payment method.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#102033]">6. Technical Issues</h2>
            <p>
              If you experience technical problems preventing access or use of the Service, please contact our
              support team. We will work to resolve issues promptly. Extended outages or significant service
              disruptions may result in service credits or other remedies at our discretion.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#102033]">7. No Free Trial</h2>
            <p>
              Subscriptions do not include a free trial. Billing begins immediately upon subscription according to
              your selected plan (monthly or yearly).
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#102033]">8. Contact</h2>
            <p>
              For fulfillment-related questions, refund requests, or billing issues, contact us at{' '}
              <a href="mailto:contact@clavio.io" className="text-[#0f2d52] underline hover:no-underline">
                contact@clavio.io
              </a>
              . We aim to respond within 2 business days.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-[#e7ecf2]">
          <Link
            href="/"
            className="text-[14px] font-medium text-[#0f2d52] transition-colors hover:text-[#123966]"
          >
            ← Return to Clavio
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  )
}
