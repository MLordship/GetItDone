'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { InboxItem, ActionType, Area } from '@/types/database'
import DateTimePicker from '@/components/ui/DateTimePicker'

const ACTION_TYPES: { value: ActionType; label: string }[] = [
  { value: 'next_action', label: 'Azione prossima' },
  { value: 'scheduled', label: 'Pianificata (calendario)' },
  { value: 'waiting_for', label: 'In attesa di…' },
  { value: 'someday_maybe', label: 'Prima o poi' },
]

const CONTEXTS = ['@casa', '@lavoro', '@telefono', '@computer', '@commissioni', '@lettura']

interface ProcessModalProps {
  item: InboxItem
  onDone: () => void
  onClose: () => void
}

export default function ProcessModal({ item, onDone, onClose }: ProcessModalProps) {
  const [type, setType] = useState<ActionType>('next_action')
  const [context, setContext] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [delegatedTo, setDelegatedTo] = useState('')
  const [areaId, setAreaId] = useState('')
  const [areas, setAreas] = useState<Area[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    createClient().from('areas').select('*').order('name').then(({ data }) => {
      if (data) setAreas(data)
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('actions').insert({
      user_id: user.id,
      title: item.title,
      notes: item.notes,
      type,
      context: context || null,
      scheduled_at: scheduledAt || null,
      delegated_to: delegatedTo || null,
      area_id: areaId || null,
    })

    await supabase.from('inbox').delete().eq('id', item.id)
    onDone()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-xl p-5 space-y-4"
        style={{ background: 'var(--surface)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold" style={{ color: 'var(--foreground)' }}>Processa</h2>
          <button onClick={onClose} style={{ color: 'var(--muted)' }}><X size={18} /></button>
        </div>

        <p className="text-sm font-medium p-3 rounded-lg" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
          {item.title}
        </p>

        {/* Tipo */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Tipo</label>
          <div className="grid grid-cols-2 gap-2">
            {ACTION_TYPES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setType(value)}
                className="px-3 py-2 rounded-lg text-sm text-left transition-colors border"
                style={{
                  background: type === value ? 'var(--accent-soft)' : 'var(--background)',
                  borderColor: type === value ? 'var(--accent)' : 'var(--border)',
                  color: type === value ? 'var(--accent)' : 'var(--foreground)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Area */}
        {areas.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Area</label>
            <select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm border outline-none"
              style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              <option value="">Nessuna area</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        )}

        {/* Contesto (solo next_action) */}
        {type === 'next_action' && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Contesto</label>
            <div className="flex flex-wrap gap-2">
              {CONTEXTS.map((c) => (
                <button
                  key={c}
                  onClick={() => setContext(context === c ? '' : c)}
                  className="px-2.5 py-1 rounded-full text-xs border transition-colors"
                  style={{
                    background: context === c ? 'var(--accent-soft)' : 'var(--background)',
                    borderColor: context === c ? 'var(--accent)' : 'var(--border)',
                    color: context === c ? 'var(--accent)' : 'var(--muted)',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Data (solo scheduled) */}
        {type === 'scheduled' && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Data e ora</label>
            <DateTimePicker value={scheduledAt} onChange={setScheduledAt} />
          </div>
        )}

        {/* Delegato a (solo waiting_for) */}
        {type === 'waiting_for' && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>In attesa di</label>
            <input
              type="text"
              value={delegatedTo}
              onChange={(e) => setDelegatedTo(e.target.value)}
              placeholder="Nome persona o servizio"
              className="w-full rounded-lg px-3 py-2 text-sm border outline-none"
              style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            />
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {saving ? 'Salvo…' : 'Sposta'}
          </button>
        </div>
      </div>
    </div>
  )
}
