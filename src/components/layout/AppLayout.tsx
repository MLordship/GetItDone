'use client'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  badge?: boolean
}

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Inbox,
  Zap,
  FolderKanban,
  Calendar,
  Clock,
  Sparkles,
  Settings,
  Plus,
  ClipboardCheck,
  GitBranch,
  LayoutDashboard,
  Search,
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import QuickCapture from '@/components/inbox/QuickCapture'
import { ToastProvider } from '@/components/ui/Toast'
import SearchModal from '@/components/search/SearchModal'
import ThemeToggle from '@/components/ui/ThemeToggle'

const mainNav: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inbox', label: 'Inbox', icon: Inbox, badge: true },
  { href: '/next-actions', label: 'Prossime azioni', icon: Zap },
  { href: '/projects', label: 'Progetti', icon: FolderKanban },
  { href: '/calendar', label: 'Calendario', icon: Calendar },
]

const secondaryNav: NavItem[] = [
  { href: '/waiting', label: 'In attesa', icon: Clock },
  { href: '/someday', label: 'Prima o poi', icon: Sparkles },
  { href: '/weekly-review', label: 'Weekly review', icon: ClipboardCheck },
]

const navItems = [...mainNav, ...secondaryNav]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [showCapture, setShowCapture] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [inboxCount, setInboxCount] = useState(0)

  const fetchInboxCount = useCallback(() => {
    createClient()
      .from('inbox')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => setInboxCount(count ?? 0))
  }, [])

  useEffect(() => {
    fetchInboxCount()
    window.addEventListener('inbox-updated', fetchInboxCount)
    return () => window.removeEventListener('inbox-updated', fetchInboxCount)
  }, [fetchInboxCount])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch((v) => !v)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const currentPage = navItems.find(({ href }) => pathname === href || pathname.startsWith(href + '/'))

  function NavLink({ href, label, icon: Icon, badge }: { href: string; label: string; icon: React.ElementType; badge?: boolean }) {
    const active = pathname === href || pathname.startsWith(href + '/')
    const showBadge = badge && inboxCount > 0
    return (
      <Link
        href={href}
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        style={{
          background: active ? 'var(--accent-soft)' : 'transparent',
          color: active ? 'var(--accent)' : 'var(--foreground)',
        }}
      >
        <Icon size={16} strokeWidth={active ? 2.5 : 1.75} />
        <span className="flex-1">{label}</span>
        {showBadge && (
          <span
            className="text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {inboxCount > 99 ? '99+' : inboxCount}
          </span>
        )}
      </Link>
    )
  }

  return (
    <div className="flex h-dvh overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="text-base font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>GetItDone</span>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Getting Things Done</p>
        </div>

        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          <div className="space-y-0.5">
            {mainNav.map((item) => <NavLink key={item.href} {...item} />)}
          </div>

          <div className="mt-4 pt-4 space-y-0.5 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Raccolta
            </p>
            {secondaryNav.map((item) => <NavLink key={item.href} {...item} />)}
          </div>
        </nav>

        <div className="px-3 pb-4 pt-3 space-y-1 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setShowCapture(true)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <Plus size={16} />
            Cattura rapida
          </button>
          <Link href="/gtd-flow" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors" style={{ color: 'var(--muted)' }}>
            <GitBranch size={16} strokeWidth={1.75} />
            Flusso GTD
          </Link>
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors" style={{ color: 'var(--muted)' }}>
            <Settings size={16} strokeWidth={1.75} />
            Impostazioni
          </Link>
          <div className="px-1 pt-1">
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        {/* Desktop top bar */}
        <div className="hidden md:flex items-center justify-between px-6 py-3 border-b shrink-0" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            {currentPage?.label ?? 'GetItDone'}
          </span>
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors hover:border-current"
            style={{ color: 'var(--muted)', borderColor: 'var(--border)', background: 'var(--background)' }}
          >
            <Search size={14} />
            <span>Cerca…</span>
            <kbd className="text-xs px-1.5 py-0.5 rounded ml-1" style={{ background: 'var(--border)', color: 'var(--muted)' }}>⌘K</kbd>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Mobile search bar */}
          <div className="md:hidden px-4 pt-3 pb-1">
            <button
              onClick={() => setShowSearch(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border"
              style={{ color: 'var(--muted)', borderColor: 'var(--border)', background: 'var(--surface)' }}
            >
              <Search size={15} />
              <span>Cerca…</span>
            </button>
          </div>
          <div className="md:max-w-3xl md:mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Bottom nav — mobile only */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 border-t flex items-center justify-around px-1 py-2 z-40"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {navItems.slice(0, 5).map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          const showBadge = badge && inboxCount > 0
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg min-w-0 relative"
              style={{ color: active ? 'var(--accent)' : 'var(--muted)' }}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
                {showBadge && (
                  <span
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 text-[10px] font-bold rounded-full flex items-center justify-center"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                  >
                    {inboxCount > 9 ? '9+' : inboxCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium truncate">{label}</span>
            </Link>
          )
        })}

        {/* FAB cattura rapida */}
        <button
          onClick={() => setShowCapture(true)}
          className="flex flex-col items-center justify-center w-10 h-10 rounded-full shadow-lg"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <Plus size={20} />
        </button>
      </nav>

      {showCapture && <QuickCapture onClose={() => setShowCapture(false)} />}
      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
      <ToastProvider />
    </div>
  )
}
