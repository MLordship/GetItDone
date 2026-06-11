'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Circle, CheckCircle2, Pencil, ChevronDown, ChevronRight, RotateCcw, Plus } from 'lucide-react'
import type { Action, Area } from '@/types/database'
import { SkeletonList } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toast'
import ActionEditModal from '@/components/actions/ActionEditModal'

const CONTEXTS = ['tutti', '@casa', '@lavoro', '@telefono', '@computer', '@commissioni', '@lettura']

interface ActionWithRelations extends Action {
  areas?: { name: string; color: string } | null
  projects?: { title: string } | null
}

function QuickAdd({ onAdded }: { onAdded: (action: ActionWithRelations) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleOpen() { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    const { data } = await createClient().from('actions').insert({ title: title.trim(), type: 'next_action', completed: false }).select('*, areas(name, color), projects(title)').single()
    if (data) { onAdded(data); setTitle(''); setOpen(false); toast('Azione aggiunta') }
  }

  if (!open) {
    return (
      <button onClick={handleOpen} className="flex items-center gap-2 px-4 py-3 w-full text-sm border-b" style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}>
        <Plus size={15} /> Aggiungi azione
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
        placeholder="Nuova azione…"
        className="flex-1 rounded-xl px-3 py-2 text-sm border outline-none"
        style={{ background: 'var(--background)', borderColor: 'var(--accent)', color: 'var(--foreground)' }}
      />
      <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 rounded-xl text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>Annulla</button>
      <button type="submit" disabled={!title.trim()} className="px-3 py-2 rounded-xl text-sm font-medium disabled:opacity-50" style={{ background: 'var(--accent)', color: '#fff' }}>Aggiungi</button>
    </form>
  )
}

export default function NextActionsList() {
  const [actions, setActions] = useState<ActionWithRelations[]>([])
  const [completed, setCompleted] = useState<ActionWithRelations[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [contextFilter, setContextFilter] = useState('tutti')
  const [areaFilter, setAreaFilter] = useState('all')
  const [editing, setEditing] = useState<ActionWithRelations | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('actions').select('*, areas(name, color), projects(title)').eq('type', 'next_action').eq('completed', false).order('created_at', { ascending: true }),
      supabase.from('actions').select('*, areas(name, color), projects(title)').eq('type', 'next_action').eq('completed', true).order('completed_at', { ascending: false }).limit(30),
      supabase.from('areas').select('*').order('name'),
    ]).then(([{ data: active }, { data: done }, { data: areasData }]) => {
      setActions(active ?? [])
      setCompleted(done ?? [])
      setAreas(areasData ?? [])
      setLoading(false)
    })
  }, [])

  async function toggleComplete(action: ActionWithRelations) {
    await createClient().from('actions').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', action.id)
    setActions((prev) => prev.filter((a) => a.id !== action.id))
    setCompleted((prev) => [{ ...action, completed: true }, ...prev])
    toast(`✓ "${action.title}" completata`, { label: 'Annulla', onClick: () => undoComplete(action) })
  }

  async function undoComplete(action: ActionWithRelations) {
    await createClient().from('actions').update({ completed: false, completed_at: null }).eq('id', action.id)
    setCompleted((prev) => prev.filter((a) => a.id !== action.id))
    setActions((prev) => [...prev, { ...action, completed: false }])
  }

  async function restore(action: ActionWithRelations) {
    await createClient().from('actions').update({ completed: false, completed_at: null }).eq('id', action.id)
    setCompleted((prev) => prev.filter((a) => a.id !== action.id))
    setActions((prev) => [...prev, { ...action, completed: false }])
    toast('Azione ripristinata')
  }

  function handleSaved(id: string, updates: Partial<Action>) {
    setActions((prev) => prev.map((a) => a.id === id ? { ...a, ...updates } : a))
  }

  function handleDeleted(id: string) {
    setActions((prev) => prev.filter((a) => a.id !== id))
    setCompleted((prev) => prev.filter((a) => a.id !== id))
  }

  const filtered = actions.filter((a) => {
    if (contextFilter !== 'tutti' && a.context !== contextFilter) return false
    if (areaFilter !== 'all' && a.area_id !== areaFilter) return false
    return true
  })

  if (loading) {
    return (
      <div>
        <div className="px-4 py-3 border-b flex gap-2" style={{ borderColor: 'var(--border)' }}>
          {[80, 70, 90, 75, 85].map((w, i) => (
            <div key={i} className="h-7 rounded-full animate-pulse" style={{ width: w, background: 'var(--border)' }} />
          ))}
        </div>
        <SkeletonList rows={6} />
      </div>
    )
  }

  return (
    <div>
      {/* Filtri */}
      <div className="px-4 md:px-6 py-3 space-y-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CONTEXTS.map((c) => (
            <button key={c} onClick={() => setContextFilter(c)} className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
              style={{ background: contextFilter === c ? 'var(--accent)' : 'var(--surface)', borderColor: contextFilter === c ? 'var(--accent)' : 'var(--border)', color: contextFilter === c ? '#fff' : 'var(--muted)' }}>
              {c}
            </button>
          ))}
        </div>
        {areas.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button onClick={() => setAreaFilter('all')} className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
              style={{ background: areaFilter === 'all' ? 'var(--foreground)' : 'var(--surface)', borderColor: areaFilter === 'all' ? 'var(--foreground)' : 'var(--border)', color: areaFilter === 'all' ? '#fff' : 'var(--muted)' }}>
              Tutte le aree
            </button>
            {areas.map((area) => (
              <button key={area.id} onClick={() => setAreaFilter(area.id)} className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5"
                style={{ background: areaFilter === area.id ? area.color + '20' : 'var(--surface)', borderColor: areaFilter === area.id ? area.color : 'var(--border)', color: areaFilter === area.id ? area.color : 'var(--muted)' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: area.color }} />
                {area.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <QuickAdd onAdded={(a) => setActions((prev) => [...prev, a])} />

      {filtered.length === 0 && completed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <p className="font-medium" style={{ color: 'var(--foreground)' }}>Nessuna azione qui</p>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Processa qualcosa dall&apos;inbox!</p>
        </div>
      ) : (
        <>
          {filtered.length > 0 && (
            <>
              <p className="px-4 pt-3 pb-1 text-sm" style={{ color: 'var(--muted)' }}>
                {filtered.length} {filtered.length === 1 ? 'azione' : 'azioni'}
              </p>
              <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {filtered.map((action) => (
                  <li key={action.id} className="flex items-start gap-3 px-4 py-3 group" style={{ background: 'var(--surface)' }}>
                    <button onClick={() => toggleComplete(action)} className="mt-0.5 shrink-0 transition-colors" style={{ color: 'var(--border)' }}>
                      <Circle size={20} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{action.title}</p>
                      {action.notes && <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--muted)' }}>{action.notes}</p>}
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {action.context && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>{action.context}</span>}
                        {action.areas && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: action.areas.color + '20', color: action.areas.color }}>{action.areas.name}</span>}
                        {action.projects && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--surface-hover)', color: 'var(--muted)' }}>{action.projects.title}</span>}
                      </div>
                    </div>
                    <button onClick={() => setEditing(action)} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shrink-0" style={{ color: 'var(--muted)' }}>
                      <Pencil size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

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
                        {action.projects && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{action.projects.title}</p>}
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
    </div>
  )
}
