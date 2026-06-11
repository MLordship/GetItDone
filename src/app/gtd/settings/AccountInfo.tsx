'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AccountInfo() {
  const [email, setEmail] = useState('')

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? '')
    })
  }, [])

  if (!email) return <div className="h-4 w-48 rounded animate-pulse" style={{ background: 'var(--border)' }} />
  return <p className="text-sm" style={{ color: 'var(--foreground)' }}>{email}</p>
}
