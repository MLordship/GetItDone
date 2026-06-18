'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Mode = 'login' | 'reset-sent'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<Mode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setError('Email o password non corretti')
    } else {
      router.push('/gtd/inbox')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleReset() {
    if (!email.trim()) {
      setError('Inserisci prima la tua email')
      return
    }
    setLoading(true)
    setError('')
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${siteUrl}/auth/callback?next=/auth/reset`,
    })
    setMode('reset-sent')
    setLoading(false)
  }

  if (mode === 'reset-sent') {
    return (
      <div
        className="rounded-2xl p-6 text-center space-y-3 border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="text-3xl">📬</div>
        <h2 className="font-semibold" style={{ color: 'var(--foreground)' }}>Controlla la tua email</h2>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Abbiamo inviato le istruzioni per reimpostare la password a <strong>{email}</strong>.
        </p>
        <button
          onClick={() => setMode('login')}
          className="text-sm underline"
          style={{ color: 'var(--muted)' }}
        >
          Torna al login
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleLogin}
      className="rounded-2xl p-6 space-y-4 border"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="space-y-1.5">
        <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nome@esempio.com"
          required
          autoComplete="email"
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none border"
          style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none border"
          style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
        />
      </div>

      {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}

      <button
        type="submit"
        disabled={loading || !email.trim() || !password}
        className="w-full py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
        style={{ background: 'var(--accent)', color: '#fff' }}
      >
        {loading ? 'Accesso…' : 'Accedi'}
      </button>

      <button
        type="button"
        onClick={handleReset}
        disabled={loading}
        className="w-full text-xs text-center"
        style={{ color: 'var(--muted)' }}
      >
        Password dimenticata?
      </button>
    </form>
  )
}
