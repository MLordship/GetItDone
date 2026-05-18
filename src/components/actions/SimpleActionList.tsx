'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Circle, CheckCircle2, Pencil, ChevronDown, ChevronRight, RotateCcw, Plus } from 'lucide-react'
import type { Action, ActionType } from '@/types/database'
import { SkeletonList } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toast'
import ActionEditModal from '@/components/actions/ActionEditModal'

interface ActionWithArea extends Action {
  areas?: { name: string; color: string } | null
}

interface Props {
  type: ActionType
  emptyIcon: string
  emptyText: string
  showDelegatedTo?: boolean
}

function QuickAdd({ type, onAdded }: { type: ActionType; onAdded: (action: ActionWithArea) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleOpen() { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    const { data } = await createClient().from('actions').insert({ title: title.trim(), type, completed: false }).select('*, areas(name, color)').single()
    if (data) { onAdded(data); setTitle(''); setOpen(false); toast('Aggiunto') }
  }

  if (!open) {
    return (
      <button onClick={handleOpen} className="flex items-center gap-2 px-4 py-3 w-full text-sm border-b" style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}>
        <Plus size={15} /> Aggiungi
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        placeholder="Nuovo elemento…"
        className="flex-1 rounded-xl px-3 py-2 text-sm border outline-none"
        style={{ background: 'var(--background)', borderColor: 'var(--accent)', color: 'var(--foreground)' }}
      />
      <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 rounded-xl text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>Annulla</button>
      <button type="submit" disabled={!title.trim()} className="px-3 py-2 rounded-xl text-sm font-medium disabled:opacity-50" style={{ background: 'var(--accent)', color: '#fff' }}>Aggiungi</button>
    </form>
  )
}

export default function SimpleActionList({ type, emptyIcon, emptyText, showDelegatedTo }: Props) {
  const [actions, setActions] = useState<ActionWithArea[]>([])
  const [completed, setCompleted] = useState<ActionWithArea[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<ActionWithArea | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('actions').select('*, areas(name, color)').eq('type', type).eq('completed', false).order('created_at', { ascending: false }),
      supabase.from('actions').select('*, areas(name, color)').eq('type', type).eq('completed', true).order('completed_at', { ascending: false }).limit(30),
    ]).then(([{ data: active }, { data: done }]) => {
      setActions(active ?? [])
      setCompleted(done ?? [])
      setLoading(false)
    })
  }, [type])

  async function markDone(action: ActionWithArea) {
    await createClient().from('actions').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', action.id)
    setActions((prev) => prev.filter((a) => a.id !== action.id))
    setCompleted((prev) => [{ ...action, completed: true }, ...prev])
    toast(`✓ "${action.title}" completata`, { label: 'Annulla', onClick: () => restore(action) })
  }

  async function restore(action: ActionWithArea) {
    await createClient().from('actions').update({ completed: false, completed_at: null }).eq('id', action.id)
    setCompleted((prev) => prev.filter((a) => a.id !== action.id))
    setActions((prev) => [{ ...action, completed: false }, ...prev])
    toast('Ripristinato')
  }

  function handleSaved(id: string, updates: Partial<Action>) {
    setActions((prev) => prev.map((a) => a.id === id ? { ...a, ...updates } : a))
  }

  function handleDeleted(id: string) {
    setActions((prev) => prev.filter((a) => a.id !== id))
    setCompleted((prev) => prev.filter((a) => a.id !== id))
  }

  if (loading) return <SkeletonList rows={4} />

  return (
    <>
      <QuickAdd type={type} onAdded={(a) => setActions((prev) => [a, ...prev])} />

      {actions.length === 0 && completed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-4xl mb-3">{emptyIcon}</div>
          <p className="font-medium" style={{ color: 'var(--foreground)' }}>{emptyText}</p>
        </div>
      ) : (
        <>
          <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {actions.map((action) => (
              <li key={action.id} className="flex items-start gap-3 px-4 py-3 group" style={{ background: 'var(--surface)' }}>
                <button onClick={() => markDone(action)} className="mt-0.5 shrink-0" style={{ color: 'var(--border)' }}>
                  <Circle size={20} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{action.title}</p>
                  {action.notes && <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--muted)' }}>{action.notes}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {showDelegatedTo && action.delegated_to && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--surface-hover)', color: 'var(--muted)' }}>→ {action.delegated_to}</span>
                    )}
                    {action.areas && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: action.areas.color + '20', color: action.areas.color }}>{action.areas.name}</span>
                    )}
                  </div>
                </div>
                <button onClick={() => setEditing(action)} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shrink-0" style={{ color: 'var(--muted)' }}>
                  <Pencil size={14} />
                </button>
              </li>
            ))}
          </ul>

          {completed.length > 0 && (
            <div className="border-t mt-2" style={{ borderColor: 'var(--border)' }}>
              <button onClick={() => setShowCompleted((v) => !v)} className="w-full flex items-center gap-2 px-4 py-3 text-sm" style={{ color: 'var(--muted)' }}>
                {showCompleted ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                {completed.length} completate
              </button>
              {showCompleted && (
                <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {completed.map((action) => (
                    <li key={action.id} className="flex items-start gap-3 px-4 py-3 group" style={{ background: 'var(--surface)' }}>
                      <div className="mt-0.5 shrink-0" style={{ color: 'var(--success)' }}><CheckCircle2 size={20} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-through" style={{ color: 'var(--muted)' }}>{action.title}</p>
                        {showDelegatedTo && action.delegated_to && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>→ {action.delegated_to}</p>}
                      </div>
                      <button onClick={() => restore(action)} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shrink-0" style={{ color: 'var(--muted)' }}>
                        <RotateCcw size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      {editing && (
        <ActionEditModal
          action={editing}
          onSave={(updates) => handleSaved(editing.id, updates)}
          onDelete={handleDeleted}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
