'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getUserSubscriptionStatus, hasPaidAccess, syncUserProfile } from '@/lib/user-profile'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { UserAvatarMenu } from '@/components/auth/UserAvatarMenu'
import { ContentProvider } from '@/contexts/ContentContext'
import { ChatbotSidebarWrapper } from '@/components/chat/ChatbotSidebarWrapper'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ email: string; name: string; avatarUrl: string | null } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }

      await syncUserProfile(authUser)
      const status = await getUserSubscriptionStatus(authUser.id)
      if (!hasPaidAccess(status)) {
        router.push('/pricing')
        return
      }

      const metadata = authUser.user_metadata as { full_name?: string; name?: string; avatar_url?: string; picture?: string }
      setUser({
        email: authUser.email ?? '',
        name: metadata.full_name ?? metadata.name ?? authUser.email ?? 'User',
        avatarUrl: metadata.avatar_url ?? metadata.picture ?? null,
      })
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#e8ecf2] border-t-[#0f2d52]" />
          <p className="mt-4 text-sm text-[#5a6a80]">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <ContentProvider>
      <div className="min-h-screen bg-white">
        <DashboardSidebar />
        <ChatbotSidebarWrapper />
        <main className="pl-[240px]">
        <header className="sticky top-0 z-30 flex items-center justify-end border-b border-[#e8ecf2] bg-white/95 px-8 py-4 backdrop-blur-sm">
          {user && (
            <UserAvatarMenu
              name={user.name}
              email={user.email}
              avatarUrl={user.avatarUrl}
              onLogout={async () => {
                await supabase.auth.signOut({ scope: 'global' })
                router.replace('/')
                router.refresh()
              }}
            />
          )}
        </header>
        <div className="mx-auto max-w-[1100px] p-8">{children}</div>
      </main>
    </div>
    </ContentProvider>
  )
}
