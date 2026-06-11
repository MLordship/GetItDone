import PageHeader from '@/components/layout/PageHeader'
import ProjectDetail from './ProjectDetail'

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div>
      <ProjectDetail params={params} />
    </div>
  )
}
