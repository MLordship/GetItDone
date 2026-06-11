'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Inbox, Zap, Clock, FolderKanban, Sparkles, ChevronRight, ClipboardCheck, Calendar, AlertTriangle, GitBranch } from 'lucide-react'
import { formatDateShort } from '@/lib/dateIt'

interface Stats {
  inbox: number
  nextActions: number
  waiting: number
  activeProjects: number
  someday: number
  projectsWithoutAction: number
  overdueActions: OverdueAction[]
}

interface OverdueAction {
  id: string
  title: string
  scheduled_at: string | null
}

function StatCard({ href, icon, label, count, accent, warn }: {
  href: string
  icon: React.ReactNode
  label: string
  count: number
  accent?: boolean
  warn?: boolean
}) {
  const bg = accent ? 'var(--accent)' : warn ? 'var(--danger)' : 'var(--surface)'
  const fg = accent || warn ? '#fff' : 'var(--foreground)'
  const muted = accent || warn ? 'rgba(255,255,255,0.75)' : 'var(--muted)'
  const border = accent || warn ? 'transparent' : 'var(--border)'

  return (
    <Link
      href={href}
      className="flex flex-col gap-3 p-4 rounded-2xl border transition-opacity hover:opacity-90"
      style={{ background: bg, borderColor: border }}
    >
      <div className="flex items-center justify-between">
        <div style={{ color: muted }}>{icon}</div>
        <ChevronRight size={14} style={{ color: muted }} />
      </div>
      <div>
        <p className="text-3xl font-bold leading-none" style={{ color: fg }}>{count}</p>
        <p className="text-xs mt-1.5" style={{ color: muted }}>{label}</p>
      </div>
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border p-4 space-y-3 animate-pulse" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="h-4 w-4 rounded" style={{ background: 'var(--border)' }} />
      <div>
        <div className="h-8 w-12 rounded" style={{ background: 'var(--border)' }} />
        <div className="h-3 w-20 rounded mt-2" style={{ background: 'var(--border)' }} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const now = new Date().toISOString()

      const [inbox, nextActions, waiting, projects, someday, overdue] = await Promise.all([
        supabase.from('inbox').select('id', { count: 'exact', head: true }),
        supabase.from('actions').select('id', { count: 'exact', head: true }).eq('type', 'next_action').eq('completed', false),
        supabase.from('actions').select('id', { count: 'exact', head: true }).eq('type', 'waiting_for').eq('completed', false),
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('actions').select('id', { count: 'exact', head: true }).eq('type', 'someday_maybe').eq('completed', false),
        supabase.from('actions').select('id, title, scheduled_at').eq('type', 'scheduled').eq('completed', false).lt('scheduled_at', now).order('scheduled_at'),
      ])

      const { data: activeProjectIds } = await supabase.from('projects').select('id').eq('status', 'active')
      let projectsWithoutAction = 0
      if (activeProjectIds && activeProjectIds.length > 0) {
        const counts = await Promise.all(
          activeProjectIds.map((p) =>
            supabase.from('actions').select('id', { count: 'exact', head: true }).eq('project_id', p.id).eq('type', 'next_action').eq('completed', false)
          )
        )
        projectsWithoutAction = counts.filter((r) => (r.count ?? 0) === 0).length
      }

      setStats({
        inbox: inbox.count ?? 0,
        nextActions: nextActions.count ?? 0,
        waiting: waiting.count ?? 0,
        activeProjects: projects.count ?? 0,
        someday: someday.count ?? 0,
        projectsWithoutAction,
        overdueActions: (overdue.data ?? []) as OverdueAction[],
      })
    }
    load()
  }, [])

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Buongiorno'
    if (h < 18) return 'Buon pomeriggio'
    return 'Buonasera'
  })()

  const hasAlerts = stats !== null && (stats.overdueActions.length > 0 || stats.projectsWithoutAction > 0)
  const systemClean = stats !== null && stats.inbox === 0 && stats.overdueActions.length === 0 && stats.projectsWithoutAction === 0

  return (
    <div className="px-4 md:px-6 py-6">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{greeting} 👋</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Ecco lo stato del tuo sistema GTD</p>
      </div>

      {/* Desktop: two-column layout */}
      <div className="md:grid md:grid-cols-[1fr_300px] md:gap-6">

        {/* Left: stat cards */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {stats === null ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              <>
                <StatCard href="/gtd/inbox" icon={<Inbox size={18} />} label="Da processare" count={stats.inbox} accent={stats.inbox > 0} />
                <StatCard href="/gtd/next-actions" icon={<Zap size={18} />} label="Prossime azioni" count={stats.nextActions} />
                <StatCard href="/gtd/projects" icon={<FolderKanban size={18} />} label="Progetti attivi" count={stats.activeProjects} />
                <StatCard href="/gtd/waiting" icon={<Clock size={18} />} label="In attesa" count={stats.waiting} />
                <StatCard href="/gtd/someday" icon={<Sparkles size={18} />} label="Prima o poi" count={stats.someday} />
                <StatCard href="/gtd/calendar" icon={<Calendar size={18} />} label="Calendario" count={stats.overdueActions.length} warn={stats.overdueActions.length > 0} />
              </>
            )}
          </div>

          {/* Alerts — shown below cards on mobile, hidden here on desktop */}
          {stats !== null && (
            <div className="md:hidden space-y-3">
              <AlertsPanel stats={stats} systemClean={systemClean} />
            </div>
          )}
        </div>

        {/* Right: sidebar panel — desktop only */}
        <div className="hidden md:flex flex-col gap-4">
          {stats === null ? (
            <div className="rounded-2xl border p-5 space-y-3 animate-pulse" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="h-4 w-32 rounded" style={{ background: 'var(--border)' }} />
              <div className="h-3 w-full rounded" style={{ background: 'var(--border)' }} />
              <div className="h-3 w-4/5 rounded" style={{ background: 'var(--border)' }} />
            </div>
          ) : (
            <>
              <AlertsPanel stats={stats} systemClean={systemClean} />

              {/* Quick links */}
              <div className="rounded-2xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>Accesso rapido</p>
                <div className="space-y-1">
                  {[
                    { href: '/weekly-review', icon: <ClipboardCheck size={15} />, label: 'Weekly Review' },
                    { href: '/gtd-flow', icon: <GitBranch size={15} />, label: 'Flusso GTD' },
                    { href: '/calendar', icon: <Calendar size={15} />, label: 'Calendario' },
                  ].map(({ href, icon, label }) => (
                    <Link key={href} href={href} className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--surface-hover)]" style={{ color: 'var(--foreground)' }}>
                      <span style={{ color: 'var(--muted)' }}>{icon}</span>
                      {label}
                      <ChevronRight size={12} className="ml-auto" style={{ color: 'var(--muted)' }} />
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function AlertsPanel({ stats, systemClean }: { stats: Stats; systemClean: boolean }) {
  return (
    <>
      {stats.overdueActions.length > 0 && (
        <div className="rounded-2xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--danger)' }}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} style={{ color: 'var(--danger)' }} />
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--danger)' }}>
              {stats.overdueActions.length} {stats.overdueActions.length === 1 ? 'azione scaduta' : 'azioni scadute'}
            </p>
          </div>
          <ul className="space-y-1.5">
            {stats.overdueActions.slice(0, 4).map((a) => (
              <li key={a.id} className="flex items-start gap-2">
                <span className="text-xs mt-0.5 shrink-0" style={{ color: 'var(--muted)' }}>
                  {a.scheduled_at ? formatDateShort(a.scheduled_at) : ''}
                </span>
                <span className="text-sm leading-snug" style={{ color: 'var(--foreground)' }}>{a.title}</span>
              </li>
            ))}
            {stats.overdueActions.length > 4 && (
              <li className="text-xs" style={{ color: 'var(--muted)' }}>+{stats.overdueActions.length - 4} altri</li>
            )}
          </ul>
          <Link href="/gtd/calendar" className="text-xs font-semibold" style={{ color: 'var(--danger)' }}>Vai al calendario →</Link>
        </div>
      )}

      {stats.projectsWithoutAction > 0 && (
        <div className="rounded-2xl border p-4 space-y-1" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
            {stats.projectsWithoutAction} {stats.projectsWithoutAction === 1 ? 'progetto senza prossima azione' : 'progetti senza prossima azione'}
          </p>
          <Link href="/gtd/projects" className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>Rivedi i progetti →</Link>
        </div>
      )}

      {systemClean && (
        <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--accent-soft)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>✨ Sistema in ordine!</p>
          <p className="text-xs mt-1 mb-3" style={{ color: 'var(--accent)' }}>Hai fatto la Weekly Review questa settimana?</p>
          <Link href="/gtd/weekly-review" className="inline-block text-xs font-semibold px-4 py-1.5 rounded-full" style={{ background: 'var(--accent)', color: '#fff' }}>
            Inizia la review
          </Link>
        </div>
      )}
    </>
  )
}
