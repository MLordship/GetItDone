'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2, ArrowRight, Pencil } from 'lucide-react'
import type { InboxItem } from '@/types/database'
import { formatDateTimeShort } from '@/lib/dateIt'
import ProcessModal from './ProcessModal'
import { SkeletonList } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/Toast'

function InboxItemRow({
  item,
  onDelete,
  onProcess,
  onUpdate,
}: {
  item: InboxItem
  onDelete: (id: string) => void
  onProcess: (item: InboxItem) => void
  onUpdate: (id: string, title: string, notes: string | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(item.title)
  const [notes, setNotes] = useState(item.notes ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  async function handleSave() {
    if (!title.trim()) return
    if (title === item.title && notes === (item.notes ?? '')) {
      setEditing(false)
      return
    }
    await createClient()
      .from('inbox')
      .update({ title: title.trim(), notes: notes.trim() || null })
      .eq('id', item.id)
    onUpdate(item.id, title.trim(), notes.trim() || null)
    setEditing(false)
    toast('Modificato')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave()
    if (e.key === 'Escape') {
      setTitle(item.title)
      setNotes(item.notes ?? '')
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <li className="px-4 py-3 space-y-2" style={{ background: 'var(--surface)' }}>
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full rounded-lg px-3 py-2 text-sm border outline-none font-medium"
          style={{ background: 'var(--background)', borderColor: 'var(--accent)', color: 'var(--foreground)' }}
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Note (opzionale)"
          rows={2}
          className="w-full rounded-lg px-3 py-2 text-sm border outline-none resize-none"
          style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
        />
        <div className="flex gap-2">
          <button
            onClick={() => { setTitle(item.title); setNotes(item.notes ?? ''); setEditing(false) }}
            className="px-3 py-1.5 text-xs rounded-lg border"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="px-3 py-1.5 text-xs rounded-lg font-medium disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            Salva
          </button>
        </div>
      </li>
    )
  }

  return (
    <li className="flex items-start gap-3 px-4 py-3 group border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{item.title}</p>
        {item.notes && (
          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--muted)' }}>{item.notes}</p>
        )}
        <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
          {formatDateTimeShort(item.created_at)}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: 'var(--muted)' }}
          title="Modifica"
        >
          <Pencil size={14} />
        </button>
        <button onClick={() => onProcess(item)} className="p-2 rounded-lg" style={{ color: 'var(--accent)' }} title="Processa">
          <ArrowRight size={16} />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: 'var(--danger)' }}
          title="Elimina"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </li>
  )
}

export default function InboxList() {
  const [items, setItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<InboxItem | null>(null)

  function fetchItems() {
    createClient()
      .from('inbox')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setItems(data ?? [])
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchItems()
    window.addEventListener('inbox-updated', fetchItems)
    return () => window.removeEventListener('inbox-updated', fetchItems)
  }, [])

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    await createClient().from('inbox').delete().eq('id', id)
    toast('Elemento eliminato')
  }

  function handleUpdate(id: string, title: string, notes: string | null) {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, title, notes } : i))
  }

  function handleProcessed(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    setProcessing(null)
  }

  if (loading) return <SkeletonList rows={7} />

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="text-4xl mb-3">✨</div>
        <p className="font-medium" style={{ color: 'var(--foreground)' }}>Inbox vuota</p>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Usa il pulsante + per catturare nuove idee</p>
      </div>
    )
  }

  return (
    <>
      <p className="px-4 pt-3 pb-1 text-sm" style={{ color: 'var(--muted)' }}>
        {items.length} {items.length === 1 ? 'elemento' : 'elementi'} · tocca per modificare
      </p>
      <ul>
        {items.map((item) => (
          <InboxItemRow
            key={item.id}
            item={item}
            onDelete={handleDelete}
            onProcess={setProcessing}
            onUpdate={handleUpdate}
          />
        ))}
      </ul>

      {processing && (
        <ProcessModal
          item={processing}
          onDone={() => handleProcessed(processing.id)}
          onClose={() => setProcessing(null)}
        />
      )}
    </>
  )
}
