import PageHeader from '@/components/layout/PageHeader'
import SimpleActionList from '@/components/actions/SimpleActionList'

export default function WaitingPage() {
  return (
    <div>
      <PageHeader title="In attesa" />
      <SimpleActionList type="waiting_for" emptyIcon="⏳" emptyText="Nessun elemento in attesa" showDelegatedTo />
    </div>
  )
}
