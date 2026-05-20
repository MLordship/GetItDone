'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Trash2 } from 'lucide-react'
import type { Action } from '@/types/database'
import { toast } from '@/components/ui/Toast'
import DateTimePicker from '@/components/ui/DateTimePicker'

interface Props {
  action: Action
  onSave: (updated: Partial<Action>) => void
  onDelete: (id: string) => void
  onClose: () => void
}

const CONTEXTS = ['@casa', '@lavoro', '@telefono', '@computer', '@commissioni', '@lettura']

export default function ActionEditModal({ action, onSave, onDelete, onClose }: Props) {
  const [title, setTitle] = useState(action.title)
  const [notes, setNotes] = useState(action.notes ?? '')
  const [context, setContext] = useState(action.context ?? '')
  const [delegatedTo, setDelegatedTo] = useState(action.delegated_to ?? '')
  const [scheduledAt, setScheduledAt] = useState(() => {
    if (!action.scheduled_at) return ''
    const d = new Date(action.scheduled_at)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    const updates: Partial<Action> = {
      title: title.trim(),
      notes: notes.trim() || null,
    }
    if (action.type === 'next_action') updates.context = context || null
    if (action.type === 'waiting_for') updates.delegated_to = delegatedTo.trim() || null
    if (action.type === 'scheduled') updates.scheduled_at = scheduledAt ? new Date(scheduledAt).toISOString() : null

    await createClient().from('actions').update(updates).eq('id', action.id)
    onSave(updates)
    toast('Modificato')
    onClose()
  }

  async function handleDelete() {
    await createClient().from('actions').delete().eq('id', action.id)
    onDelete(action.id)
    toast('Azione eliminata')
    onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl p-5 space-y-4"
        style={{ background: 'var(--surface)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Modifica azione</h2>
          <button onClick={onClose} style={{ color: 'var(--muted)' }}><X size={18} /></button>
        </div>

        <div className="space-y-3" onKeyDown={handleKeyDown}>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titolo"
            className="w-full rounded-xl px-3 py-2.5 text-sm border outline-none font-medium"
            style={{ background: 'var(--background)', borderColor: 'var(--accent)', color: 'var(--foreground)' }}
          />

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Note (opzionale)"
            rows={3}
            className="w-full rounded-xl px-3 py-2.5 text-sm border outline-none resize-none"
            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />

          {action.type === 'next_action' && (
            <div>
              <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Contesto</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setContext('')}
                  className="px-3 py-1.5 rounded-full text-xs border"
                  style={{
                    background: !context ? 'var(--foreground)' : 'var(--background)',
                    borderColor: !context ? 'var(--foreground)' : 'var(--border)',
                    color: !context ? '#fff' : 'var(--muted)',
                  }}
                >
                  Nessuno
                </button>
                {CONTEXTS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setContext(c)}
                    className="px-3 py-1.5 rounded-full text-xs border"
                    style={{
                      background: context === c ? 'var(--accent)' : 'var(--background)',
                      borderColor: context === c ? 'var(--accent)' : 'var(--border)',
                      color: context === c ? '#fff' : 'var(--muted)',
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {action.type === 'waiting_for' && (
            <input
              value={delegatedTo}
              onChange={(e) => setDelegatedTo(e.target.value)}
              placeholder="Delegato a (opzionale)"
              className="w-full rounded-xl px-3 py-2.5 text-sm border outline-none"
              style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            />
          )}

          {action.type === 'scheduled' && (
            <div>
              <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Data e ora</p>
              <DateTimePicker value={scheduledAt} onChange={setScheduledAt} />
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          {confirmDelete ? (
            <>
              <span className="flex-1 text-xs self-center" style={{ color: 'var(--muted)' }}>Eliminare definitivamente?</span>
              <button onClick={() => setConfirmDelete(false)} className="px-3 py-2 rounded-xl text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>No</button>
              <button onClick={handleDelete} className="px-3 py-2 rounded-xl text-sm font-medium" style={{ background: 'var(--danger)', color: '#fff' }}>Elimina</button>
            </>
          ) : (
            <>
              <button onClick={() => setConfirmDelete(true)} className="p-2 rounded-xl border" style={{ borderColor: 'var(--border)', color: 'var(--danger)' }} title="Elimina">
                <Trash2 size={15} />
              </button>
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>Annulla</button>
              <button onClick={handleSave} disabled={!title.trim() || saving} className="flex-1 py-2 rounded-xl text-sm font-medium disabled:opacity-50" style={{ background: 'var(--accent)', color: '#fff' }}>
                Salva
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
