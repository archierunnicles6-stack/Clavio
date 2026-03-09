import Link from 'next/link'
import { Footer } from '@/components/layout/Footer'

export const metadata = {
  title: 'Privacy Policy | Clavio',
  description: 'Privacy Policy for Clavio - how we collect, use, and protect your data.',
}

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-2 text-[14px] text-[#6b7c91]">
          Last updated: March 8, 2026
        </p>

        <div className="mt-10 space-y-8 text-[15px] leading-7 text-[#3d4f66]">
          <section>
            <h2 className="text-[20px] font-semibold text-[#102033]">1. Introduction</h2>
            <p>
              Clavio (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use our AI-powered
              content creation platform and related services.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#102033]">2. Information We Collect</h2>
            <p className="mb-3">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Account information (name, email address, profile photo)</li>
              <li>Content you create, upload, or input (posts, ideas, keywords, preferences)</li>
              <li>Payment and billing information (processed securely by our payment provider)</li>
              <li>Communications with our support team</li>
            </ul>
            <p className="mt-3">
              We also automatically collect technical data such as IP address, browser type, device information,
              and usage patterns to improve the Service and troubleshoot issues.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#102033]">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Provide, maintain, and improve the Service</li>
              <li>Personalize content and recommendations</li>
              <li>Process transactions and send related communications</li>
              <li>Respond to your inquiries and provide support</li>
              <li>Send service updates, security alerts, and marketing (with your consent)</li>
              <li>Analyze usage to enhance our products</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#102033]">4. AI and Content Processing</h2>
            <p>
              Content you provide may be processed by AI models to generate suggestions, drafts, and other outputs.
              We use industry-standard practices to protect your data during processing. We do not train general-purpose
              AI models on your content for purposes unrelated to providing you the Service. For more details about
              data handling in AI features, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#102033]">5. Information Sharing</h2>
            <p>
              We do not sell your personal information. We may share information with: (a) service providers who
              assist in operating our business (e.g., hosting, payment processing, analytics); (b) legal authorities
              when required by law; (c) affiliates or in connection with a merger, acquisition, or sale of assets.
              We require third parties to protect your information consistent with this policy.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#102033]">6. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information
              against unauthorized access, alteration, disclosure, or destruction. This includes encryption in transit
              and at rest, access controls, and regular security assessments.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#102033]">7. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide the Service.
              We may retain certain information to comply with legal obligations, resolve disputes, and enforce our
              agreements. You may request deletion of your data, subject to applicable retention requirements.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#102033]">8. Your Rights</h2>
            <p>
              Depending on your location, you may have rights to: access your data, correct inaccuracies, delete your
              data, object to or restrict processing, and data portability. You can exercise these rights through your
              account settings or by contacting us. EU residents may lodge a complaint with a supervisory authority.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#102033]">9. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to maintain your session, remember preferences, and analyze
              traffic. You can control cookie preferences through your browser settings. Some features may not work
              properly if cookies are disabled.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#102033]">10. Children</h2>
            <p>
              The Service is not intended for users under 18. We do not knowingly collect personal information from
              children. If you believe we have collected such information, please contact us to have it removed.
            </p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#102033]">11. Contact Us</h2>
            <p>
              For privacy-related questions or to exercise your rights,               contact us at{' '}
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
