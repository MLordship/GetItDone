import { SkeletonHeader, SkeletonList } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div>
      <SkeletonHeader />
      <SkeletonList rows={7} />
    </div>
  )
}
