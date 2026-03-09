/**
 * Usage credits: DB is source of truth.
 * Generation = 20 credits.
 * Support bot (floating corner) = 3 credits. Chatbot page (/chat) = 4 credits.
 * Allocated on subscribe via Stripe webhook or verify-checkout.
 */

import { getSupabaseAdmin } from '@/lib/supabase'

export const CREDITS_GENERATION = 20
/** Support bot (floating corner widget) = 3 credits */
export const CREDITS_CHAT_SIDEBAR = 3
/** Chatbot page (full /chat) = 4 credits */
export const CREDITS_CHAT_PAGE = 4
/** @deprecated Use CREDITS_CHAT_SIDEBAR or CREDITS_CHAT_PAGE */
export const CREDITS_CHAT = CREDITS_CHAT_SIDEBAR

export const CREDITS_MONTHLY = 2040
export const CREDITS_YEARLY = 12720

export type CreditBalance = {
  remaining: number
  limit: number
  resetAt: string | null
  canGenerate: boolean
  canChat: boolean
}

/** Read credit balance from DB. Resets to full if reset date has passed. */
export async function getCreditBalance(userId: string): Promise<CreditBalance | null> {
  const admin = getSupabaseAdmin()
  const { data: user, error } = await admin
    .from('users')
    .select('tokens_remaining, tokens_limit, tokens_reset_at, subscription_status')
    .eq('id', userId)
    .single()

  if (error || !user) return null

  const isActive = user.subscription_status === 'active' || user.subscription_status === 'trialing'
  let remaining = isActive ? Math.max(0, user.tokens_remaining ?? 0) : 0
  let limit = user.tokens_limit ?? CREDITS_MONTHLY
  let resetAt = user.tokens_reset_at ? new Date(user.tokens_reset_at) : null
  const now = new Date()

  // Monthly reset: if reset date passed, refill credits (keep existing limit)
  if (isActive && resetAt && resetAt <= now) {
    const newResetAt = new Date(now)
    newResetAt.setMonth(newResetAt.getMonth() + 1)
    await admin
      .from('users')
      .update({
        tokens_remaining: limit,
        tokens_reset_at: newResetAt.toISOString(),
      })
      .eq('id', userId)
    remaining = limit
    resetAt = newResetAt
  }

  return {
    remaining,
    limit,
    resetAt: resetAt ? resetAt.toISOString() : user.tokens_reset_at,
    canGenerate: remaining >= CREDITS_GENERATION,
    canChat: remaining >= CREDITS_CHAT_SIDEBAR,
  }
}

/** Deduct credits. Uses DB function if available. */
export async function deductCredits(
  userId: string,
  amount: number
): Promise<{ ok: boolean; remaining: number }> {
  if (amount <= 0) return { ok: false, remaining: 0 }
  const amt = Math.floor(amount)

  const admin = getSupabaseAdmin()
  const { data, error } = await admin.rpc('deduct_user_tokens', {
    p_user_id: userId,
    p_amount: amt,
  })

  if (error) {
    const msg = String(error?.message ?? '')
    if (msg.includes('does not exist') || msg.includes('function')) {
      return deductCreditsFallback(admin, userId, amt)
    }
    console.error('deduct_user_tokens error:', error)
    return { ok: false, remaining: 0 }
  }
  const row = Array.isArray(data) ? data[0] : data
  if (!row) return { ok: false, remaining: 0 }
  return { ok: Boolean(row.ok), remaining: Number(row.remaining ?? 0) }
}

async function deductCreditsFallback(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  amount: number
): Promise<{ ok: boolean; remaining: number }> {
  const { data: user } = await admin
    .from('users')
    .select('tokens_remaining')
    .eq('id', userId)
    .single()
  if (!user) return { ok: false, remaining: 0 }
  const current = Math.max(0, user.tokens_remaining ?? 0)
  if (current < amount) return { ok: false, remaining: current }
  const newRemaining = current - amount
  await admin.from('users').update({ tokens_remaining: newRemaining }).eq('id', userId)
  return { ok: true, remaining: newRemaining }
}
