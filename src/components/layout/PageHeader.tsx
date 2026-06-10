interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div
      className="flex items-start justify-between px-4 pt-5 pb-4 md:px-6 md:pt-7 md:pb-5 sticky top-0 z-10 border-b"
      style={{ background: 'var(--background)', borderColor: 'var(--border)' }}
    >
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
          {title}
        </h1>
        {subtitle && subtitle.trim() && (
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{subtitle}</p>
        )}
      </div>
      {action && <div className="ml-4">{action}</div>}
    </div>
  )
}
