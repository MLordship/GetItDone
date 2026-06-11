'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Circle, ChevronRight, ChevronLeft, Inbox, Zap, FolderKanban, Clock, Sparkles, Calendar, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import type { Action, Project } from '@/types/database'
import { formatWeekdayDateShort } from '@/lib/dateIt'

interface ReviewData {
  inboxCount: number
  nextActionsCount: number
  waitingCount: number
  somedayCount: number
  activeProjects: (Project & { areas?: { name: string; color: string } | null; nextActionsCount: number })[]
  projectsWithoutNextAction: string[]
  upcomingScheduled: Action[]
}

interface Step {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  content: (data: ReviewData, checked: Set<string>, toggle: (k: string) => void) => React.ReactNode
}

function CheckItem({ id, label, checked, toggle, sublabel }: { id: string; label: string; checked: boolean; toggle: (k: string) => void; sublabel?: string }) {
  return (
    <button
      onClick={() => toggle(id)}
      className="flex items-start gap-3 w-full text-left py-2.5 px-3 rounded-xl transition-colors"
      style={{ background: checked ? 'var(--accent-soft)' : 'var(--background)' }}
    >
      <div className="mt-0.5 shrink-0" style={{ color: checked ? 'var(--accent)' : 'var(--border)' }}>
        {checked ? <CheckCircle2 size={18} /> : <Circle size={18} />}
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: checked ? 'var(--accent)' : 'var(--foreground)', textDecoration: checked ? 'line-through' : 'none', opacity: checked ? 0.7 : 1 }}>
          {label}
        </p>
        {sublabel && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{sublabel}</p>}
      </div>
    </button>
  )
}

function SectionCard({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="rounded-xl border p-4 space-y-2" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      {title && <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>{title}</p>}
      {children}
    </div>
  )
}

