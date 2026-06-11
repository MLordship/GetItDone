import { SkeletonHeader, SkeletonList } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div>
      <SkeletonHeader />
      <div className="px-4 py-3 border-b flex gap-2" style={{ borderColor: 'var(--border)' }}>
        {[80, 70, 90, 75, 85].map((w, i) => (
          <div key={i} className="h-7 rounded-full animate-pulse" style={{ width: w, background: 'var(--border)' }} />
        ))}
      </div>
      <SkeletonList rows={6} />
    </div>
  )
}
