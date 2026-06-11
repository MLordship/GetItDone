import { redirect } from 'next/navigation'

export default function NotesRoot() {
  redirect('/notes/new')
}
