'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const STEPS = [
  'Processing keywords…',
  'Drafting posts…',
  'Scoring content…',
  'Finalizing posts…',
]

function ProcessingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const generationId = searchParams.get('generationId')
  const [step, setStep] = useState(0)
  const progress = (step / STEPS.length) * 100

  useEffect(() => {
    if (!generationId) {
      router.replace('/create')
      return
    }

    const interval = setInterval(() => {
      setStep((s) => {
        const next = Math.min(s + 1, STEPS.length)
        if (next >= STEPS.length) {
          clearInterval(interval)
          // Defer navigation to avoid updating Router during render
          setTimeout(() => router.replace(`/results/${generationId}`), 0)
        }
        return next
      })
    }, 600)

    return () => clearInterval(interval)
  }, [generationId, router])

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white">
      <div className="mx-auto max-w-md px-8 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-[#e8ecf2] border-t-[#0f2d52]" />
        <h2 className="mt-6 text-xl font-semibold text-[#0f1c2e]">Creating your content</h2>
        <p className="mt-2 text-sm text-[#5e6c80]">{STEPS[step] ?? STEPS[STEPS.length - 1]}</p>

        <div className="mt-8 h-2 w-full overflow-hidden rounded-full bg-[#e8ecf2]">
          <div
            className="h-full rounded-full bg-[#0f2d52] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-[#e8ecf2] border-t-[#0f2d52]" />
      </div>
    }>
      <ProcessingContent />
    </Suspense>
  )
}
