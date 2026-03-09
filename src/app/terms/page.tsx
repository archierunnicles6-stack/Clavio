import Link from 'next/link'
import { Footer } from '@/components/layout/Footer'

export const metadata = {
  title: 'Terms of Service | Clavio',
  description: 'Terms of Service for Clavio - AI-powered content tools for creators.',
}

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="mt-2 text-[14px] text-[#6b7c91]">
          Last updated: March 8, 2026
        </p>

        <div className="mt-10 space-y-8 text-[15px] leading-7 text-[#3d4f66]">
          <section>
            <h2 className="text-[20px] font-semibold text-[#102033]">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Clavio (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the Service. We reserve the right to modify these
              terms at any time; continued use of the Service after changes constitutes acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#102033]">2. Description of Service</h2>
            <p>
              Clavio provides AI-powered tools to help creators make better content, faster. This includes content
              generation, planning, publishing support, and related features. We may add, change, or remove features
              at our discretion.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#102033]">3. Account and Eligibility</h2>
            <p>
              You must be at least 18 years old and have the legal authority to enter into these terms. You are
              responsible for maintaining the confidentiality of your account credentials and for all activity that
              occurs under your account. You must provide accurate and complete information when registering.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#102033]">4. Acceptable Use</h2>
            <p>
              You agree not to use the Service to: (a) violate any applicable laws or regulations; (b) infringe on
              the intellectual property or privacy rights of others; (c) distribute harmful, obscene, or unlawful
              content; (d) attempt to gain unauthorized access to the Service or related systems; (e) use the Service
              for any purpose that could harm, disable, or overburden the Service. We reserve the right to suspend
              or terminate accounts that violate these guidelines.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#102033]">5. Intellectual Property</h2>
            <p>
              Clavio and its content, features, and functionality are owned by us and are protected by copyright,
              trademark, and other intellectual property laws. You retain ownership of content you create using the
              Service, subject to a limited license granting us the right to process and display such content to
              provide the Service. You may not copy, modify, or create derivative works of the Service without our
              written permission.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#102033]">6. Payment and Subscription</h2>
            <p>
              Paid plans are billed according to the pricing displayed at the time of purchase. You authorize us to
              charge your payment method for recurring billing until you cancel. Refunds are handled according to our
              Fulfillment Policy. We may change pricing with reasonable notice.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#102033]">7. Disclaimer of Warranties</h2>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as available.&quot; We do not warrant that the Service
              will be uninterrupted, error-free, or free of harmful components. AI-generated content may contain
              inaccuracies; you are responsible for reviewing and verifying any content before use.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#102033]">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Clavio and its affiliates shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, or for any loss of profits, data, or goodwill.
              Our total liability shall not exceed the amount you paid us in the twelve months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#102033]">9. Termination</h2>
            <p>
              You may cancel your account at any time. We may suspend or terminate your access for violation of these
              terms or for any other reason at our discretion. Upon termination, your right to use the Service ceases
              immediately.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#102033]">10. Contact</h2>
            <p>
              For questions about these Terms of Service, contact us at{' '}
              <a href="mailto:contact@clavio.io" className="text-[#0f2d52] underline hover:no-underline">
                contact@clavio.io
              </a>
              .
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
