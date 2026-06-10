'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme, type Theme } from '@/lib/useTheme'

const options: { value: Theme; icon: React.ReactNode; label: string }[] = [
  { value: 'light', icon: <Sun size={14} />, label: 'Chiaro' },
  { value: 'system', icon: <Monitor size={14} />, label: 'Auto' },
  { value: 'dark', icon: <Moon size={14} />, label: 'Scuro' },
]

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
      {options.map(({ value, icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={label}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium transition-colors"
          style={{
            background: theme === value ? 'var(--accent)' : 'var(--background)',
            color: theme === value ? '#fff' : 'var(--muted)',
          }}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}
