'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const startGoogleAuth = async () => {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/pricing`,
        },
      })

      if (authError) {
        setError(authError.message)
      }
    }

    startGoogleAuth()
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fbfdff] px-6">
      <div className="w-full max-w-md rounded-xl border border-[#e7ecf2] bg-white p-7 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-[#10243a]">Continue with Google</h1>
        <p className="mt-2 text-sm text-[#5a6a80]">
          Redirecting you to sign in...
        </p>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}
