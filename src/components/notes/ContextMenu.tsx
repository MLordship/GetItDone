'use client'

import { useEffect, useRef } from 'react'

export interface ContextMenuItem {
  label: string
  icon?: React.ReactNode
  danger?: boolean
  separator?: boolean
  onClick: () => void
}

interface Props {
  items: ContextMenuItem[]
  position: { x: number; y: number }
  onClose: () => void
}

export default function ContextMenu({ items, position, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="rounded-xl border shadow-xl overflow-hidden py-1"
      style={{
        position: 'fixed',
        zIndex: 9999,
        top: position.y,
        left: position.x,
        minWidth: 168,
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      {items.map((item, i) =>
        item.separator ? (
          <div key={i} className="my-1 border-t" style={{ borderColor: 'var(--border)' }} />
        ) : (
          <button
            key={i}
            onClick={() => { item.onClick(); onClose() }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left"
            style={{
              color: item.danger ? 'var(--danger)' : 'var(--foreground)',
              background: 'transparent',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            {item.icon && (
              <span style={{ color: item.danger ? 'var(--danger)' : 'var(--muted)' }}>
                {item.icon}
              </span>
            )}
            {item.label}
          </button>
        )
      )}
    </div>
  )
}
