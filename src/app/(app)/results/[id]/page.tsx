'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import * as Dialog from '@radix-ui/react-dialog'
import { Copy, RefreshCw, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Post = {
  rank: number
  score: number
  post?: string
  content?: string
  platform?: string
}

function getContent(p: Post): string {
  return (p.post ?? p.content ?? '').trim()
}

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [generation, setGeneration] = useState<{ posts: Post[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState<number | null>(null)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('generations')
        .select('posts')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        router.replace('/dashboard')
        return
      }

      // Prefer posts table if we have it - for now use generations.posts
      const { data: postsRows } = await supabase
        .from('posts')
        .select('content, score, rank, platform')
        .eq('generation_id', id)
        .order('rank')

      const posts: Post[] = postsRows?.length
        ? postsRows.map((r) => ({
            content: r.content,
            score: r.score,
            rank: r.rank,
            platform: r.platform,
          }))
        : ((data.posts ?? []) as Post[])

      setGeneration({ posts })
      setLoading(false)
    }
    load()
  }, [id, router])

  const copyAll = () => {
    if (!generation?.posts) return
    const text = sortedPosts.map((p, i) => `--- Post #${i + 1} (Score: ${p.score}) ---\n${getContent(p)}\n`).join('\n')
    navigator.clipboard.writeText(text)
    alert('Copied all posts!')
  }

  const copyOne = (p: Post) => {
    navigator.clipboard.writeText(getContent(p))
    alert('Copied!')
  }

  const handleRegenerate = async (p: Post) => {
    const rank = p.rank
    setRegenerating(rank)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/regenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          generationId: id,
          originalPost: getContent(p),
          rank,
        }),
      })
      if (!res.ok) throw new Error('Regenerate failed')
      const data = await res.json()
      setGeneration((g) => {
        if (!g) return g
        const updated = g.posts.map((x) =>
          x.rank === rank ? { ...x, post: data.post?.post ?? data.post?.content ?? getContent(x) } : x
        )
        return { posts: updated }
      })
    } catch (err) {
      console.error(err)
      alert('Failed to regenerate')
    } finally {
      setRegenerating(null)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this generation? This cannot be undone.')) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('generations').delete().eq('id', id)
      if (error) throw error
      router.push('/dashboard')
    } catch (err) {
      console.error(err)
      alert('Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  const handleEdit = (p: Post) => {
    setEditingPost(p)
    setEditContent(getContent(p))
  }

  const handleSaveEdit = async () => {
    if (!editingPost || !editContent.trim()) return
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/posts/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          generationId: id,
          rank: editingPost.rank,
          content: editContent.trim(),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Failed to save')
      }
      setGeneration((g) => {
        if (!g) return g
        const updated = g.posts.map((x) =>
          x.rank === editingPost.rank
            ? { ...x, post: editContent.trim(), content: editContent.trim() }
            : x
        )
        return { posts: updated }
      })
      setEditingPost(null)
      setEditContent('')
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const sortedPosts = [...(generation?.posts ?? [])].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e8ecf2] border-t-[#0f2d52]" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[700px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-[#0f1c2e]">Your Ranked Content</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/create"
            className="rounded-xl border border-[#e8ecf2] px-4 py-2 text-sm font-medium text-[#0f1c2e] transition hover:bg-[#f5f8fd]"
          >
            <RotateCcw className="mr-2 inline h-4 w-4" />
            Generate Again
          </Link>
          <button
            type="button"
            onClick={copyAll}
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#333]"
          >
            <Copy className="mr-2 inline h-4 w-4" />
            Copy All
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="mr-2 inline h-4 w-4" />
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Post Cards */}
      <div className="mt-8 space-y-4">
        {sortedPosts.length === 0 ? (
          <div className="rounded-xl border border-[#e8ecf2] p-8 text-center text-[#5e6c80]">
            No posts for this generation.
          </div>
        ) : (
          sortedPosts.map((p, idx) => {
            const rank = p.rank ?? idx + 1
            const isTop3 = rank <= 3
            const content = getContent(p)
            const firstLine = content.split('\n')[0] ?? ''
            const rest = content.slice(firstLine.length).trim()

            return (
              <div
                key={`${rank}-${idx}`}
                className={`rounded-xl border p-6 shadow-[0_2px_8px_rgba(15,28,46,0.04)] ${
                  isTop3 ? 'border-[#0f2d52] bg-[#f8fcff]' : 'border-[#e8ecf2] bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="rounded-lg bg-[#0f2d52] px-2.5 py-1 text-xs font-bold text-white">
                    #{rank}
                  </span>
                  <span className="text-sm font-semibold text-[#0f1c2e]">{p.score}/100</span>
                </div>
                <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#0f1c2e]">
                  {firstLine && <strong>{firstLine}</strong>}
                  {rest && `\n${rest}`}
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => copyOne(p)}
                    className="flex items-center gap-2 rounded-lg border border-[#e8ecf2] px-3 py-2 text-sm font-medium text-[#0f1c2e] transition hover:bg-[#f5f8fd]"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRegenerate(p)}
                    disabled={regenerating === rank}
                    className="flex items-center gap-2 rounded-lg border border-[#e8ecf2] px-3 py-2 text-sm font-medium text-[#0f1c2e] transition hover:bg-[#f5f8fd] disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${regenerating === rank ? 'animate-spin' : ''}`} />
                    Regenerate
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-lg border border-[#e8ecf2] px-3 py-2 text-sm font-medium text-[#0f1c2e] transition hover:bg-[#f5f8fd]"
                    onClick={() => handleEdit(p)}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Edit Modal */}
      <Dialog.Root open={editingPost !== null} onOpenChange={(open) => !open && setEditingPost(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[#e8ecf2] bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold text-[#0f1c2e]">
              Edit post #{editingPost?.rank ?? ''}
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Edit the post content
            </Dialog.Description>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="mt-4 min-h-[200px] w-full resize-y rounded-lg border border-[#e8ecf2] p-3 text-sm text-[#0f1c2e] focus:border-[#0f2d52] focus:outline-none focus:ring-2 focus:ring-[#0f2d52]/20"
              placeholder="Post content..."
              disabled={saving}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg border border-[#e8ecf2] px-4 py-2 text-sm font-medium text-[#0f1c2e] transition hover:bg-[#f5f8fd]"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={saving || !editContent.trim()}
                className="rounded-lg bg-[#0f2d52] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1a3d6e] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
