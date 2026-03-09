'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  PlusCircle,
  History,
  Settings,
  LogOut,
  MessageCircle,
  Zap,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/create', label: 'New Generation', icon: PlusCircle },
  { href: '/chat', label: 'Chatbot', icon: MessageCircle },
  { href: '/history', label: 'History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
]

function CreditsDisplay() {
  const [credits, setCredits] = useState<{ remaining: number; limit: number; resetAt: string | null } | null>(null)
  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled || !session?.access_token) return
      fetch('/api/tokens', { headers: { Authorization: `Bearer ${session.access_token}` } })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => { if (!cancelled && data?.limit > 0) setCredits(data) })
    })
    return () => { cancelled = true }
  }, [])
  if (!credits) return null
  return (
    <div className="mb-2 flex items-center gap-2 rounded-lg bg-[#f5f8fd] px-3 py-2">
      <Zap className="h-3.5 w-3.5 shrink-0 text-[#0f2d52]" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-[#10243a]">{credits.remaining} / {credits.limit} credits</p>
        <p className="text-[10px] text-[#5f7188]">Generation: 20 · Chat: 3 (sidebar) / 4 (page)</p>
        {credits.resetAt && (
          <p className="text-[10px] text-[#5f7188]">Resets {new Date(credits.resetAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        )}
      </div>
    </div>
  )
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'global' })
    router.replace('/')
    router.refresh()
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col border-r border-[#e8ecf2] bg-white">
      <Link href="/dashboard" className="flex items-center gap-2.5 border-b border-[#e8ecf2] px-6 py-5">
        <img src="/clavio-mark.svg" alt="" className="h-6 w-6 object-contain" aria-hidden />
        <span className="text-[17px] font-semibold tracking-tight text-[#16263c]">Clavio</span>
      </Link>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#0f2d52] text-white'
                  : 'text-[#5e6c80] hover:bg-[#f5f8fd] hover:text-[#102033]'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-[#e8ecf2] px-3 py-4">
        <CreditsDisplay />
        <button
          type="button"
          onClick={handleLogout}
          className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#5e6c80] transition-colors hover:bg-[#f5f8fd] hover:text-[#102033]"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  )
}
