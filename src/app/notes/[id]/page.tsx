import NoteEditor from '@/components/notes/NoteEditor'

export default function NotePage({ params }: { params: Promise<{ id: string }> }) {
  return <NoteEditor paramsPromise={params} />
}
