'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Menu, Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getUserSubscriptionStatus, hasPaidAccess, syncUserProfile } from '@/lib/user-profile'
import { UserAvatarMenu } from '@/components/auth/UserAvatarMenu'
import { Footer } from '@/components/layout/Footer'

type Plan = {
  name: string
  price: string
  period: string
  description: string
  cta: string
  billingCycle: 'monthly' | 'yearly'
  discount?: string
}

const plans: Plan[] = [
  {
    name: 'Pro Unlimited',
    price: '£17.99',
    period: '/month',
    description: 'Flexible monthly access with full features.',
    cta: 'Get started',
    billingCycle: 'monthly',
  },
  {
    name: 'Pro Unlimited',
    price: '£111.99',
    period: '/year',
    description: 'Best value for consistent creators who want to save yearly.',
    cta: 'Get started',
    billingCycle: 'yearly',
    discount: 'Save 48% vs monthly',
  }
]

const features = [
  'Save and tag content ideas',
  'Content inspiration',
  'AI-powered content creation',
  'Post repurposing and formatting',
  'Mimic your unique content style',
  'AI chat assistant (like ChatGPT)',
  'Carousel maker'
]

const faqItems = [
  {
    question: 'How do saved and tagged content ideas work?',
    answer: 'You can capture ideas quickly, tag them by topic or goal, and find them later when you are ready to write or schedule posts.'
  },
  {
    question: 'What does content inspiration include?',
    answer: 'Clavio suggests prompts, angles, and post ideas so you can keep publishing consistently without running out of things to say.'
  },
  {
    question: 'How does AI-powered content creation help me?',
    answer: 'It helps turn your ideas into polished drafts faster while keeping your message clear and aligned with your goals.'
  },
  {
    question: 'Can Clavio repurpose and format my posts?',
    answer: 'Yes. You can repurpose one idea into multiple post formats and quickly adjust structure, length, and tone for different content needs.'
  },
  {
    question: 'How does Clavio mimic my unique content style?',
    answer: 'Clavio learns from your examples and preferences to support your content workflow.'
  },
  {
    question: 'What is included in the 2 Clavio+ pricing plans?',
    answer: 'Both plans include all Pro Unlimited features. The only difference is billing: £17.99/month or £111.99/year (save 48% with yearly).'
  }
]

