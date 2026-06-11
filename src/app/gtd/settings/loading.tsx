import { SkeletonHeader, SkeletonLine } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div>
      <SkeletonHeader subtitle={false} />
      <div className="px-4 md:px-6 py-4 space-y-4 max-w-xl">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: 'var(--border)' }} />
        ))}
        <SkeletonLine width={160} height={4} />
      </div>
    </div>
  )
}
