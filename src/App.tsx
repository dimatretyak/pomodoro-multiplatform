import { useCallback, useEffect, useState } from 'react'
import { duration, fmt, next, pause, remainingMs, reset, start, type Phase, type Settings as S } from './timer.ts'
import { load, save, type SessionRecord } from './storage.ts'
import { chime, notify, unlock } from './alerts.ts'
import { byId } from './exercises.ts'
import BreakView from './BreakView.tsx'
import Settings from './Settings.tsx'

const labels: Record<Phase, string> = { focus: 'Фокус', short: 'Короткий перерыв', long: 'Длинный перерыв' }
const R = 45
const C = 2 * Math.PI * R

export default function App() {
  const [data, setData] = useState(load)
  const [now, setNow] = useState(Date.now)
  const [open, setOpen] = useState(false)
  const { settings, timer, history } = data
  const running = timer.endAt !== null
  const left = remainingMs(timer, now)
  const total = duration(timer.phase, settings)
  const exercise = timer.phase !== 'focus' ? byId(timer.exerciseId) : null

  useEffect(() => save(data), [data])
  useEffect(() => {
    document.documentElement.dataset.phase = timer.phase
  }, [timer.phase])
  useEffect(() => {
    document.title = running || left < total ? `${fmt(left)} · ${labels[timer.phase]}` : 'Pomidoro'
  }, [left, running, total, timer.phase])

  const advance = useCallback((completed: boolean) => {
    setData((d) => {
      const n = Date.now()
      const elapsed = duration(d.timer.phase, d.settings) - remainingMs(d.timer, n)
      const rec: SessionRecord = { id: crypto.randomUUID(), phase: d.timer.phase, startedAt: n - elapsed, endedAt: n, completed }
      return { ...d, timer: next(d.timer, d.settings, n), history: elapsed > 1000 ? [...d.history, rec] : d.history }
    })
    setNow(Date.now())
  }, [])

  // Re-render ticker. Completion uses its own one-shot timeout so background
  // tab throttling of the ticker doesn't delay the alarm.
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [running])

  useEffect(() => {
    if (timer.endAt === null) return
    const id = setTimeout(() => {
      if (settings.sound) chime()
      const toBreak = timer.phase === 'focus'
      notify(toBreak ? 'Время перерыва' : 'Пора за работу', toBreak ? 'Отличная сессия! Отдохните.' : 'Перерыв закончился.')
      advance(true)
    }, Math.max(0, timer.endAt - Date.now()))
    return () => clearTimeout(id)
  }, [timer.endAt, timer.phase, settings.sound, advance])

  const toggle = useCallback(() => {
    unlock()
    const n = Date.now()
    setData((d) => ({ ...d, timer: d.timer.endAt === null ? start(d.timer, n) : pause(d.timer, n) }))
    setNow(n)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || open || (e.target as HTMLElement).closest('input,button,select,textarea')) return
      e.preventDefault()
      toggle()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle, open])

  const saveSettings = (s: S) =>
    setData((d) => ({
      ...d,
      settings: { ...s, updatedAt: Date.now() },
      timer: d.timer.endAt === null ? reset(d.timer, s) : d.timer,
    }))

  const swapExercise = () =>
    setData((d) => {
      const pool = d.settings.exercises
      if (pool.length < 2) return d
      const i = (pool.indexOf(d.timer.exerciseId ?? '') + 1) % pool.length
      return { ...d, timer: { ...d.timer, exerciseId: pool[i] } }
    })

  const todayStart = new Date().setHours(0, 0, 0, 0)
  const today = history.filter((h) => h.phase === 'focus' && h.completed && h.endedAt >= todayStart)
  const todayMin = Math.round(today.reduce((a, h) => a + h.endedAt - h.startedAt, 0) / 60_000)

  return (
    <>
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="blob absolute -top-1/4 -left-1/4 size-[60vmax] rounded-full" />
      <div className="blob blob-2 absolute -right-1/4 -bottom-1/3 size-[55vmax] rounded-full" />
    </div>
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-10 select-none">
      <button
        onClick={() => setOpen(true)}
        aria-label="Настройки"
        className="press fixed top-4 right-4 grid size-11 place-items-center rounded-full text-(--muted) hover:bg-white/5 hover:text-white"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
          <circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" />
        </svg>
      </button>

      <div key={`l-${timer.phase}`} className="fade-up mb-6 text-center">
        <div className="text-sm font-medium tracking-[0.08em] text-(--accent) uppercase">{labels[timer.phase]}</div>
        {exercise && <div className="mt-1 text-[13px] text-(--muted) tabular-nums">{exercise.title} · {fmt(left)}</div>}
      </div>

      <div key={`r-${timer.phase}`} className="ring-pulse relative aspect-square w-[clamp(280px,78vw,360px)]">
        <div className={`glow absolute -inset-10 rounded-full ${running ? 'running' : ''}`} />
        <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
          <circle cx="50" cy="50" r={R} fill="none" stroke="var(--track)" strokeWidth="2.6" />
          <circle
            className="ring-progress"
            cx="50" cy="50" r={R} fill="none" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - left / total)}
            style={{ filter: 'drop-shadow(0 0 1.5px var(--accent))' }}
          />
        </svg>
        <div className="ring-head absolute inset-0" style={{ rotate: `${360 * (left / total)}deg` }}>
          <span className={`absolute top-[5%] left-1/2 size-3 -translate-1/2 rounded-full bg-white shadow-[0_0_12px_2px_var(--accent)] ${running ? 'opacity-100' : 'opacity-60'}`} />
        </div>
        <div className="enter absolute inset-[9%] grid place-items-center text-center">
          {exercise ? (
            <BreakView exercise={exercise} elapsed={(total - left) / 1000} />
          ) : (
            <div>
              <div className="flex justify-center overflow-hidden text-[clamp(64px,17vw,96px)] leading-none font-light tracking-tight tabular-nums">
                {[...fmt(left)].map((ch, i) => (
                  <span key={`${i}${ch}`} className={ch === ':' ? 'pb-[0.08em]' : 'digit'}>{ch}</span>
                ))}
              </div>
              <div className="mt-3 text-[13px] text-(--muted)">
                {timer.phase === 'focus' ? `сессия ${timer.done + 1} из ${settings.longEvery}` : running ? 'отдохните' : 'нажмите старт'}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 flex items-center gap-4">
        <IconButton label="Сброс" onClick={() => { setData((d) => ({ ...d, timer: reset(d.timer, d.settings) })); setNow(Date.now()) }}>
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" />
        </IconButton>
        <button
          onClick={toggle}
          className="press h-14 min-w-40 rounded-full bg-(--accent) px-8 text-[15px] font-semibold text-[#0e0b0d] shadow-[0_8px_30px_-6px_var(--accent)] hover:brightness-110"
        >
          {running ? 'Пауза' : left < total ? 'Продолжить' : 'Старт'}
        </button>
        <IconButton label="Пропустить" onClick={() => advance(false)}>
          <path d="M5 4l10 8-10 8z" /><path d="M19 5v14" />
        </IconButton>
      </div>

      <div className="mt-6 flex gap-2.5" aria-label={`Сессий в цикле: ${timer.done} из ${settings.longEvery}`}>
        {Array.from({ length: settings.longEvery }, (_, i) => (
          <span
            key={i}
            className={`size-2 rounded-full transition-colors duration-300 ${
              i < timer.done ? 'dot-done bg-(--accent)' : i === timer.done && timer.phase === 'focus' ? 'ring-1 ring-(--accent)' : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      <div className="mt-8 h-10 text-center text-[13px] text-(--muted)">
        {exercise && settings.exercises.length > 1 && (
          <button onClick={swapExercise} className="press mb-2 block w-full underline-offset-4 hover:text-white hover:underline">
            Другое упражнение
          </button>
        )}
        {today.length > 0 && `Сегодня: ${today.length} ${plural(today.length)} · ${todayMin} мин`}
      </div>

      <Settings open={open} settings={settings} onClose={() => setOpen(false)} onChange={saveSettings} />
    </main>
    </>
  )
}

function plural(n: number) {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return 'сессия'
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'сессии'
  return 'сессий'
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="press grid size-11 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-(--muted) hover:border-white/20 hover:text-white"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  )
}