const STEPS: Step[] = [
  {
    id: 'raccolta',
    title: 'Raccolta',
    description: 'Raccogli tutto quello che hai in sospeso fuori dal sistema',
    icon: <Inbox size={20} />,
    content: (data, checked, toggle) => (
      <div className="space-y-3">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Prima di tutto, cattura tutto quello che non è ancora nel sistema. Passa in rassegna desk, tasche, appunti fisici, email.
        </p>
        <SectionCard>
          <CheckItem id="desk" label="Svuotato la scrivania e raccolta posta fisica" checked={checked.has('desk')} toggle={toggle} />
          <CheckItem id="email" label="Processato le email in arrivo" checked={checked.has('email')} toggle={toggle} />
          <CheckItem id="notes" label="Raccolto appunti sparsi (carta, telefono, blocco)" checked={checked.has('notes')} toggle={toggle} />
          <CheckItem id="mind" label="Fatto un mind sweep — cosa mi gira in testa?" checked={checked.has('mind')} toggle={toggle} sublabel="Cattura tutto nell'inbox prima di continuare" />
        </SectionCard>
        {data.inboxCount > 0 && (
          <Link href="/gtd/inbox" className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: 'var(--accent)', background: 'var(--accent-soft)' }}>
            <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
              {data.inboxCount} elementi nell&apos;inbox da processare
            </span>
            <ChevronRight size={16} style={{ color: 'var(--accent)' }} />
          </Link>
        )}
      </div>
    ),
  },
  {
    id: 'inbox',
    title: 'Svuota inbox',
    description: 'Porta l\'inbox a zero processando ogni elemento',
    icon: <Inbox size={20} />,
    content: (data, checked, toggle) => (
      <div className="space-y-3">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Per ogni elemento dell&apos;inbox: è qualcosa che richiede un&apos;azione? Se sì, mettila nella lista giusta. Se no, elimina o archivia.
        </p>
        {data.inboxCount === 0 ? (
          <SectionCard>
            <div className="text-center py-4">
              <div className="text-2xl mb-2">✨</div>
              <p className="text-sm font-medium" style={{ color: 'var(--success)' }}>Inbox a zero!</p>
            </div>
          </SectionCard>
        ) : (
          <Link href="/gtd/inbox" className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: 'var(--accent)', background: 'var(--accent-soft)' }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>Vai all&apos;inbox</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{data.inboxCount} elementi da processare</p>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--accent)' }} />
          </Link>
        )}
        <SectionCard>
          <CheckItem id="inbox-zero" label="Inbox portata a zero" checked={checked.has('inbox-zero')} toggle={toggle} />
        </SectionCard>
      </div>
    ),
  },
  {
    id: 'progetti',
    title: 'Rivedi i progetti',
    description: 'Ogni progetto deve avere almeno una prossima azione',
    icon: <FolderKanban size={20} />,
    content: (data, checked, toggle) => (
      <div className="space-y-3">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Rivedi ogni progetto attivo. Ognuno deve avere almeno una prossima azione concreta associata.
        </p>
        {data.projectsWithoutNextAction.length > 0 && (
          <SectionCard title="⚠️ Progetti senza prossima azione">
            {data.projectsWithoutNextAction.map((name, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--danger)' }} />
                <span className="text-sm" style={{ color: 'var(--foreground)' }}>{name}</span>
              </div>
            ))}
          </SectionCard>
        )}
        {data.activeProjects.length > 0 && (
          <SectionCard title="Progetti attivi">
            {data.activeProjects.map((p) => (
              <Link key={p.id} href={`/gtd/projects/${p.id}`} className="flex items-center justify-between py-2 group">
                <div className="flex items-center gap-2">
                  {p.areas && <div className="w-2 h-2 rounded-full" style={{ background: p.areas.color }} />}
                  <span className="text-sm" style={{ color: 'var(--foreground)' }}>{p.title}</span>
                </div>
                <span className="text-xs" style={{ color: p.nextActionsCount === 0 ? 'var(--danger)' : 'var(--muted)' }}>
                  {p.nextActionsCount} azioni
                </span>
              </Link>
            ))}
          </SectionCard>
        )}
        <SectionCard>
          <CheckItem id="projects-reviewed" label="Tutti i progetti revisionati" checked={checked.has('projects-reviewed')} toggle={toggle} />
          <CheckItem id="projects-actions" label="Ogni progetto ha almeno una prossima azione" checked={checked.has('projects-actions')} toggle={toggle} />
        </SectionCard>
      </div>
    ),
  },
  {
    id: 'next-actions',
    title: 'Prossime azioni',
    description: 'Rivedi e aggiorna la lista delle azioni prossime',
    icon: <Zap size={20} />,
    content: (data, checked, toggle) => (
      <div className="space-y-3">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Scorri la lista delle prossime azioni. Elimina quelle non più rilevanti, aggiungi contesti mancanti.
        </p>
        <Link href="/gtd/next-actions" className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <span className="text-sm" style={{ color: 'var(--foreground)' }}>{data.nextActionsCount} prossime azioni attive</span>
          <ChevronRight size={16} style={{ color: 'var(--muted)' }} />
        </Link>
        <SectionCard>
          <CheckItem id="na-reviewed" label="Prossime azioni revisionate" checked={checked.has('na-reviewed')} toggle={toggle} />
          <CheckItem id="na-contexts" label="Tutti i contesti sono corretti" checked={checked.has('na-contexts')} toggle={toggle} />
        </SectionCard>
      </div>
    ),
  },
  {
    id: 'calendario',
    title: 'Calendario',
    description: 'Guarda la settimana passata e quella futura',
    icon: <Calendar size={20} />,
    content: (data, checked, toggle) => (
      <div className="space-y-3">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Rivedi la settimana appena conclusa: ci sono azioni rimaste in sospeso? Guarda quella futura: ci sono scadenze o impegni da preparare?
        </p>
        {data.upcomingScheduled.length > 0 && (
          <SectionCard title="Prossimi 7 giorni">
            {data.upcomingScheduled.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-1.5">
                <span className="text-sm" style={{ color: 'var(--foreground)' }}>{a.title}</span>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  {a.scheduled_at ? formatWeekdayDateShort(a.scheduled_at) : ''}
                </span>
              </div>
            ))}
          </SectionCard>
        )}
        <SectionCard>
          <CheckItem id="cal-past" label="Rivista la settimana passata" checked={checked.has('cal-past')} toggle={toggle} />
          <CheckItem id="cal-future" label="Rivista la settimana futura" checked={checked.has('cal-future')} toggle={toggle} />
          <CheckItem id="cal-month" label="Controllato le prossime 2-3 settimane" checked={checked.has('cal-month')} toggle={toggle} />
        </SectionCard>
      </div>
    ),
  },
  {
    id: 'waiting',
    title: 'In attesa',
    description: 'Verifica cosa stai aspettando dagli altri',
    icon: <Clock size={20} />,
    content: (data, checked, toggle) => (
      <div className="space-y-3">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Per ogni elemento in attesa: è ancora rilevante? Devi fare un sollecito? Qualcosa si è sbloccato?
        </p>
        <Link href="/gtd/waiting" className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <span className="text-sm" style={{ color: 'var(--foreground)' }}>{data.waitingCount} elementi in attesa</span>
          <ChevronRight size={16} style={{ color: 'var(--muted)' }} />
        </Link>
        <SectionCard>
          <CheckItem id="waiting-reviewed" label="Lista 'In attesa' revisionata" checked={checked.has('waiting-reviewed')} toggle={toggle} />
          <CheckItem id="waiting-followup" label="Inviati eventuali solleciti necessari" checked={checked.has('waiting-followup')} toggle={toggle} />
        </SectionCard>
      </div>
    ),
  },
  {
    id: 'someday',
    title: 'Prima o poi',
    description: 'Rivedi le idee in standby',
    icon: <Sparkles size={20} />,
    content: (data, checked, toggle) => (
      <div className="space-y-3">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Qualcosa è diventato rilevante ora? Qualcosa è da eliminare perché non ti interessa più?
        </p>
        <Link href="/gtd/someday" className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <span className="text-sm" style={{ color: 'var(--foreground)' }}>{data.somedayCount} idee in lista</span>
          <ChevronRight size={16} style={{ color: 'var(--muted)' }} />
        </Link>
        <SectionCard>
          <CheckItem id="someday-reviewed" label="Lista 'Prima o poi' revisionata" checked={checked.has('someday-reviewed')} toggle={toggle} />
          <CheckItem id="someday-activated" label="Attivato quello che è diventato rilevante" checked={checked.has('someday-activated')} toggle={toggle} />
        </SectionCard>
      </div>
    ),
  },
]

