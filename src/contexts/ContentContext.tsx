'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export type ContentContextValue = {
  keywords: string[]
  audience: string
  tone: string
  setContext: (ctx: { keywords?: string[]; audience?: string; tone?: string }) => void
}

const ContentContext = createContext<ContentContextValue | null>(null)

export function ContentProvider({ children }: { children: ReactNode }) {
  const [keywords, setKeywords] = useState<string[]>([])
  const [audience, setAudience] = useState('')
  const [tone, setTone] = useState('')

  const setContext = useCallback((ctx: { keywords?: string[]; audience?: string; tone?: string }) => {
    if (ctx.keywords !== undefined) setKeywords(ctx.keywords)
    if (ctx.audience !== undefined) setAudience(ctx.audience)
    if (ctx.tone !== undefined) setTone(ctx.tone)
  }, [])

  return (
    <ContentContext.Provider value={{ keywords, audience, tone, setContext }}>
      {children}
    </ContentContext.Provider>
  )
}

export function useContentContext() {
  const ctx = useContext(ContentContext)
  return ctx ?? { keywords: [], audience: '', tone: '', setContext: () => {} }
}
