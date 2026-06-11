'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NewNote() {
  const router = useRouter()

  useEffect(() => {
    async function create() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('notes')
        .insert({ user_id: user.id, title: 'Senza titolo', content: '' })
        .select('id')
        .single()

      if (data) {
        router.replace(`/notes/${data.id}`)
      }
    }
    create()
  }, [router])

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)' }} />
    </div>
  )
}
