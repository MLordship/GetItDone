import PageHeader from '@/components/layout/PageHeader'
import SimpleActionList from '@/components/actions/SimpleActionList'

export default function SomedayPage() {
  return (
    <div>
      <PageHeader title="Prima o poi" />
      <SimpleActionList type="someday_maybe" emptyIcon="💡" emptyText="Nessuna idea in lista" />
    </div>
  )
}
