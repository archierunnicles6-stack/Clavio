'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getUserSubscriptionStatus, hasPaidAccess, syncUserProfile } from '@/lib/user-profile'
import { UserAvatarMenu } from '@/components/auth/UserAvatarMenu'
import { Footer } from '@/components/layout/Footer'

const faqItems = [
  'How does the AI interview work?',
  'Will my posts actually sound like me — not generic AI?',
  'How much time do I need to invest?',
  'Can I repurpose content I already have?',
  'What if I want to involve my whole team?',
  'Is Clavio for individuals or teams?',
]

const statCards = [
  { value: '120%', label: 'Higher response rate from targeted outbound.' },
  { value: '82%', label: 'Consistency improvement across outreach workflows.' },
  { value: '1.7x', label: 'Faster follow-up velocity from saved templates.' },
]

export default function ClavioLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [authUser, setAuthUser] = useState<{
    email: string
    name: string
    avatarUrl: string | null
  } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setAuthUser(null)
        return
      }

      await syncUserProfile(user)
      const metadata = user.user_metadata as { full_name?: string; name?: string; avatar_url?: string; picture?: string }
      setAuthUser({
        email: user.email ?? '',
        name: metadata.full_name ?? metadata.name ?? user.email ?? 'User',
        avatarUrl: metadata.avatar_url ?? metadata.picture ?? null,
      })
    }

    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setAuthUser(null)
        return
      }

      await syncUserProfile(session.user)
      const metadata = session.user.user_metadata as { full_name?: string; name?: string; avatar_url?: string; picture?: string }
      setAuthUser({
        email: session.user.email ?? '',
        name: metadata.full_name ?? metadata.name ?? session.user.email ?? 'User',
        avatarUrl: metadata.avatar_url ?? metadata.picture ?? null,
      })
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const startGoogleAuth = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/pricing`,
      },
    })
  }

  const handleGetStarted = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      await startGoogleAuth()
      return
    }

    await syncUserProfile(user)
    const subscriptionStatus = await getUserSubscriptionStatus(user.id)
    router.push(hasPaidAccess(subscriptionStatus) ? '/dashboard' : '/pricing')
  }

  const handleLogin = () => {
    startGoogleAuth()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'global' })
    setAuthUser(null)
    router.replace('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-white text-[#0f1c2e]">
      <div className="mx-auto max-w-[1160px] px-4 pb-20 pt-5 sm:px-6 lg:px-8">
        <header className="rounded-xl border border-[#e8ecf2] bg-white px-4 py-3 shadow-[0_2px_10px_rgba(15,28,46,0.03)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src="/clavio-mark.svg"
                alt=""
                aria-hidden="true"
                className="h-6 w-6 object-contain"
              />
              <span className="text-[17px] font-semibold tracking-tight text-[#16263c]">Clavio</span>
            </div>

            <nav className="hidden items-center gap-7 text-[12px] font-medium text-[#5e6c80] md:flex">
              <a className="transition-colors hover:text-[#102033]" href="#features">Features</a>
              <a className="transition-colors hover:text-[#102033]" href="/pricing">Pricing</a>
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
                    onClick={handleGetStarted}
                    className="rounded-[10px] bg-[#0f2d52] px-4 py-2 text-[12px] font-semibold text-white shadow-[0_6px_14px_rgba(15,45,82,0.22)] transition hover:bg-[#123966]"
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
                <a className="block rounded-md px-2 py-1.5 hover:bg-[#f5f8fd]" href="#features">Features</a>
                <a className="block rounded-md px-2 py-1.5 hover:bg-[#f5f8fd]" href="/pricing">Pricing</a>
              </div>
              <div className="mt-3 flex gap-2">
                {authUser ? (
                  <button
                    onClick={handleLogout}
                    className="flex-1 rounded-md border border-[#d9e3f0] px-3 py-2 text-sm font-medium text-[#244266]"
                  >
                    Log out
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleLogin}
                      className="flex-1 rounded-md border border-[#d9e3f0] px-3 py-2 text-sm font-medium text-[#244266]"
                    >
                      Log in
                    </button>
                    <button
                      onClick={handleGetStarted}
                      className="flex-1 rounded-md bg-[#0f2d52] px-3 py-2 text-sm font-semibold text-white"
                    >
                      Start free
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </header>

        <section id="features" className="pt-10 md:pt-14">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <div className="max-w-[520px]">
              <h1 className="text-[42px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#0e1f33] md:text-[56px]">
                10x your LinkedIn Inbound.
                <br />
                One platform, zero chaos
              </h1>
              <p className="mt-5 max-w-[500px] text-[15px] leading-7 text-[#56657a]">
                For creators, ghostwriters, and teams who want to write high-performing posts,
                engage daily, and grow without switching tools or risking their account.
              </p>
              <button
                onClick={handleGetStarted}
                className="mt-7 rounded-[11px] bg-[#0f2d52] px-6 py-3 text-[14px] font-semibold text-white shadow-[0_10px_16px_rgba(15,45,82,0.2)] transition hover:bg-[#133d6a]"
              >
                Get started free
              </button>
            </div>

            <div className="relative overflow-hidden rounded-[16px] bg-[linear-gradient(155deg,#0f79e8_0%,#34a7ff_65%,#56bcff_100%)] shadow-[0_18px_40px_rgba(27,102,188,0.35)]">
              <img
                src="/upload-samples/Landing%20page%20image.avif"
                alt="Clavio dashboard"
                className="block h-full w-full object-cover"
              />
            </div>
          </div>
        </section>
      </div>

      <section id="testimonials" className="bg-[#0c2744] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1160px]">
          <h2 className="text-center text-[35px] font-semibold tracking-[-0.02em] text-white md:text-[44px]">
            Why personal brands outperform company pages
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {statCards.map((item) => (
              <div
                key={item.value}
                className="rounded-[12px] border border-[#1e3e62] bg-[#132f4d] px-6 py-7 text-center"
              >
                <p className="text-[44px] font-semibold leading-none text-white">{item.value}</p>
                <p className="mt-3 text-[12px] text-[#9eb2cc]">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-[12px] text-[#89a2c2]">
            Based on client campaign benchmarks across SaaS and services.
          </p>
        </div>
      </section>

      <section id="use-cases" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1160px] items-center gap-10 lg:grid-cols-2">
          <div className="max-w-[520px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#96a7bc]">Content Creation</p>
            <h3 className="mt-3 text-[41px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#10243a] md:text-[48px]">
              Add your keywords.
              <br />
              Get 16 publish-ready posts.
            </h3>
            <ul className="mt-7 space-y-3 text-[15px] leading-7 text-[#55667c]">
              <li>Enter themes and keywords — AI generates multiple posts for you.</li>
              <li>Automatic idea sequencing so every post adds momentum.</li>
              <li>Choose audience and tone to match your brand.</li>
            </ul>
          </div>

          <div className="relative overflow-hidden rounded-[16px] bg-[linear-gradient(155deg,#1784f0_0%,#54b7ff_85%)] shadow-[0_18px_34px_rgba(30,118,215,0.32)]">
            <img
              src="/upload-samples/anding%20page%20image%202.avif"
              alt="Content workflow"
              className="block h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section id="faqs" className="px-4 pb-16 pt-3 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1160px] gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h3 className="text-[44px] font-semibold leading-[1.02] tracking-[-0.03em] text-[#10243a] md:text-[52px]">
              Questions we
              <br />
              get asked
            </h3>
            <p className="mt-4 max-w-[360px] text-[14px] leading-6 text-[#6b7c91]">
              Common answers about onboarding, workflow, content quality, and getting your team live quickly.
            </p>
          </div>

          <div className="space-y-1.5">
            {faqItems.map((question, index) => {
              const isOpen = openFaq === index
              return (
                <div key={question} className="border-b border-[#e7ecf2] py-3">
                  <button
                    className="flex w-full items-center justify-between gap-4 text-left"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                  >
                    <span className="text-[15px] font-medium text-[#24364d]">{question}</span>
                    <Plus
                      className={`h-4 w-4 text-[#8fa1b6] transition-transform ${isOpen ? 'rotate-45' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <p className="pt-3 text-[14px] leading-6 text-[#5d6f85]">
                      Common answers about onboarding, workflow, and getting your team live quickly.
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1160px]">
          <div className="rounded-[18px] bg-[linear-gradient(180deg,#183e66_0%,#14365a_100%)] px-6 py-16 text-center shadow-[0_20px_36px_rgba(15,41,70,0.3)] md:px-14">
            <h3 className="mx-auto max-w-[700px] text-[40px] font-semibold leading-[1.06] tracking-[-0.025em] text-white md:text-[50px]">
              Turn your expertise into measurable influence.
            </h3>
            <p className="mx-auto mt-4 max-w-[620px] text-[15px] text-[#9eb5d0]">
              Start in 5 minutes with guided onboarding and weekly done-for-you publishing support.
            </p>
            <button
              onClick={handleGetStarted}
              className="mt-8 rounded-full bg-[#53aaf9] px-7 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#66b7ff]"
            >
              Start Free
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
