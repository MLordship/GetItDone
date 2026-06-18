import Link from 'next/link'
import { CheckSquare, BookOpen } from 'lucide-react'

const apps = [
  {
    href: '/gtd',
    icon: CheckSquare,
    title: 'GetItDone',
    description: 'Gestione attività con metodologia GTD',
  },
  {
    href: '/notes',
    icon: BookOpen,
    title: 'Notes',
    description: 'Appunti in Markdown, sempre sincronizzati',
  },
]

export default function Home() {
  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center p-6 gap-10"
      style={{ background: 'var(--background)' }}
    >
      <div className="text-center space-y-1">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
          La tua suite
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Scegli dove vuoi andare
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        {apps.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col gap-4 p-6 rounded-2xl border transition-opacity hover:opacity-80"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', display: 'flex' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              <Icon size={20} />
            </div>
            <div>
              <p className="font-semibold text-base" style={{ color: 'var(--foreground)' }}>{title}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
