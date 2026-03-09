'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type TokenBalance = {
  remaining: number
  limit: number
  resetAt: string | null
  canGenerate: boolean
  canChat: boolean
}

type TokensContextValue = {
  balance: TokenBalance | null
  loading: boolean
  refresh: () => Promise<void>
  setBalanceFromResponse: (remaining: number) => void
}

const TokensContext = createContext<TokensContextValue | null>(null)

async function fetchTokenBalance(sessionToken: string): Promise<TokenBalance | null> {
  const res = await fetch('/api/tokens', {
    headers: { Authorization: `Bearer ${sessionToken}` },
  })
  if (!res.ok) return null
  return res.json()
}

export function TokensProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState<TokenBalance | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setLoading(false)
        return
      }
      const data = await fetchTokenBalance(session.access_token)
      if (data) setBalance(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  const setBalanceFromResponse = useCallback((remaining: number) => {
    setBalance((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        remaining,
        canGenerate: remaining >= 20,
        canChat: remaining >= 3,
      }
    })
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refresh()
    })
    return () => subscription.unsubscribe()
  }, [refresh])

  useEffect(() => {
    const state = { channel: null as ReturnType<typeof supabase.channel> | null, cancelled: false }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (state.cancelled || !user?.id) return
      state.channel = supabase
        .channel(`tokens:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${user.id}`,
          },
          (payload: { new?: { tokens_remaining?: number; tokens_limit?: number; tokens_reset_at?: string } }) => {
            const row = payload.new
            if (!row || typeof row.tokens_remaining !== 'number') return
            setBalance((prev) => {
              const remaining = Math.max(0, row.tokens_remaining ?? 0)
              const limit = row.tokens_limit ?? prev?.limit ?? 2040
              return {
                remaining,
                limit,
                resetAt: row.tokens_reset_at ?? prev?.resetAt ?? null,
                canGenerate: remaining >= 20,
                canChat: remaining >= 3,
              }
            })
          }
        )
        .subscribe()
    })
    return () => {
      state.cancelled = true
      if (state.channel) supabase.removeChannel(state.channel)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(refresh, 8000)
    return () => clearInterval(interval)
  }, [refresh])

  return (
    <TokensContext.Provider value={{ balance, loading, refresh, setBalanceFromResponse }}>
      {children}
    </TokensContext.Provider>
  )
}

export function useTokens() {
  const ctx = useContext(TokensContext)
  return ctx ?? {
    balance: null,
    loading: true,
    refresh: async () => {},
    setBalanceFromResponse: () => {},
  }
}
