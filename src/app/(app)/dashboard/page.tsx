'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type GenerationPreview = {
  id: string
  created_at: string
  top_linkedin_hook: string
  top_x_hook: string
  has_linkedin: boolean
  has_x: boolean
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getTopHook(posts: Array<{ post?: string; content?: string }>): string {
  if (!posts?.length) return ''
  const first = posts[0]
  const text = (first.post ?? first.content ?? '').trim()
  const hook = text.split('\n')[0] ?? text
  return hook.length > 80 ? hook.slice(0, 80) + '…' : hook
}

export default function DashboardPage() {
  const [generations, setGenerations] = useState<GenerationPreview[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('generations')
        .select('id, created_at, posts')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(12)

      if (error) {
        console.error(error)
        setLoading(false)
        return
      }

      const previews: GenerationPreview[] = (data ?? []).map((g) => {
        const posts = (g.posts ?? []) as Array<{ post?: string; content?: string; platform?: string }>
        const linkedin = posts.filter((p) => (p.platform ?? 'linkedin') === 'linkedin')
        const xPosts = posts.filter((p) => (p.platform ?? '').toLowerCase() === 'x')
        return {
          id: g.id,
          created_at: g.created_at,
          top_linkedin_hook: getTopHook(linkedin.length ? linkedin : posts),
          top_x_hook: getTopHook(xPosts.length ? xPosts : posts),
          has_linkedin: linkedin.length > 0 || posts.length > 0,
          has_x: xPosts.length > 0,
        }
      })
      setGenerations(previews)
      setLoading(false)
    }
    load()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this generation?')) return
    setDeleting(id)
    try {
      const { error } = await supabase.from('generations').delete().eq('id', id)
      if (error) throw error
      setGenerations((prev) => prev.filter((g) => g.id !== id))
    } catch (err) {
      console.error(err)
      alert('Failed to delete')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0f1c2e]">Dashboard</h1>
          <p className="mt-1 text-[#5e6c80]">Keywords into posts. Create and manage content.</p>
        </div>
        <Link
          href="/create"
          className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#333]"
        >
          Create New Posts
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-[#0f1c2e]">Recent Generations</h2>
        {loading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-xl border border-[#e8ecf2] bg-[#f8fafc]"
              />
            ))}
          </div>
        ) : generations.length === 0 ? (
          <div className="mt-6 rounded-xl border border-[#e8ecf2] bg-[#fbfdff] p-12 text-center">
            <p className="text-[#5e6c80]">No generations yet. Create your first post batch.</p>
            <Link
              href="/create"
              className="mt-4 inline-block rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#333]"
            >
              Create New Posts
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {generations.map((g) => (
              <div
                key={g.id}
                className="rounded-xl border border-[#e8ecf2] bg-white p-5 shadow-[0_2px_8px_rgba(15,28,46,0.04)] transition-shadow hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,28,46,0.08)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-[#8b9ab0]">{formatDate(g.created_at)}</p>
                  <button
                    type="button"
                    onClick={() => handleDelete(g.id)}
                    disabled={deleting === g.id}
                    className="rounded p-1.5 text-[#8b9ab0] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    title="Delete"
                    aria-label="Delete generation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-medium text-[#0f1c2e]">
                  {g.top_linkedin_hook || g.top_x_hook || 'Content generated'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {g.has_linkedin && (
                    <span className="rounded-md bg-[#e8f4fc] px-2 py-0.5 text-xs font-medium text-[#0f2d52]">
                      LinkedIn
                    </span>
                  )}
                  {g.has_x && (
                    <span className="rounded-md bg-[#f0f0f0] px-2 py-0.5 text-xs font-medium text-[#333]">
                      X
                    </span>
                  )}
                </div>
                <Link
                  href={`/results/${g.id}`}
                  className="mt-4 block w-full rounded-lg border border-[#e8ecf2] py-2 text-center text-sm font-medium text-[#0f1c2e] transition hover:bg-[#f5f8fd]"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
