import PageHeader from '@/components/layout/PageHeader'
import CalendarView from './CalendarView'

export default function CalendarPage() {
  return (
    <div>
      <PageHeader title="Calendario" subtitle="Azioni pianificate" />
      <CalendarView />
    </div>
  )
}
