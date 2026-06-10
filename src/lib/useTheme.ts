'use client'

import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

function getSystemDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && getSystemDark())
  document.documentElement.classList.toggle('dark', dark)
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('system')

  useEffect(() => {
    const stored = (localStorage.getItem('theme') as Theme) ?? 'system'
    setThemeState(stored)
    applyTheme(stored)

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => { if (stored === 'system') applyTheme('system') }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  function setTheme(t: Theme) {
    localStorage.setItem('theme', t)
    setThemeState(t)
    applyTheme(t)
  }

  return { theme, setTheme }
}
