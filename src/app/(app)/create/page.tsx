'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown, X, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useContentContext } from '@/contexts/ContentContext'

const AUDIENCE_OPTIONS = ['Founders', 'Coaches', 'SaaS', 'Agency Owners']
const TONE_OPTIONS = ['Authority', 'Storytelling', 'Educational', 'Direct']

const MAX_KEYWORDS = 20

export default function CreatePage() {
  const [keywords, setKeywords] = useState<string[]>([])
  const [inputValue, setInputValue] = useState('')
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [preferences, setPreferences] = useState({
    audience: '',
    tone: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { setContext } = useContentContext()

  useEffect(() => {
    const loadPrefs = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('users')
        .select('audience_preference, tone_preference')
        .eq('id', user.id)
        .single()

      if (data) {
        setPreferences((p) => ({
          ...p,
          audience: data.audience_preference ?? '',
          tone: data.tone_preference ?? '',
        }))
      }
    }
    loadPrefs()
  }, [])

  useEffect(() => {
    setContext({
      keywords,
      audience: preferences.audience,
      tone: preferences.tone,
    })
  }, [keywords, preferences.audience, preferences.tone, setContext])

  const addKeyword = (value: string) => {
    const trimmed = value.trim().toLowerCase()
    if (!trimmed || keywords.length >= MAX_KEYWORDS) return
    if (keywords.includes(trimmed)) return
    setKeywords((k) => [...k, trimmed])
    setInputValue('')
  }

  const removeKeyword = (idx: number) => {
    setKeywords((k) => k.filter((_, i) => i !== idx))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addKeyword(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && keywords.length) {
      removeKeyword(keywords.length - 1)
    }
  }

  const handleGenerate = async () => {
    if (!keywords.length) {
      alert('Add at least one keyword.')
      return
    }

    setIsSubmitting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          keywords,
          audience: preferences.audience || 'General',
          tone: preferences.tone || 'Authority',
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        if (res.status === 402) {
          alert(err.error ?? 'Insufficient credits. Generation uses 20 credits. Check your balance in the profile menu or wait for your monthly reset.')
          setIsSubmitting(false)
          return
        }
        throw new Error(err.error ?? 'Failed to generate')
      }

      const data = await res.json()
      router.push(`/processing?generationId=${data.generationId}`)
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Failed to generate. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Create New Content
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500">
          Up to {MAX_KEYWORDS} keywords → 16 LinkedIn posts
        </p>
      </div>

      <div className="space-y-8">
        {/* Keywords — minimal card */}
        <div>
          <label className="text-xs font-medium uppercase tracking-wider text-neutral-400">
            Keywords
          </label>
          <div className="mt-2 flex min-h-[100px] flex-wrap gap-2 rounded-lg border border-neutral-200 bg-neutral-50/50 px-4 py-3 transition-colors focus-within:border-neutral-400 focus-within:bg-white">
            {keywords.map((kw, idx) => (
              <span
                key={`${kw}-${idx}`}
                className="inline-flex items-center gap-1 rounded-md bg-neutral-800 px-2.5 py-1 text-xs font-medium text-white"
              >
                {kw}
                <button
                  type="button"
                  onClick={() => removeKeyword(idx)}
                  className="rounded p-0.5 hover:bg-neutral-600"
                  aria-label={`Remove ${kw}`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => inputValue.trim() && addKeyword(inputValue)}
              placeholder={keywords.length ? 'Add more...' : 'e.g. leadership, AI, productivity'}
              className="min-w-[140px] flex-1 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
              disabled={keywords.length >= MAX_KEYWORDS}
            />
          </div>
          <p className="mt-1.5 text-xs text-neutral-400">
            {keywords.length}/{MAX_KEYWORDS}
          </p>
        </div>

        {/* Preferences — inline, compact */}
        <div>
          <button
            type="button"
            onClick={() => setPrefsOpen((p) => !p)}
            className="flex w-full items-center justify-between"
          >
            <label className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              Preferences
            </label>
            <ChevronDown className={`h-3.5 w-3.5 text-neutral-400 transition-transform ${prefsOpen ? 'rotate-180' : ''}`} />
          </button>
          {prefsOpen && (
            <div className="mt-3 space-y-3 rounded-lg border border-neutral-200 bg-neutral-50/30 px-4 py-3">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-neutral-500">Audience</label>
                  <select
                    value={preferences.audience}
                    onChange={(e) => setPreferences((p) => ({ ...p, audience: e.target.value }))}
                    className="mt-1 w-full rounded border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none"
                  >
                    <option value="">Select</option>
                    {AUDIENCE_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-500">Tone</label>
                  <select
                    value={preferences.tone}
                    onChange={(e) => setPreferences((p) => ({ ...p, tone: e.target.value }))}
                    className="mt-1 w-full rounded border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none"
                  >
                    <option value="">Select</option>
                    {TONE_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Link
                href="/settings"
                className="text-xs text-neutral-500 hover:text-neutral-700"
              >
                Save defaults in Settings
              </Link>
            </div>
          )}
        </div>

        {/* Generate */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!keywords.length || isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? (
            'Generating...'
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate 16 Posts
            </>
          )}
        </button>
      </div>
    </div>
  )
}
