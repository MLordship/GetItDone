'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

function ResetForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Supabase manda i token come fragment (#) che non arrivano al server.
    // Il client li legge e crea la sessione automaticamente.
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // sessione pronta, l'utente può impostare la nuova password
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Le password non coincidono')
      return
    }
    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await createClient().auth.updateUser({ password })
    if (error) {
      setError(error.message)
    } else {
      setDone(true)
      setTimeout(() => router.push('/gtd/inbox'), 2000)
    }
    setLoading(false)
  }

  if (done) {
    return (
      <div className="text-center space-y-2">
        <div className="text-3xl">✅</div>
        <p className="font-medium" style={{ color: 'var(--foreground)' }}>Password aggiornata</p>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Reindirizzamento in corso…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl p-6 space-y-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <h2 className="font-semibold" style={{ color: 'var(--foreground)' }}>Nuova password</h2>

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Nuova password"
        required
        autoComplete="new-password"
        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none border"
        style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
      />
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Conferma password"
        required
        autoComplete="new-password"
        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none border"
        style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
      />

      {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}

      <button
        type="submit"
        disabled={loading || !password || !confirm}
        className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
        style={{ background: 'var(--accent)', color: '#fff' }}
      >
        {loading ? 'Salvo…' : 'Imposta password'}
      </button>
    </form>
  )
}

export default function ResetPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center" style={{ color: 'var(--foreground)' }}>GetItDone</h1>
        <Suspense>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  )
}
