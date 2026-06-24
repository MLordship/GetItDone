'use client'

import { FileText } from 'lucide-react'

export default function NewNote() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: 'var(--muted)' }}>
      <FileText size={32} strokeWidth={1.2} />
      <p className="text-sm">Seleziona una nota o creane una nuova</p>
    </div>
  )
}
