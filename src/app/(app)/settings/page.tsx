'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AUDIENCE_OPTIONS = ['Founders', 'Coaches', 'SaaS', 'Agency Owners']
const TONE_OPTIONS = ['Authority', 'Storytelling', 'Educational', 'Direct']
const PLATFORM_OPTIONS = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'x', label: 'X' },
  { value: 'both', label: 'Both' },
]

export default function SettingsPage() {
  const [preferences, setPreferences] = useState({
    audience: '',
    tone: '',
    platform: 'both',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('users')
        .select('audience_preference, tone_preference, platform_preference')
        .eq('id', user.id)
        .single()

      if (data) {
        setPreferences({
          audience: data.audience_preference ?? '',
          tone: data.tone_preference ?? '',
          platform: data.platform_preference ?? 'both',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setSaving(true)
    setSaved(false)
    try {
      await supabase
        .from('users')
        .update({
          audience_preference: preferences.audience || null,
          tone_preference: preferences.tone || null,
          platform_preference: preferences.platform,
        })
        .eq('id', user.id)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error(err)
      alert('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      alert('Type DELETE to confirm')
      return
    }

    setDeleting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to delete')
      }

      await supabase.auth.signOut({ scope: 'global' })
      window.location.href = '/'
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="h-40 animate-pulse rounded-xl border border-[#e8ecf2] bg-[#f8fafc]" />
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0f1c2e]">Settings</h1>
      <p className="mt-1 text-[#5e6c80]">Manage your default preferences.</p>

      {/* Default Preferences */}
      <div className="mt-8 max-w-xl rounded-xl border border-[#e8ecf2] bg-white p-6 shadow-[0_2px_8px_rgba(15,28,46,0.04)]">
        <h2 className="text-xl font-semibold text-[#0f1c2e]">Default Preferences</h2>
        <p className="mt-1 text-sm text-[#5e6c80]">These will be pre-filled when creating new content.</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-[#0f1c2e]">Default Audience</label>
            <select
              value={preferences.audience}
              onChange={(e) => setPreferences((p) => ({ ...p, audience: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-[#e8ecf2] px-3 py-2 text-sm focus:border-[#0f2d52] focus:outline-none focus:ring-2 focus:ring-[#0f2d52]/20"
            >
              <option value="">None</option>
              {AUDIENCE_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0f1c2e]">Default Tone</label>
            <select
              value={preferences.tone}
              onChange={(e) => setPreferences((p) => ({ ...p, tone: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-[#e8ecf2] px-3 py-2 text-sm focus:border-[#0f2d52] focus:outline-none focus:ring-2 focus:ring-[#0f2d52]/20"
            >
              <option value="">None</option>
              {TONE_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0f1c2e]">Default Platforms</label>
            <select
              value={preferences.platform}
              onChange={(e) => setPreferences((p) => ({ ...p, platform: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-[#e8ecf2] px-3 py-2 text-sm focus:border-[#0f2d52] focus:outline-none focus:ring-2 focus:ring-[#0f2d52]/20"
            >
              {PLATFORM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="mt-6 rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#333] disabled:opacity-50"
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="mt-12 max-w-xl rounded-xl border border-red-200 bg-red-50/50 p-6">
        <h2 className="text-xl font-semibold text-red-800">Danger Zone</h2>
        <p className="mt-1 text-sm text-red-700">Permanently delete your account and all data.</p>
        <div className="mt-6 flex flex-wrap items-end gap-4">
          <input
            type="text"
            placeholder="Type DELETE to confirm"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            className="rounded-lg border border-red-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deleteConfirm !== 'DELETE' || deleting}
            className="rounded-xl border border-red-600 bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete Account'}
          </button>
        </div>
      </div>
    </div>
  )
}
