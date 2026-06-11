'use client'

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'

export interface NoteRef { id: string; title: string }

interface Props {
  items: NoteRef[]
  command: (item: NoteRef) => void
}

export interface WikiLinkListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

const WikiLinkList = forwardRef<WikiLinkListRef, Props>(({ items, command }, ref) => {
  const [selected, setSelected] = useState(0)

  useEffect(() => setSelected(0), [items])

  useImperativeHandle(ref, () => ({
    onKeyDown({ event }) {
      if (event.key === 'ArrowUp') { setSelected((s) => Math.max(0, s - 1)); return true }
      if (event.key === 'ArrowDown') { setSelected((s) => Math.min(items.length - 1, s + 1)); return true }
      if (event.key === 'Enter') { if (items[selected]) command(items[selected]); return true }
      return false
    },
  }))

  if (!items.length) return (
    <div className="px-3 py-2 text-xs" style={{ color: 'var(--muted)' }}>Nessuna nota trovata</div>
  )

  return (
    <div className="py-1">
      {items.map((item, i) => (
        <button
          key={item.id}
          onClick={() => command(item)}
          onMouseEnter={() => setSelected(i)}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-left"
          style={{
            background: i === selected ? 'var(--accent-soft)' : 'transparent',
            color: i === selected ? 'var(--accent)' : 'var(--foreground)',
          }}
        >
          {item.title}
        </button>
      ))}
    </div>
  )
})

WikiLinkList.displayName = 'WikiLinkList'
export default WikiLinkList
