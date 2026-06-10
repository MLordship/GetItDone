import PageHeader from '@/components/layout/PageHeader'
import AreasManager from './AreasManager'
import LogoutButton from './LogoutButton'
import AccountInfo from './AccountInfo'
import ThemeToggle from '@/components/ui/ThemeToggle'

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Impostazioni" />
      <div className="px-4 md:px-6 py-4 space-y-6 max-w-xl">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
            Tema
          </h2>
          <ThemeToggle />
        </section>

        <section className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
            Aree di responsabilità
          </h2>
          <AreasManager />
        </section>

        <section className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Account</h2>
          <AccountInfo />
          <LogoutButton />
        </section>
      </div>
    </div>
  )
}
