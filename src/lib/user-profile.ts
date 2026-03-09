import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type UserMetadata = {
  full_name?: string
  name?: string
  avatar_url?: string
  picture?: string
}

type SubscriptionStatus = 'active' | 'trialing' | 'canceled' | null

export function hasPaidAccess(status: SubscriptionStatus) {
  return status === 'active' || status === 'trialing'
}

export async function syncUserProfile(user: User) {
  if (!user.email) return

  const metadata = (user.user_metadata ?? {}) as UserMetadata
  const fullName = metadata.full_name ?? metadata.name ?? null
  const avatarUrl = metadata.avatar_url ?? metadata.picture ?? null

  await supabase.from('users').upsert(
    {
      id: user.id,
      email: user.email,
      full_name: fullName,
      avatar_url: avatarUrl,
    },
    {
      onConflict: 'id',
    }
  )
}

export async function getUserSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const { data } = await supabase
    .from('users')
    .select('subscription_status')
    .eq('id', userId)
    .single()

  return (data?.subscription_status ?? null) as SubscriptionStatus
}
