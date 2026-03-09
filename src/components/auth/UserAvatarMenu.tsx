'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type UserAvatarMenuProps = {
  name: string
  email: string
  avatarUrl: string | null
  onLogout: () => Promise<void> | void
}

type Credits = { remaining: number; limit: number; resetAt: string | null } | null

export function UserAvatarMenu({ name, email, avatarUrl, onLogout }: UserAvatarMenuProps) {
  const [open, setOpen] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)
  const [credits, setCredits] = useState<Credits>(null)
  const [creditsLoading, setCreditsLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setCreditsLoading(true)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled || !session?.access_token) {
        setCreditsLoading(false)
        return
      }
      fetch('/api/tokens', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!cancelled && data) setCredits(data)
        })
        .finally(() => {
          if (!cancelled) setCreditsLoading(false)
        })
    })
    return () => { cancelled = true }
  }, [open])

  const initials = name
    .split(' ')
    .map((segment) => segment[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open account menu"
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#dce5f0] bg-white"
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt={name} width={40} height={40} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-semibold text-[#28466b]">{initials}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-60 rounded-xl border border-[#e6edf5] bg-white p-3 shadow-lg">
          <p className="text-sm font-semibold text-[#10243a]">{name}</p>
          <p className="mt-0.5 text-xs text-[#5f7188]">{email}</p>

          {creditsLoading ? (
            <div className="mt-3 rounded-lg bg-[#f5f8fd] px-3 py-2 text-xs text-[#5f7188]">
              Loading credits…
            </div>
          ) : credits && credits.limit > 0 ? (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#f5f8fd] px-3 py-2">
              <Zap className="h-3.5 w-3.5 shrink-0 text-[#0f2d52]" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-[#10243a]">
                  {credits.remaining} of {credits.limit} credits
                </p>
                <p className="text-[10px] text-[#5f7188]">Generation: 20 · Chat: 3 (sidebar) / 4 (page)</p>
                {credits.resetAt && (
                  <p className="text-[10px] text-[#5f7188]">
                    Resets {new Date(credits.resetAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          ) : null}

          <button
            onClick={async () => {
              setBillingLoading(true)
              try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session?.access_token) {
                  setOpen(false)
                  return
                }
                const res = await fetch('/api/billing-portal', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                  },
                })
                const data = await res.json()
                if (!res.ok) {
                  alert(data.error ?? 'Failed to open billing portal')
                  return
                }
                if (data.url) {
                  setOpen(false)
                  window.location.href = data.url
                }
              } finally {
                setBillingLoading(false)
              }
            }}
            disabled={billingLoading}
            className="mt-3 w-full rounded-md border border-[#d9e3f0] px-3 py-2 text-sm font-medium text-[#1c3553] transition hover:bg-[#f5f8fd] disabled:opacity-60"
          >
            {billingLoading ? 'Opening...' : 'Manage billing'}
          </button>
          <button
            onClick={() => {
              setOpen(false)
              void onLogout()
            }}
            className="mt-2 w-full rounded-md border border-[#d9e3f0] px-3 py-2 text-sm font-medium text-[#1c3553] transition hover:bg-[#f5f8fd]"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