export default function WeeklyReview() {
  const [step, setStep] = useState(0)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [data, setData] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const now = new Date()
      const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

      const [inbox, nextActions, waiting, someday, projects, scheduled] = await Promise.all([
        supabase.from('inbox').select('id', { count: 'exact', head: true }),
        supabase.from('actions').select('id', { count: 'exact', head: true }).eq('type', 'next_action').eq('completed', false),
        supabase.from('actions').select('id', { count: 'exact', head: true }).eq('type', 'waiting_for').eq('completed', false),
        supabase.from('actions').select('id', { count: 'exact', head: true }).eq('type', 'someday_maybe').eq('completed', false),
        supabase.from('projects').select('*, areas(name, color)').eq('status', 'active'),
        supabase.from('actions').select('*').eq('type', 'scheduled').eq('completed', false).gte('scheduled_at', now.toISOString()).lte('scheduled_at', in7days).order('scheduled_at'),
      ])

      const activeProjects = await Promise.all(
        (projects.data ?? []).map(async (p) => {
          const { count } = await supabase
            .from('actions')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', p.id)
            .eq('type', 'next_action')
            .eq('completed', false)
          return { ...p, nextActionsCount: count ?? 0 }
        })
      )

      setData({
        inboxCount: inbox.count ?? 0,
        nextActionsCount: nextActions.count ?? 0,
        waitingCount: waiting.count ?? 0,
        somedayCount: someday.count ?? 0,
        activeProjects,
        projectsWithoutNextAction: activeProjects.filter((p) => p.nextActionsCount === 0).map((p) => p.title),
        upcomingScheduled: scheduled.data ?? [],
      })
      setLoading(false)
    }
    load()
  }, [])

  function toggle(key: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const currentStep = STEPS[step]
  const progress = Math.round((step / STEPS.length) * 100)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-center space-y-3">
          <RefreshCw size={32} className="animate-spin mx-auto" style={{ color: 'var(--accent)' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Carico i dati…</p>
        </div>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="flex items-center justify-center min-h-dvh px-4">
        <div className="text-center space-y-6 max-w-sm">
          <div className="text-6xl">🎉</div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Review completata!</h1>
            <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
              Il tuo sistema GTD è aggiornato. Goditi la prossima settimana con la mente libera.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Prossime azioni', value: data!.nextActionsCount },
              { label: 'Progetti attivi', value: data!.activeProjects.length },
              { label: 'In attesa', value: data!.waitingCount },
              { label: 'Prima o poi', value: data!.somedayCount },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl p-3 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>{value}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{label}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setStep(0); setChecked(new Set()); setCompleted(false) }}
              className="flex-1 py-2.5 rounded-xl text-sm border"
              style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
            >
              Ricomincia
            </button>
            <Link href="/gtd/inbox" className="flex-1 py-2.5 rounded-xl text-sm font-medium text-center" style={{ background: 'var(--accent)', color: '#fff' }}>
              Vai all&apos;inbox
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Weekly Review</h1>
          <span className="text-sm" style={{ color: 'var(--muted)' }}>{step + 1} / {STEPS.length}</span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: 'var(--accent)' }}
          />
        </div>
        {/* Step indicators */}
        <div className="flex gap-1 mt-2">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setStep(i)}
              className="flex-1 h-1 rounded-full transition-colors"
              style={{ background: i <= step ? 'var(--accent)' : 'var(--border)' }}
            />
          ))}
        </div>
      </div>

      {/* Step card */}
      <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            {currentStep.icon}
          </div>
          <div>
            <h2 className="font-semibold" style={{ color: 'var(--foreground)' }}>{currentStep.title}</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{currentStep.description}</p>
          </div>
        </div>
        <div>{data && currentStep.content(data, checked, toggle)}</div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm border"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            <ChevronLeft size={16} /> Indietro
          </button>
        )}
        <button
          onClick={() => step < STEPS.length - 1 ? setStep(step + 1) : setCompleted(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          {step < STEPS.length - 1 ? (
            <><span>Avanti</span><ChevronRight size={16} /></>
          ) : (
            <><CheckCircle2 size={16} /><span>Completa review</span></>
          )}
        </button>
      </div>
    </div>
  )
}
