import { useCallback, useEffect, useRef, useState } from 'react'
import { duration, fmt, next, pause, remainingMs, reset, retime, start, type Settings as S } from './timer.ts'
import { download, load, mergeImport, save, type SessionRecord } from './storage.ts'
import { chime, notify, tick, unlock } from './alerts.ts'
import { byId, stepAt } from './exercises.ts'
import { streak } from './stats.ts'
import Settings from './Settings.tsx'
import Stats, { sessionsWord } from './Stats.tsx'
import { phaseLabel, type FaceProps } from './face.tsx'
import Instrument from './Instrument.tsx'

export default function App() {
  const [data, setData] = useState(load)
  const [now, setNow] = useState(Date.now)
  const [open, setOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const { settings, timer, history } = data
  const running = timer.endAt !== null
  const left = remainingMs(timer, now)
  const total = Math.max(duration(timer.phase, settings), left) // duration may shrink mid-phase
  const exercise = timer.phase !== 'focus' ? byId(timer.exerciseId) : null

  useEffect(() => save(data), [data])
  useEffect(() => {
    document.documentElement.dataset.phase = timer.phase
  }, [timer.phase])
  useEffect(() => {
    document.documentElement.style.setProperty('--focus', settings.accent)
  }, [settings.accent])
  // Soft tone on exercise step change (useful with eyes closed).
  const elapsed = (total - left) / 1000
  const at = exercise ? stepAt(exercise, elapsed) : null
  const stepKey = exercise ? `${exercise.id}:${at?.index ?? 'done'}` : ''
  const prevStep = useRef(stepKey)
  useEffect(() => {
    if (stepKey && prevStep.current !== stepKey && running && settings.sound) tick()
    prevStep.current = stepKey
  }, [stepKey, running, settings.sound])

  useEffect(() => {
    document.title = running || left < total ? `${fmt(left)} · ${phaseLabel[timer.phase]}` : 'Pomidoro'
  }, [left, running, total, timer.phase])

  const advance = useCallback((completed: boolean) => {
    setData((d) => {
      const n = Date.now()
      const elapsed = duration(d.timer.phase, d.settings) - remainingMs(d.timer, n)
      // randomUUID exists only on HTTPS/localhost; LAN dev over http needs the fallback
      const rec: SessionRecord = { id: crypto.randomUUID?.() ?? `${n}-${Math.random().toString(36).slice(2)}`, phase: d.timer.phase, startedAt: n - elapsed, endedAt: n, completed }
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
      if (e.code !== 'Space' || open || statsOpen || (e.target as HTMLElement).closest('input,button,select,textarea')) return
      e.preventDefault()
      toggle()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle, open, statsOpen])

  const saveSettings = (s: S) =>
    setData((d) => ({
      ...d,
      settings: { ...s, updatedAt: Date.now() },
      timer: retime(d.timer, d.settings, s),
    }))

  const importFile = async (f: File) => {
    try {
      const raw = JSON.parse(await f.text())
      const { added } = mergeImport(data, raw) // validates; throws on a bad file
      setData((d) => mergeImport(d, raw).data) // merge into latest state, not the closure
      return `Импортировано: ${added} ${sessionsWord(added)}`
    } catch (e) {
      return `Не удалось импортировать: ${e instanceof SyntaxError ? 'файл повреждён' : (e as Error).message}`
    }
  }

  const swapExercise = () =>
    setData((d) => {
      const pool = d.settings.exercises
      if (pool.length < 2) return d
      const i = (pool.indexOf(d.timer.exerciseId ?? '') + 1) % pool.length
      return { ...d, timer: { ...d.timer, exerciseId: pool[i] } }
    })

  const todayStart = new Date().setHours(0, 0, 0, 0)
  const today = history.filter((h) => h.phase === 'focus' && h.completed && h.endedAt >= todayStart)
  const props: FaceProps = {
    phase: timer.phase,
    left,
    total,
    running,
    started: running || left < total,
    done: timer.done,
    longEvery: settings.longEvery,
    exercise,
    elapsed,
    canSwap: settings.exercises.length > 1,
    today: { count: today.length, min: Math.round(today.reduce((a, h) => a + h.endedAt - h.startedAt, 0) / 60_000) },
    streak: streak(history, now),
    onToggle: toggle,
    onReset: () => {
      setData((d) => ({ ...d, timer: reset(d.timer, d.settings) }))
      setNow(Date.now())
    },
    onSkip: () => advance(false),
    onSwap: swapExercise,
    onSettings: () => setOpen(true),
    onStats: () => setStatsOpen(true),
  }

  return (
    <>
      <main className="select-none">
        <Instrument {...props} />
      </main>
      <Stats open={statsOpen} history={history} onClose={() => setStatsOpen(false)} />
      <Settings
        open={open}
        settings={settings}
        onClose={() => setOpen(false)}
        onChange={saveSettings}
        onExport={() => download(data)}
        onImport={importFile}
      />
    </>
  )
}
