import { SkeletonHeader, SkeletonList } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div>
      <SkeletonHeader />
      <SkeletonList rows={4} />
    </div>
  )
}
