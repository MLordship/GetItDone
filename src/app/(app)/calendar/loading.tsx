import { SkeletonHeader } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div>
      <SkeletonHeader subtitle={false} />
      <div className="px-4 md:px-6 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-lg animate-pulse" style={{ background: 'var(--border)' }} />
          <div className="h-6 w-36 rounded animate-pulse" style={{ background: 'var(--border)' }} />
          <div className="w-8 h-8 rounded-lg animate-pulse" style={{ background: 'var(--border)' }} />
        </div>
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
          <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface-hover)' }}>
            {['Lu','Ma','Me','Gi','Ve','Sa','Do'].map((d) => (
              <div key={d} className="py-2 text-center text-xs font-medium" style={{ color: 'var(--muted)' }}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7" style={{ background: 'var(--surface)' }}>
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-12 md:h-16 border-b border-r animate-pulse" style={{ borderColor: 'var(--border)', background: i % 7 === 5 || i % 7 === 6 ? 'var(--background)' : 'var(--surface)' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
