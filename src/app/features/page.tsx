'use client'

import { useState } from 'react'
import { Footer } from '@/components/layout/Footer'
import { useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'

const featureGroups = [
  {
    title: 'Content Creation',
    description:
      'Turn rough notes and ideas into publish-ready posts.',
    items: [
      'Post drafting support',
      'Tone matching',
      'Repurposing into multiple formats'
    ]
  },
  {
    title: 'Planning & Workflow',
    description:
      'Keep your publishing process organized with a fast workflow built for consistency.',
    items: [
      'Save and tag content ideas',
      'Weekly content planning',
      'Simple review and editing flow'
    ]
  },
  {
    title: 'Publishing Support',
    description:
      'Go from idea to published content faster with built-in support features.',
    items: [
      'Formatting for readable posts',
      'Carousel-ready structure',
      'Reusable templates and prompts'
    ]
  }
]

export default function FeaturesPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  const handleGetStarted = () => {
    router.push('/signup')
  }

  const handleLogin = () => {
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-white text-[#0f1c2e]">
      <div className="mx-auto max-w-[1160px] px-4 pb-20 pt-5 sm:px-6 lg:px-8">
        <header className="rounded-xl border border-[#e8ecf2] bg-white px-4 py-3 shadow-[0_2px_10px_rgba(15,28,46,0.03)]">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-2.5">
              <img src="/clavio-mark.svg" alt="Clavio logo" className="h-6 w-6 object-contain" />
              <span className="text-[17px] font-semibold tracking-tight text-[#16263c]">Clavio</span>
            </a>

            <nav className="hidden items-center gap-7 text-[12px] font-medium text-[#5e6c80] md:flex">
              <a className="text-[#102033]" href="/features">Features</a>
              <a className="transition-colors hover:text-[#102033]" href="/pricing">Pricing</a>
            </nav>

            <div className="hidden items-center gap-3 md:flex">
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
                <a className="block rounded-md px-2 py-1.5 hover:bg-[#f5f8fd]" href="/features">Features</a>
                <a className="block rounded-md px-2 py-1.5 hover:bg-[#f5f8fd]" href="/pricing">Pricing</a>
              </div>
            </div>
          )}
        </header>

        <section className="pt-12 text-center md:pt-16">
          <h1 className="mx-auto max-w-[860px] text-[42px] font-semibold leading-[1.05] tracking-[-0.03em] text-[#0f2034] md:text-[58px]">
            Powerful features to turn ideas into consistent growth
          </h1>
          <p className="mx-auto mt-5 max-w-[640px] text-[16px] leading-7 text-[#5a6a80]">
            Everything you need to capture ideas, produce great content, and stay consistent without burning out.
          </p>
        </section>

        <section className="pt-12">
          <div className="grid gap-4 md:grid-cols-3">
            {featureGroups.map((group) => (
              <article key={group.title} className="rounded-[14px] border border-[#e7ecf2] bg-white p-6 shadow-sm">
                <h2 className="text-[23px] font-semibold tracking-[-0.015em] text-[#10243a]">{group.title}</h2>
                <p className="mt-3 text-[14px] leading-6 text-[#5f6f84]">{group.description}</p>
                <ul className="mt-5 space-y-2.5 border-t border-[#edf2f7] pt-5 text-[14px] text-[#4e5f74]">
                  {group.items.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="pt-16">
          <div className="rounded-[18px] bg-[linear-gradient(180deg,#183e66_0%,#14365a_100%)] px-6 py-14 text-center shadow-[0_20px_36px_rgba(15,41,70,0.3)] md:px-14">
            <h3 className="mx-auto max-w-[700px] text-[40px] font-semibold leading-[1.06] tracking-[-0.025em] text-white md:text-[50px]">
              Ready to create with less effort?
            </h3>
            <p className="mx-auto mt-4 max-w-[620px] text-[15px] text-[#9eb5d0]">
              Start free, test the workflow, and scale when you are ready.
            </p>
            <button
              onClick={handleGetStarted}
              className="mt-8 rounded-full bg-[#53aaf9] px-7 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#66b7ff]"
            >
              Start Free
            </button>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}
