'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Circle, CheckCircle2, Calendar, Tag } from 'lucide-react'
import type { Project, Action, Area } from '@/types/database'
import { toast } from '@/components/ui/Toast'
import { formatDateShort, formatDateLong } from '@/lib/dateIt'
import { SkeletonList } from '@/components/ui/Skeleton'

interface ProjectWithArea extends Project {
  areas?: { name: string; color: string } | null
}

interface ActionWithDetails extends Action {
  areas?: { name: string; color: string } | null
}

const ACTION_TYPES = [
  { value: 'next_action', label: 'Prossima azione' },
  { value: 'waiting_for', label: 'In attesa' },
  { value: 'someday_maybe', label: 'Prima o poi' },
  { value: 'scheduled', label: 'Pianificata' },
] as const

const CONTEXTS = ['@casa', '@lavoro', '@telefono', '@computer', '@commissioni', '@lettura']

export default function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [project, setProject] = useState<ProjectWithArea | null>(null)
  const [actions, setActions] = useState<ActionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  // New action form state
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<'next_action' | 'waiting_for' | 'someday_maybe' | 'scheduled'>('next_action')
  const [newContext, setNewContext] = useState('')
  const [newScheduled, setNewScheduled] = useState('')
  const [newDelegated, setNewDelegated] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('projects').select('*, areas(name, color)').eq('id', id).single(),
      supabase.from('actions').select('*').eq('project_id', id).order('created_at', { ascending: true }),
    ]).then(([{ data: p }, { data: a }]) => {
      setProject(p)
      setActions(a ?? [])
      setLoading(false)
    })
  }, [id])

  async function handleAddAction() {
    if (!newTitle.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('actions').insert({
      user_id: user.id,
      project_id: id,
      area_id: project?.area_id ?? null,
      title: newTitle.trim(),
      type: newType,
      context: newContext || null,
      scheduled_at: newScheduled || null,
      delegated_to: newDelegated || null,
      completed: false,
    }).select().single()
    if (data) setActions((prev) => [...prev, data])
    setNewTitle(''); setNewContext(''); setNewScheduled(''); setNewDelegated('')
    setShowAdd(false)
    setSaving(false)
    toast('Azione aggiunta')
  }

  async function toggleComplete(action: ActionWithDetails) {
    const done = !action.completed
    await createClient().from('actions').update({
      completed: done,
      completed_at: done ? new Date().toISOString() : null,
    }).eq('id', action.id)
    setActions((prev) => prev.map((a) => a.id === action.id ? { ...a, completed: done, completed_at: done ? new Date().toISOString() : null } : a))
    if (done) toast(`✓ "${action.title}" completata`, {
      label: 'Annulla',
      onClick: () => toggleComplete({ ...action, completed: true }),
    })
  }

  async function markProjectDone() {
    await createClient().from('projects').update({ status: 'completed' }).eq('id', id)
    toast('Progetto completato!')
    router.push('/projects')
  }

  if (loading) return (
    <div>
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="w-8 h-8 rounded-lg animate-pulse" style={{ background: 'var(--border)' }} />
        <div className="h-6 w-48 rounded animate-pulse" style={{ background: 'var(--border)' }} />
      </div>
      <SkeletonList rows={4} />
    </div>
  )

  if (!project) return <div className="p-8 text-center" style={{ color: 'var(--muted)' }}>Progetto non trovato</div>

  const pending = actions.filter((a) => !a.completed)
  const completed = actions.filter((a) => a.completed)

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-5 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm mb-3" style={{ color: 'var(--muted)' }}>
          <ArrowLeft size={15} /> Progetti
        </button>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {project.areas && (
              <div className="w-1.5 h-8 rounded-full shrink-0 mt-0.5" style={{ background: project.areas.color }} />
            )}
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{project.title}</h1>
              <div className="flex flex-wrap gap-2 mt-1">
                {project.areas && <span className="text-xs" style={{ color: project.areas.color }}>{project.areas.name}</span>}
                {project.due_date && (
                  <span className="text-xs flex items-center gap-0.5" style={{ color: 'var(--muted)' }}>
                    <Calendar size={11} />
                    {formatDateLong(project.due_date)}
                  </span>
                )}
                <span className="text-xs" style={{ color: 'var(--muted)' }}>{pending.length} azioni rimaste</span>
              </div>
              {project.description && (
                <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>{project.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={markProjectDone}
            className="shrink-0 text-xs px-3 py-1.5 rounded-full border"
            style={{ borderColor: 'var(--success)', color: 'var(--success)' }}
          >
            Completa
          </button>
        </div>
      </div>

      {/* Aggiungi azione */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 text-sm"
            style={{ color: 'var(--accent)' }}
          >
            <Plus size={16} /> Aggiungi azione
          </button>
        ) : (
          <div className="space-y-3">
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddAction()}
              placeholder="Titolo azione"
              className="w-full rounded-lg px-3 py-2 text-sm border outline-none"
              style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            />
            <div className="grid grid-cols-2 gap-2">
              {ACTION_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setNewType(value)}
                  className="px-2 py-1.5 rounded-lg text-xs border text-left"
                  style={{
                    background: newType === value ? 'var(--accent-soft)' : 'var(--background)',
                    borderColor: newType === value ? 'var(--accent)' : 'var(--border)',
                    color: newType === value ? 'var(--accent)' : 'var(--muted)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {newType === 'next_action' && (
              <div className="flex flex-wrap gap-1.5">
                {CONTEXTS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewContext(newContext === c ? '' : c)}
                    className="px-2 py-1 rounded-full text-xs border"
                    style={{
                      background: newContext === c ? 'var(--accent-soft)' : 'var(--background)',
                      borderColor: newContext === c ? 'var(--accent)' : 'var(--border)',
                      color: newContext === c ? 'var(--accent)' : 'var(--muted)',
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
            {newType === 'scheduled' && (
              <input
                type="datetime-local"
                value={newScheduled}
                onChange={(e) => setNewScheduled(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm border outline-none"
                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />
            )}
            {newType === 'waiting_for' && (
              <input
                value={newDelegated}
                onChange={(e) => setNewDelegated(e.target.value)}
                placeholder="In attesa di…"
                className="w-full rounded-lg px-3 py-2 text-sm border outline-none"
                style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />
            )}
            <div className="flex gap-2">
              <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-sm rounded-lg border" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
                Annulla
              </button>
              <button
                onClick={handleAddAction}
                disabled={!newTitle.trim() || saving}
                className="px-3 py-1.5 text-sm rounded-lg font-medium disabled:opacity-50"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                {saving ? 'Salvo…' : 'Aggiungi'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista azioni pending */}
      {pending.length === 0 && !showAdd ? (
        <div className="py-12 text-center">
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Nessuna azione da fare — aggiungi la prima!</p>
        </div>
      ) : (
        <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {pending.map((action) => (
            <ActionRow key={action.id} action={action} onToggle={toggleComplete} />
          ))}
        </ul>
      )}

      {/* Completate collassabili */}
      {completed.length > 0 && (
        <div className="border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="w-full px-4 py-3 text-sm text-left flex items-center gap-2"
            style={{ color: 'var(--muted)' }}
          >
            <CheckCircle2 size={14} />
            {completed.length} completate {showCompleted ? '▲' : '▼'}
          </button>
          {showCompleted && (
            <ul className="divide-y opacity-60" style={{ borderColor: 'var(--border)' }}>
              {completed.map((action) => (
                <ActionRow key={action.id} action={action} onToggle={toggleComplete} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function ActionRow({ action, onToggle }: { action: ActionWithDetails; onToggle: (a: ActionWithDetails) => void }) {
  const typeColors: Record<string, string> = {
    next_action: 'var(--accent)',
    waiting_for: '#f59e0b',
    someday_maybe: '#8b5cf6',
    scheduled: '#0ea5e9',
  }
  const typeLabels: Record<string, string> = {
    next_action: 'prossima',
    waiting_for: 'in attesa',
    someday_maybe: 'prima o poi',
    scheduled: 'pianificata',
  }

  return (
    <li className="flex items-start gap-3 px-4 py-3" style={{ background: 'var(--surface)' }}>
      <button onClick={() => onToggle(action)} className="mt-0.5 shrink-0" style={{ color: action.completed ? 'var(--success)' : 'var(--border)' }}>
        {action.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)', textDecoration: action.completed ? 'line-through' : 'none', opacity: action.completed ? 0.6 : 1 }}>
          {action.title}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-1">
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: typeColors[action.type] + '20', color: typeColors[action.type] }}>
            {typeLabels[action.type]}
          </span>
          {action.context && (
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              {action.context}
            </span>
          )}
          {action.delegated_to && (
            <span className="text-xs" style={{ color: 'var(--muted)' }}>→ {action.delegated_to}</span>
          )}
          {action.scheduled_at && (
            <span className="text-xs flex items-center gap-0.5" style={{ color: 'var(--muted)' }}>
              <Calendar size={10} />
              {formatDateShort(action.scheduled_at)}
            </span>
          )}
        </div>
      </div>
    </li>
  )
}
