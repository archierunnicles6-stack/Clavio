'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type GenerationRow = {
  id: string
  created_at: string
  transcript: string
  top_linkedin: string
  top_x: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getPreview(text: string, lines = 2): string {
  const parts = text.split('\n').filter(Boolean).slice(0, lines)
  return parts.join(' ').slice(0, 120) + (parts.join(' ').length > 120 ? '…' : '')
}

function getTopHook(posts: Array<{ post?: string; content?: string; platform?: string }>): { linkedin: string; x: string } {
  const linkedin = posts.find((p) => (p.platform ?? 'linkedin').toLowerCase() !== 'x')
  const xPost = posts.find((p) => (p.platform ?? '').toLowerCase() === 'x')
  const first = (arr: typeof posts) => {
    const p = arr[0]
    return ((p?.post ?? p?.content) ?? '').trim().split('\n')[0] ?? ''
  }
  return {
    linkedin: first(linkedin ? [linkedin] : posts),
    x: first(xPost ? [xPost] : []),
  }
}

export default function HistoryPage() {
  const [items, setItems] = useState<GenerationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('generations')
        .select('id, created_at, transcript, posts')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
        setLoading(false)
        return
      }

      const rows: GenerationRow[] = (data ?? []).map((g) => {
        const posts = (g.posts ?? []) as Array<{ post?: string; content?: string; platform?: string }>
        const { linkedin, x } = getTopHook(posts)
        return {
          id: g.id,
          created_at: g.created_at,
          transcript: g.transcript ?? '',
          top_linkedin: linkedin,
          top_x: x,
        }
      })
      setItems(rows)
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
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (err) {
      console.error(err)
      alert('Failed to delete')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0f1c2e]">History</h1>
      <p className="mt-1 text-[#5e6c80]">Your past content generations.</p>

      {loading ? (
        <div className="mt-8 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-[#e8ecf2] bg-[#f8fafc]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-[#e8ecf2] bg-[#fbfdff] p-12 text-center text-[#5e6c80]">
          No generations yet.
          <Link href="/create" className="ml-2 text-[#0f2d52] hover:underline">
            Create your first batch
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {items.map((g) => (
            <div
              key={g.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#e8ecf2] bg-white p-5 shadow-[0_2px_8px_rgba(15,28,46,0.04)]"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-[#8b9ab0]">{formatDate(g.created_at)}</p>
                <p className="mt-1 line-clamp-2 text-sm text-[#0f1c2e]">
                  {getPreview(g.transcript)}
                </p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#5e6c80]">
                  {g.top_linkedin && (
                    <span className="truncate max-w-[200px]" title={g.top_linkedin}>
                      LinkedIn: {g.top_linkedin.slice(0, 50)}…
                    </span>
                  )}
                  {g.top_x && (
                    <span className="truncate max-w-[200px]" title={g.top_x}>
                      X: {g.top_x.slice(0, 50)}…
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link
                  href={`/results/${g.id}`}
                  className="rounded-lg border border-[#e8ecf2] px-4 py-2 text-sm font-medium text-[#0f1c2e] transition hover:bg-[#f5f8fd]"
                >
                  View
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(g.id)}
                  disabled={deleting === g.id}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  {deleting === g.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
