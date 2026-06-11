import { SkeletonList } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div>
      <div className="px-4 pt-5 pb-4 border-b space-y-2" style={{ borderColor: 'var(--border)' }}>
        <div className="h-4 w-24 rounded animate-pulse" style={{ background: 'var(--border)' }} />
        <div className="h-7 w-56 rounded animate-pulse" style={{ background: 'var(--border)' }} />
        <div className="h-4 w-32 rounded animate-pulse" style={{ background: 'var(--border)' }} />
      </div>
      <SkeletonList rows={4} />
    </div>
  )
}
