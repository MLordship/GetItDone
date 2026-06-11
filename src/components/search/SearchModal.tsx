'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Search, X, Inbox, Zap, Clock, Sparkles, Calendar, FolderKanban } from 'lucide-react'

interface Result {
  id: string
  title: string
  subtitle?: string
  type: 'inbox' | 'next_action' | 'waiting_for' | 'someday_maybe' | 'scheduled' | 'project'
  href: string
}

const TYPE_META: Record<Result['type'], { label: string; icon: React.ReactNode; color: string }> = {
  inbox:        { label: 'Inbox',         icon: <Inbox size={13} />,       color: 'var(--muted)' },
  next_action:  { label: 'Prossime',      icon: <Zap size={13} />,         color: 'var(--accent)' },
  waiting_for:  { label: 'In attesa',     icon: <Clock size={13} />,       color: 'var(--muted)' },
  someday_maybe:{ label: 'Prima o poi',   icon: <Sparkles size={13} />,    color: 'var(--muted)' },
  scheduled:    { label: 'Calendario',    icon: <Calendar size={13} />,    color: 'var(--muted)' },
  project:      { label: 'Progetto',      icon: <FolderKanban size={13} />,color: 'var(--muted)' },
}

export default function SearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => { inputRef.current?.focus() }, [])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    const supabase = createClient()
    const pattern = `%${q}%`

    const [inbox, actions, projects] = await Promise.all([
      supabase.from('inbox').select('id, title, notes').ilike('title', pattern).limit(5),
      supabase.from('actions').select('id, title, type, notes').ilike('title', pattern).eq('completed', false).limit(10),
      supabase.from('projects').select('id, title, status').ilike('title', pattern).limit(5),
    ])

    const res: Result[] = [
      ...(inbox.data ?? []).map((i) => ({ id: i.id, title: i.title, subtitle: i.notes ?? undefined, type: 'inbox' as const, href: '/gtd/inbox' })),
      ...(actions.data ?? []).map((a) => ({ id: a.id, title: a.title, subtitle: a.notes ?? undefined, type: a.type as Result['type'], href: typeToHref(a.type) })),
      ...(projects.data ?? []).map((p) => ({ id: p.id, title: p.title, subtitle: p.status !== 'active' ? (p.status === 'completed' ? 'Completato' : 'Prima o poi') : undefined, type: 'project' as const, href: `/gtd/projects/${p.id}` })),
    ]
    setResults(res)
    setSelected(0)
    setLoading(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => search(query), 250)
    return () => clearTimeout(t)
  }, [query, search])

  function typeToHref(type: string) {
    if (type === 'next_action') return '/gtd/next-actions'
    if (type === 'waiting_for') return '/gtd/waiting'
    if (type === 'someday_maybe') return '/gtd/someday'
    if (type === 'scheduled') return '/gtd/calendar'
    return '/gtd/next-actions'
  }

  function navigate(result: Result) {
    router.push(result.href)
    onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) navigate(results[selected])
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
          <Search size={18} style={{ color: 'var(--muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Cerca azioni, progetti, inbox…"
            className="flex-1 text-sm outline-none bg-transparent"
            style={{ color: 'var(--foreground)' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ color: 'var(--muted)' }}>
              <X size={16} />
            </button>
          )}
          <kbd className="hidden md:inline-flex text-xs px-1.5 py-0.5 rounded border" style={{ borderColor: 'var(--border)', color: 'var(--muted)', background: 'var(--background)' }}>
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--muted)' }}>Cerco…</div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--muted)' }}>Nessun risultato per &ldquo;{query}&rdquo;</div>
          )}

          {!loading && results.length > 0 && (
            <ul>
              {results.map((result, i) => {
                const meta = TYPE_META[result.type]
                const isSelected = i === selected
                return (
                  <li key={result.id + result.type}>
                    <button
                      className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
                      style={{ background: isSelected ? 'var(--accent-soft)' : 'transparent' }}
                      onClick={() => navigate(result)}
                      onMouseEnter={() => setSelected(i)}
                    >
                      <div className="mt-0.5 shrink-0" style={{ color: isSelected ? 'var(--accent)' : meta.color }}>
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: isSelected ? 'var(--accent)' : 'var(--foreground)' }}>
                          {result.title}
                        </p>
                        {result.subtitle && (
                          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--muted)' }}>{result.subtitle}</p>
                        )}
                      </div>
                      <span className="text-xs shrink-0 mt-0.5" style={{ color: 'var(--muted)' }}>{meta.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {!query && (
            <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--muted)' }}>
              Digita per cercare in tutto il sistema
            </div>
          )}
        </div>

        {/* Footer hint */}
        {results.length > 0 && (
          <div className="hidden md:flex items-center gap-4 px-4 py-2.5 border-t text-xs" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
            <span>↑↓ naviga</span>
            <span>↵ apri</span>
            <span>Esc chiudi</span>
          </div>
        )}
      </div>
    </div>
  )
}
