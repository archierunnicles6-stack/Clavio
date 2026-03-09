'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useContentContext } from '@/contexts/ContentContext'

type Message = { role: 'user' | 'assistant'; content: string }

const QUICK_PROMPTS = [
  'Suggest hashtags for my keywords',
  'What tone works best for founders?',
  'Keyword ideas to expand my topics',
  'Tips for a stronger hook',
  'Best hashtags for SaaS content',
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { keywords, audience, tone } = useContentContext()

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMessage: Message = { role: 'user', content: trimmed }
    setMessages((m) => [...m, userMessage])
    setInput('')
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
          context: (keywords.length || audience || tone)
            ? { keywords: keywords.length ? keywords : undefined, audience: audience || undefined, tone: tone || undefined }
            : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 402) {
          setMessages((m) => [...m, { role: 'assistant', content: `⛔ ${data.error ?? 'Insufficient credits. Chat uses 3 credits. Check your balance in the profile menu (top right).'}` }])
          return
        }
        throw new Error(data.error ?? 'Failed to get response')
      }

      setMessages((m) => [...m, { role: 'assistant', content: data.reply }])
    } catch (err) {
      console.error(err)
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      <div className="flex-1 flex flex-col items-center">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4">
            <h1 className="text-2xl font-semibold text-neutral-900">Content Assistant</h1>
            <p className="mt-2 text-sm text-neutral-500">
              Get help with hashtags, keywords, audience, tone, and content strategy.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="rounded-full bg-neutral-100 px-4 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-200"
                >
                  {prompt}
                </button>
              ))}
            </div>
            {keywords.length > 0 && (
              <p className="mt-6 text-center text-xs text-neutral-400">
                Using your keywords: {keywords.join(', ')}
              </p>
            )}
          </div>
        ) : (
          <div ref={scrollRef} className="w-full max-w-2xl flex-1 overflow-y-auto px-4 pb-4 pt-6">
            <div className="space-y-6">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-neutral-100 px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-neutral-500" strokeWidth={1.5} />
                    <span className="text-[15px] text-neutral-500">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-neutral-200 bg-white px-4 py-6">
        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
          <div className="flex gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2 focus-within:border-neutral-300 focus-within:bg-white transition-colors">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about hashtags, keywords, audience..."
              className="flex-1 bg-transparent py-2.5 text-[15px] text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-white transition hover:bg-neutral-900 disabled:opacity-40 disabled:hover:bg-neutral-800"
            >
              <Send className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
