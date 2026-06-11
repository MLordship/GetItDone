'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2 } from 'lucide-react'
import type { Area } from '@/types/database'
import { SkeletonList } from '@/components/ui/Skeleton'

const PRESET_COLORS = ['#4f46e5', '#0ea5e9', '#16a34a', '#ea580c', '#dc2626', '#9333ea', '#0891b2', '#65a30d']

export default function AreasManager() {
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    createClient().from('areas').select('*').order('name').then(({ data }) => {
      setAreas(data ?? [])
      setLoading(false)
    })
  }, [])

  async function handleAdd() {
    if (!newName.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('areas')
      .insert({ user_id: user.id, name: newName.trim(), color: newColor })
      .select()
      .single()
    if (data) setAreas((prev) => [...prev, data])
    setNewName('')
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await createClient().from('areas').delete().eq('id', id)
    setAreas((prev) => prev.filter((a) => a.id !== id))
  }

  if (loading) return <SkeletonList rows={3} />

  return (
    <div className="space-y-3">
      {areas.map((area) => (
        <div key={area.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="w-4 h-4 rounded-full shrink-0" style={{ background: area.color }} />
          <span className="flex-1 text-sm font-medium" style={{ color: 'var(--foreground)' }}>{area.name}</span>
          <button onClick={() => handleDelete(area.id)} style={{ color: 'var(--border)' }}>
            <Trash2 size={15} />
          </button>
        </div>
      ))}

      <div className="flex gap-1.5 flex-wrap pt-1">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setNewColor(c)}
            className="w-6 h-6 rounded-full border-2 transition-transform"
            style={{
              background: c,
              borderColor: newColor === c ? 'var(--foreground)' : 'transparent',
              transform: newColor === c ? 'scale(1.15)' : 'scale(1)',
            }}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Nome area (es. Lavoro)"
          className="flex-1 rounded-lg px-3 py-2 text-sm border outline-none"
          style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
        />
        <button
          onClick={handleAdd}
          disabled={!newName.trim() || saving}
          className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <Plus size={15} />
          Aggiungi
        </button>
      </div>
    </div>
  )
}
