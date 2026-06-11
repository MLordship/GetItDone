'use client'

import Link from 'next/link'

type BoxVariant = 'input' | 'decision' | 'action' | 'destination' | 'note'

function FlowBox({ children, variant = 'action' }: { children: React.ReactNode; variant?: BoxVariant }) {
  const styles: Record<BoxVariant, React.CSSProperties> = {
    input:       { background: 'var(--accent)',      color: '#fff',              borderColor: 'var(--accent)' },
    decision:    { background: 'var(--accent-soft)', color: 'var(--accent)',     borderColor: 'var(--accent)', fontWeight: 600 },
    action:      { background: 'var(--surface)',     color: 'var(--foreground)', borderColor: 'var(--border)' },
    destination: { background: 'var(--background)',  color: 'var(--muted)',      borderColor: 'var(--border)' },
    note:        { background: 'transparent',        color: 'var(--muted)',      borderColor: 'transparent' },
  }
  const shape = variant === 'decision' ? 'rounded-2xl' : 'rounded-xl'
  return (
    <div
      className={`border px-4 py-2.5 text-sm text-center leading-snug ${shape}`}
      style={styles[variant]}
    >
      {children}
    </div>
  )
}

function Arrow({ label, color }: { label?: string; color?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 my-0.5">
      <div className="w-px h-4" style={{ background: 'var(--border)' }} />
      {label && (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: color ?? 'var(--muted)', background: color ? color + '18' : 'var(--background)' }}>
          {label}
        </span>
      )}
    </div>
  )
}

function Branch({ left, right }: {
  left: { label: string; color: string; children: React.ReactNode }
  right: { label: string; color: string; children: React.ReactNode }
}) {
  return (
    <div className="w-full flex gap-3 my-1">
      {/* Left branch */}
      <div className="flex-1 flex flex-col items-center gap-1">
        <div className="w-px h-3" style={{ background: 'var(--border)' }} />
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: left.color, background: left.color + '18' }}>{left.label}</span>
        {left.children}
      </div>
      {/* Divider */}
      <div className="w-px self-stretch" style={{ background: 'var(--border)' }} />
      {/* Right branch */}
      <div className="flex-1 flex flex-col items-center gap-1">
        <div className="w-px h-3" style={{ background: 'var(--border)' }} />
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: right.color, background: right.color + '18' }}>{right.label}</span>
        {right.children}
      </div>
    </div>
  )
}

export default function GtdFlowPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Flusso GTD</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Come decidere cosa fare con ogni cosa che catturi</p>
      </div>

      <div className="flex flex-col items-center">

        {/* Step 1: Capture */}
        <FlowBox variant="input">📥 Cattura nell&apos;Inbox</FlowBox>
        <Arrow label="Chiediti:" />

        {/* Q1: Actionable? */}
        <FlowBox variant="decision">È qualcosa che richiede un&apos;azione?</FlowBox>

        <Branch
          left={{ label: 'NO', color: 'var(--muted)' as string, children: (
            <div className="flex flex-col gap-2 w-full">
              <FlowBox variant="destination">🗑 Elimina</FlowBox>
              <FlowBox variant="destination">📦 Archivio<br /><span style={{ fontSize: 11 }}>riferimento futuro</span></FlowBox>
              <FlowBox variant="destination">💡 Prima o poi<br /><span style={{ fontSize: 11 }}>forse un giorno</span></FlowBox>
            </div>
          )}}
          right={{ label: 'SÌ', color: '#16a34a', children: (
            <div className="flex flex-col items-center gap-1 w-full">
              <FlowBox variant="note">Qual è la prossima azione concreta?</FlowBox>

              {/* Q2: 2 min rule */}
              <FlowBox variant="decision">Richiede meno di 2 minuti?</FlowBox>

              <Branch
                left={{ label: 'SÌ', color: '#16a34a', children: (
                  <FlowBox variant="action">✅ Fallo subito!</FlowBox>
                )}}
                right={{ label: 'NO', color: 'var(--muted)' as string, children: (
                  <div className="flex flex-col items-center gap-1 w-full">
                    {/* Q3: Delegate? */}
                    <FlowBox variant="decision">Devi farlo tu?</FlowBox>

                    <Branch
                      left={{ label: 'NO', color: 'var(--muted)' as string, children: (
                        <FlowBox variant="destination">👤 Delega<br /><span style={{ fontSize: 11 }}>→ In attesa</span></FlowBox>
                      )}}
                      right={{ label: 'SÌ', color: '#16a34a', children: (
                        <div className="flex flex-col items-center gap-1 w-full">
                          {/* Q4: Date? */}
                          <FlowBox variant="decision">Ha una data precisa?</FlowBox>

                          <Branch
                            left={{ label: 'SÌ', color: '#16a34a', children: (
                              <FlowBox variant="destination">📅 Calendario</FlowBox>
                            )}}
                            right={{ label: 'NO', color: 'var(--muted)' as string, children: (
                              <FlowBox variant="destination">⚡ Prossime azioni</FlowBox>
                            )}}
                          />
                        </div>
                      )}}
                    />
                  </div>
                )}}
              />
            </div>
          )}}
        />

        {/* Multi-step note */}
        <div className="mt-6 w-full rounded-2xl border p-4 space-y-2" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Se richiede più di un passo</p>
          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
            📁 Crea un <strong>Progetto</strong>, poi definisci la prima azione concreta e mettila nelle <em>Prossime azioni</em>.
          </p>
        </div>

        {/* Weekly review */}
        <div className="mt-4 w-full rounded-2xl border p-4" style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent)' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--accent)' }}>🔄 Weekly Review — ogni settimana</p>
          <p className="text-xs" style={{ color: 'var(--foreground)' }}>
            Inbox a zero · ogni progetto con almeno una prossima azione · prossime azioni aggiornate · in attesa verificata.
          </p>
          <Link href="/gtd/weekly-review" className="inline-block mt-2 text-xs font-semibold" style={{ color: 'var(--accent)' }}>
            Vai alla Review →
          </Link>
        </div>

      </div>
    </div>
  )
}
