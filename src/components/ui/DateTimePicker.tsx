'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const MONTHS = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
const DAYS = ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

// Monday-first: Mon=0 … Sun=6
function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

function pad(n: number) { return String(n).padStart(2, '0') }

interface Props {
  value: string // ISO datetime local: "YYYY-MM-DDTHH:mm"
  onChange: (val: string) => void
}

export default function DateTimePicker({ value, onChange }: Props) {
  const now = new Date()
  const parsed = value ? new Date(value) : null

  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? now.getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? now.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(
    parsed ? `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}` : null
  )
  const [step, setStep] = useState<'date' | 'time'>(parsed ? 'time' : 'date')
  const [hour, setHour] = useState(parsed ? parsed.getHours() : 9)
  const [minute, setMinute] = useState(parsed ? Math.floor(parsed.getMinutes() / 15) * 15 : 0)

  function selectDate(dateStr: string) {
    setSelectedDate(dateStr)
    setStep('time')
    emit(dateStr, hour, minute)
  }

  function emit(dateStr: string | null, h: number, m: number) {
    if (!dateStr) return
    onChange(`${dateStr}T${pad(h)}:${pad(m)}`)
  }

  function handleHour(h: number) {
    setHour(h)
    emit(selectedDate, h, minute)
  }

  function handleMinute(m: number) {
    setMinute(m)
    emit(selectedDate, hour, m)
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

  return (
    <div className="space-y-3">
      {/* Tab switcher */}
      {selectedDate && (
        <div className="flex rounded-xl overflow-hidden border text-sm" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setStep('date')}
            className="flex-1 py-2 font-medium transition-colors"
            style={{ background: step === 'date' ? 'var(--accent)' : 'var(--background)', color: step === 'date' ? '#fff' : 'var(--muted)' }}
          >
            📅 {selectedDate.split('-').reverse().slice(0, 2).join('/')}
          </button>
          <button
            onClick={() => setStep('time')}
            className="flex-1 py-2 font-medium transition-colors"
            style={{ background: step === 'time' ? 'var(--accent)' : 'var(--background)', color: step === 'time' ? '#fff' : 'var(--muted)' }}
          >
            🕐 {pad(hour)}:{pad(minute)}
          </button>
        </div>
      )}

      {/* Calendar */}
      {step === 'date' && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <button onClick={prevMonth} className="p-1 rounded" style={{ color: 'var(--muted)' }}><ChevronLeft size={16} /></button>
            <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{MONTHS[viewMonth]} {viewYear}</span>
            <button onClick={nextMonth} className="p-1 rounded" style={{ color: 'var(--muted)' }}><ChevronRight size={16} /></button>
          </div>
          {/* Day names */}
          <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border)' }}>
            {DAYS.map((d) => (
              <div key={d} className="py-1.5 text-center text-xs font-medium" style={{ color: 'var(--muted)' }}>{d}</div>
            ))}
          </div>
          {/* Days */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selectedDate
              const isPast = dateStr < todayStr
              return (
                <button
                  key={day}
                  onClick={() => selectDate(dateStr)}
                  disabled={isPast}
                  className="py-2 text-sm flex items-center justify-center transition-colors disabled:opacity-30"
                  style={{
                    background: isSelected ? 'var(--accent)' : 'transparent',
                    color: isSelected ? '#fff' : isToday ? 'var(--accent)' : 'var(--foreground)',
                    fontWeight: isToday || isSelected ? 600 : 400,
                  }}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Time picker */}
      {step === 'time' && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
          <div className="px-3 py-2 border-b text-xs font-semibold uppercase tracking-wide" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
            Ora
          </div>
          {/* Hours grid */}
          <div className="grid grid-cols-6 gap-px p-2" style={{ background: 'var(--border)' }}>
            {Array.from({ length: 24 }, (_, h) => (
              <button
                key={h}
                onClick={() => handleHour(h)}
                className="py-2 text-sm rounded transition-colors"
                style={{
                  background: hour === h ? 'var(--accent)' : 'var(--background)',
                  color: hour === h ? '#fff' : 'var(--foreground)',
                  fontWeight: hour === h ? 600 : 400,
                }}
              >
                {pad(h)}
              </button>
            ))}
          </div>
          <div className="px-3 py-2 border-t border-b text-xs font-semibold uppercase tracking-wide" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
            Minuti
          </div>
          <div className="grid grid-cols-4 gap-px p-2" style={{ background: 'var(--border)' }}>
            {[0, 15, 30, 45].map((m) => (
              <button
                key={m}
                onClick={() => handleMinute(m)}
                className="py-2.5 text-sm rounded transition-colors"
                style={{
                  background: minute === m ? 'var(--accent)' : 'var(--background)',
                  color: minute === m ? '#fff' : 'var(--foreground)',
                  fontWeight: minute === m ? 600 : 400,
                }}
              >
                :{pad(m)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
