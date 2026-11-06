import { useCallback, useEffect, useRef, useState } from 'react'
import { duration, fmt, next, pause, remainingMs, reset, retime, start, type Settings as S } from './timer.ts'
import { download, editRecord, load, mergeImport, save, TASK_MAX, type SessionRecord } from './storage.ts'
import { chime, clockTick, notify, tick, unlock } from './alerts.ts'
import { setAmbient } from './ambient.ts'
import { byId, stepAt } from './exercises.ts'
import { recentTasks, streak } from './stats.ts'
import { sessionsWord, setLang, t } from './i18n.ts'
import Settings from './Settings.tsx'
import Stats from './Stats.tsx'
import { phaseLabel, type FaceProps } from './face.tsx'
import Instrument from './Instrument.tsx'
import Hotkeys from './Hotkeys.tsx'
import Confirm from './Confirm.tsx'
import Calendar from './Calendar.tsx'

export default function App() {
  const [data, setData] = useState(load)
  const [now, setNow] = useState(Date.now)
  // reset/skip are confirmation modals
  const [panel, setPanel] = useState<'settings' | 'stats' | 'calendar' | 'help' | 'reset' | 'skip' | null>(null)
  const { settings, timer, history } = data
  setLang(settings.lang) // before any child renders; see i18n.ts
  const running = timer.endAt !== null
  const left = remainingMs(timer, now)
  const total = Math.max(duration(timer.phase, settings), left) // duration may shrink mid-phase
  const exercise = timer.phase !== 'focus' ? byId(timer.exerciseId) : null

  useEffect(() => save(data), [data])
  useEffect(() => {
    document.documentElement.dataset.phase = timer.phase
  }, [timer.phase])
  useEffect(() => {
    document.documentElement.lang = settings.lang
  }, [settings.lang])
  useEffect(() => {
    const html = document.documentElement
    html.dataset.palette = settings.palette
    // Custom palette: inline vars beat the [data-palette] rules in index.css.
    for (const k of ['focus', 'short', 'long'] as const) {
      if (settings.palette === 'custom') html.style.setProperty(`--c-${k}`, settings.customColors[k])
      else html.style.removeProperty(`--c-${k}`)
    }
  }, [settings.palette, settings.customColors])
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: light)')
    const apply = () => {
      const light = settings.theme === 'light' || (settings.theme === 'system' && mq.matches)
      document.documentElement.dataset.theme = light ? 'light' : 'dark'
      document.querySelector('meta[name=theme-color]')?.setAttribute('content', light ? '#ece6dd' : '#0c0a09')
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [settings.theme])
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
    document.title = running || left < total ? `${fmt(left)} · ${phaseLabel(timer.phase)}` : 'Pomidoro'
  }, [left, running, total, timer.phase])

  const advance = useCallback((completed: boolean) => {
    setData((d) => {
      const n = Date.now()
      const elapsed = duration(d.timer.phase, d.settings) - remainingMs(d.timer, n)
      // randomUUID exists only on HTTPS/localhost; LAN dev over http needs the fallback
      const rec: SessionRecord = { id: crypto.randomUUID?.() ?? `${n}-${Math.random().toString(36).slice(2)}`, phase: d.timer.phase, startedAt: n - elapsed, endedAt: n, completed }
      const task = d.task.trim()
      if (task && d.timer.phase === 'focus') rec.task = task
      // A skip under a minute is noise; a completed phase is always recorded.
      return { ...d, timer: next(d.timer, d.settings, n), history: completed || elapsed >= 60_000 ? [...d.history, rec] : d.history }
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
      notify(toBreak ? t('Время перерыва', 'Break time') : t('Пора за работу', 'Back to work'), toBreak ? t('Отличная сессия! Отдохните.', 'Great session! Take a rest.') : t('Перерыв закончился.', 'The break is over.'))
      advance(true)
    }, Math.max(0, timer.endAt - Date.now()))
    return () => clearTimeout(id)
  }, [timer.endAt, timer.phase, settings.sound, advance])

  // Clock ticking during focus, aligned to the timer's whole seconds.
  const ticking = running && timer.phase === 'focus' && settings.sound && settings.ticking
  useEffect(() => {
    if (!ticking || timer.endAt === null) return
    const endAt = timer.endAt
    let id = 0
    const beat = () => {
      const s = Math.round((endAt - Date.now()) / 1000)
      if (s > 0) clockTick(s % 2 === 0)
    }
    const first = setTimeout(() => {
      beat()
      id = window.setInterval(beat, 1000)
    }, (endAt - Date.now()) % 1000)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [ticking, timer.endAt])

  // Background sound: plays while focus runs, or briefly as a preview after a change in settings.
  const [previewUntil, setPreviewUntil] = useState(0)
  const previewing = previewUntil > now
  const ambientOn = settings.ambient !== 'off' && ((running && timer.phase === 'focus') || previewing)
  useEffect(() => {
    setAmbient(ambientOn ? settings.ambient : 'off', settings.ambientVolume)
  }, [ambientOn, settings.ambient, settings.ambientVolume])
  useEffect(() => {
    if (!previewing) return
    const id = setTimeout(() => setNow(Date.now()), previewUntil - Date.now() + 20) // re-render to end the preview
    return () => clearTimeout(id)
  }, [previewing, previewUntil])

  const toggle = useCallback(() => {
    unlock()
    const n = Date.now()
    setData((d) => ({ ...d, timer: d.timer.endAt === null ? start(d.timer, n) : pause(d.timer, n) }))
    setNow(n)
  }, [])

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
      return t('Импортировано: {n}', 'Imported: {n}', { n: `${added} ${sessionsWord(added)}` })
    } catch (e) {
      return `${t('Не удалось импортировать', 'Import failed')}: ${e instanceof SyntaxError ? t('файл повреждён', 'the file is corrupted') : (e as Error).message}`
    }
  }

  const swapExercise = () =>
    setData((d) => {
      const pool = d.settings.exercises
      if (pool.length < 2) return d
      const i = (pool.indexOf(d.timer.exerciseId ?? '') + 1) % pool.length
      return { ...d, timer: { ...d.timer, exerciseId: pool[i] } }
    })

  // A phase that ends naturally while a confirm is open makes it stale.
  useEffect(() => setPanel((p) => (p === 'reset' || p === 'skip' ? null : p)), [timer.phase])

  const doReset = () => {
    setData((d) => ({ ...d, timer: reset(d.timer, d.settings) }))
    setNow(Date.now())
  }

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
    // Untouched phase has nothing to reset (button is disabled, hotkey is a no-op).
    onReset: () => (running || left < total) && setPanel('reset'),
    onSkip: () => setPanel('skip'),
    onSwap: swapExercise,
    onSettings: () => setPanel('settings'),
    onStats: () => setPanel('stats'),
    onCalendar: () => setPanel('calendar'),
    task: data.task,
    recentTasks: recentTasks(history),
    onTask: (task: string) => setData((d) => ({ ...d, task: task.slice(0, TASK_MAX) })),
    onHelp: () => setPanel('help'),
  }

  // Hotkeys (see Hotkeys.tsx). e.code = physical key, so they work on any layout (ЙЦУКЕН too).
  const latest = useRef({ props, panel })
  latest.current = { props, panel }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || (e.target as HTMLElement).closest('input,select,textarea')) return
      const { props: p, panel: open } = latest.current
      const flip = (name: NonNullable<typeof open>) => setPanel(open === name ? null : name)
      if (e.code === 'Slash' && e.shiftKey) flip('help')
      else if (e.code === 'KeyA') flip('stats')
      else if (e.code === 'KeyS') flip('settings')
      else if (e.code === 'KeyC') flip('calendar')
      else if (open) return // timer keys only on the main screen
      else if (e.code === 'Space') p.onToggle()
      else if (e.code === 'KeyR') p.onReset()
      else if (e.code === 'KeyN' || e.code === 'ArrowRight') p.onSkip()
      else if (e.code === 'KeyE' && p.exercise && p.canSwap) p.onSwap()
      else if (e.code === 'KeyT') document.querySelector<HTMLInputElement>('.ins-task')?.focus()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <main className="select-none">
        <Instrument {...props} />
      </main>
      <Stats open={panel === 'stats'} history={history} onClose={() => setPanel(null)} />
      <Calendar
        open={panel === 'calendar'}
        history={history}
        onClose={() => setPanel(null)}
        onEdit={(id, patch) => setData((d) => ({ ...d, history: editRecord(d.history, id, patch, Date.now()) }))}
      />
      <Hotkeys open={panel === 'help'} onClose={() => setPanel(null)} />
      <Confirm
        open={panel === 'reset'}
        title={t('Сбросить таймер?', 'Reset the timer?')}
        text={t('Текущая фаза начнётся заново, прогресс будет потерян.', 'The current phase starts over and its progress is lost.')}
        action={t('Сбросить', 'Reset')}
        onConfirm={() => {
          setPanel(null)
          doReset()
        }}
        onClose={() => setPanel(null)}
      />
      <Confirm
        open={panel === 'skip'}
        title={t('Перейти дальше?', 'Skip ahead?')}
        text={timer.phase === 'focus' ? t('Фокус-сессия закончится досрочно и не попадёт в статистику.', 'The focus session ends early and won’t count in stats.') : t('Перерыв закончится, начнётся фокус.', 'The break ends and focus begins.')}
        action={t('Далее', 'Next')}
        onConfirm={() => {
          setPanel(null)
          advance(false)
        }}
        onClose={() => setPanel(null)}
      />
      <Settings
        open={panel === 'settings'}
        settings={settings}
        onClose={() => setPanel(null)}
        onChange={saveSettings}
        onPreviewAmbient={() => {
          unlock()
          const until = Date.now() + 5000
          setPreviewUntil(until)
          setNow(Date.now())
        }}
        onExport={() => download(data)}
        onImport={importFile}
      />
    </>
  )
}