export default function PricingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [loadingPlan, setLoadingPlan] = useState<null | 'monthly' | 'yearly'>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authUser, setAuthUser] = useState<{
    email: string
    name: string
    avatarUrl: string | null
  } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const bootstrap = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        setAuthError(userError.message)
        setAuthLoading(false)
        return
      }

      if (!user) {
        setAuthUser(null)
        setAuthLoading(false)
        return
      }

      await syncUserProfile(user)
      const metadata = user.user_metadata as { full_name?: string; name?: string; avatar_url?: string; picture?: string }
      setAuthUser({
        email: user.email ?? '',
        name: metadata.full_name ?? metadata.name ?? user.email ?? 'User',
        avatarUrl: metadata.avatar_url ?? metadata.picture ?? null,
      })

      const subscriptionStatus = await getUserSubscriptionStatus(user.id)
      const subscribed = hasPaidAccess(subscriptionStatus)
      setIsSubscribed(subscribed)

      if (subscribed) {
        router.push('/dashboard')
        return
      }

      setAuthLoading(false)
    }

    bootstrap()
  }, [router])

  const startGoogleAuth = async () => {
    setAuthError(null)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/pricing`,
      },
    })
  }

  const handleGetStarted = async (billingCycle: 'monthly' | 'yearly') => {
    setLoadingPlan(billingCycle)
    setAuthError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoadingPlan(null)
      await startGoogleAuth()
      return
    }

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          userId: user.id,
          plan: billingCycle,
        }),
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({ error: 'Failed to create checkout session' }))
        throw new Error(errorPayload.error ?? 'Failed to create checkout session')
      }

      const data: { sessionId?: string; url?: string } = await response.json()
      if (data.url) {
        window.location.href = data.url
        return
      }

      throw new Error('Checkout URL was not returned')
    } catch (error) {
      console.error('Checkout flow failed:', error)
      const message = error instanceof Error ? error.message : 'Unable to start checkout. Please try again.'
      setAuthError(message)
      setLoadingPlan(null)
    }
  }

  const handleLogin = async () => {
    await startGoogleAuth()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'global' })
    setAuthUser(null)
    router.replace('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#fbfdff] text-[#0f1c2e]">
      <div className="mx-auto max-w-[1120px] px-4 pb-20 pt-5 sm:px-6 lg:px-8">
        <header className="rounded-[14px] border border-[#e7edf5] bg-white px-4 py-3 shadow-[0_2px_10px_rgba(15,28,46,0.03)]">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <img src="/clavio-mark.svg" alt="Clavio logo" className="h-6 w-6 object-contain" />
              <span className="text-[30px] font-semibold tracking-[-0.03em] text-[#1e2e46]">Clavio</span>
            </Link>

            <nav className="hidden items-center gap-8 text-[14px] font-medium text-[#617189] md:flex">
              <Link className="transition-colors hover:text-[#102033]" href="/features">Features</Link>
              <Link className="text-[#102033]" href="/pricing">Pricing</Link>
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              {authUser ? (
                <UserAvatarMenu
                  name={authUser.name}
                  email={authUser.email}
                  avatarUrl={authUser.avatarUrl}
                  onLogout={handleLogout}
                />
              ) : (
                <>
                  <button
                    onClick={handleLogin}
                    className="text-[13px] font-medium text-[#4f617a] transition-colors hover:text-[#102033]"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => handleGetStarted('monthly')}
                    className="rounded-[10px] bg-[#0f2d52] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_6px_14px_rgba(15,45,82,0.22)] transition hover:bg-[#123966]"
                  >
                    Get started free
                  </button>
                </>
              )}
            </div>

            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="mt-3 border-t border-[#edf1f6] pt-3 md:hidden">
              <div className="space-y-1 text-sm text-[#4f617a]">
                <Link className="block rounded-md px-2 py-1.5 hover:bg-[#f5f8fd]" href="/features">Features</Link>
                <Link className="block rounded-md px-2 py-1.5 hover:bg-[#f5f8fd]" href="/pricing">Pricing</Link>
              </div>
            </div>
          )}
        </header>

        <section className="pt-14 text-center md:pt-16">
          <h1 className="mx-auto max-w-[660px] text-[56px] font-semibold leading-[1.04] tracking-[-0.03em] text-[#0f2034] md:text-[68px]">
            <span className="text-[#1993f3]">Simple pricing</span>
            <br />
            for everyone
          </h1>
        </section>

        <section className="pt-12">
          <div className="mx-auto grid max-w-[930px] gap-6 md:grid-cols-2">
            {plans.map((plan) => (
              <article key={`${plan.name}-${plan.price}`} className="rounded-[14px] border border-[#e7ecf2] bg-white px-7 pb-6 pt-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[36px] font-medium leading-none text-[#1f2f44]">{plan.name}</p>
                  {plan.discount && (
                    <span className="shrink-0 rounded-full bg-[#e8f5e9] px-2.5 py-1 text-xs font-semibold text-[#2e7d32]">
                      {plan.discount}
                    </span>
                  )}
                </div>
                <p className="mt-2 max-w-[220px] text-[15px] leading-5 text-[#607086]">{plan.description}</p>
                <div className="mt-4 flex items-end gap-1.5">
                  <span className="text-[44px] font-semibold leading-none text-[#0d2138]">{plan.price}</span>
                  <span className="pb-1 text-[18px] text-[#73859a]">{plan.period}</span>
                </div>
                <button
                  onClick={() => handleGetStarted(plan.billingCycle)}
                  disabled={loadingPlan !== null || authLoading}
                  className="mt-5 w-full rounded-[10px] border border-[#dbe4ee] bg-white px-4 py-3 text-[18px] font-medium text-[#13273f] shadow-[0_2px_4px_rgba(16,36,58,0.08)] transition hover:bg-[#f7fafd]"
                >
                  {loadingPlan === plan.billingCycle ? 'Continuing...' : plan.cta}
                </button>
                <ul className="mt-6 space-y-2.5 border-t border-[#edf2f7] pt-5">
                  {features.map((item) => (
                    <li key={`${plan.name}-${item}`} className="flex items-start gap-2.5 text-[14px] text-[#4e5f74]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#63a5dd]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="faqs" className="mx-auto max-w-[980px] pt-20">
          <div className="text-center">
            <h2 className="text-[54px] font-semibold leading-[1.03] tracking-[-0.03em] text-[#10243a]">
              Have Questions?
            </h2>
            <p className="mt-2 text-[18px] text-[#5a6a80]">
              If you can&apos;t find what you&apos;re looking for, feel free to reach out!
            </p>
          </div>

          <div className="mt-9 space-y-3">
            {faqItems.map((item, index) => {
              const isOpen = openFaq === index
              return (
                <div key={item.question} className="rounded-[12px] border border-[#e7ecf2] bg-white shadow-[0_1px_2px_rgba(15,28,46,0.04)]">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-[29px] font-medium leading-tight text-[#12263e]">{item.question}</span>
                    <Plus className={`h-5 w-5 shrink-0 text-[#9f7aea] transition-transform ${isOpen ? 'rotate-45' : ''}`} />
                  </button>
                  {isOpen && (
                    <p className="border-t border-[#edf2f7] px-5 py-4 text-[15px] leading-7 text-[#5d6f85]">
                      {item.answer}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <section className="pb-4 pt-16">
          <div
            className="overflow-hidden rounded-[14px] px-6 py-12 text-center shadow-[0_20px_36px_rgba(15,41,70,0.28)] md:px-14"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 0%, rgba(85,153,230,0.12), transparent 45%), radial-gradient(circle at 75% 20%, rgba(78,124,196,0.12), transparent 35%), linear-gradient(180deg, #153b62 0%, #133253 100%)'
            }}
          >
            <h3 className="mx-auto max-w-[700px] text-[50px] font-semibold leading-[1.06] tracking-[-0.025em] text-white md:text-[58px]">
              Turn your expertise into measurable influence.
            </h3>
            <p className="mx-auto mt-2 max-w-[620px] text-[13px] text-[#9eb5d0]">
              Start in 5 minutes with guided onboarding support and done-for-you posting systems.
            </p>
            <button
              onClick={() => handleGetStarted('monthly')}
              disabled={loadingPlan !== null || authLoading}
              className="mt-6 rounded-[8px] bg-[#59adfa] px-6 py-2 text-[13px] font-semibold text-white transition hover:bg-[#66b7ff]"
            >
              {loadingPlan !== null ? 'Continuing...' : 'Start Free'}
            </button>
          </div>
        </section>
        {authError && (
          <p className="mt-6 text-center text-sm text-red-600">{authError}</p>
        )}
        {!authLoading && !isSubscribed && (
          <p className="mt-3 text-center text-sm text-[#5a6a80]">
            You&apos;re one step away. Choose a plan to continue to your dashboard.
          </p>
        )}
      </div>

      <Footer />
    </div>
  )
}
