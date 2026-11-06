import { stepAt, type Exercise } from './exercises.ts'
import type { Phase } from './timer.ts'

export interface FaceProps {
  phase: Phase
  left: number // ms
  total: number // ms
  running: boolean
  started: boolean // phase has been started (running or paused mid-way)
  done: number
  longEvery: number
  exercise: Exercise | null
  elapsed: number // seconds into the phase
  canSwap: boolean
  today: { count: number; min: number }
  streak: number
  onToggle: () => void
  onReset: () => void
  onSkip: () => void
  onSwap: () => void
  onSettings: () => void
  onStats: () => void
}

export const phaseLabel: Record<Phase, string> = { focus: 'Фокус', short: 'Короткий перерыв', long: 'Длинный перерыв' }
export const actionLabel = (p: FaceProps) => (p.running ? 'Пауза' : p.started ? 'Продолжить' : 'Старт')

const pad = (n: number) => String(n).padStart(2, '0')
export const split = (ms: number) => {
  const s = Math.ceil(ms / 1000)
  return { mm: pad(Math.floor(s / 60)), ss: pad(s % 60) }
}

/** Current exercise step, plus whether a breathing circle should be expanded. */
export function stepInfo(ex: Exercise, elapsed: number) {
  const at = stepAt(ex, elapsed)
  if (!at) return null
  const step = ex.steps[at.index]
  const prev = ex.steps[(at.index - 1 + ex.steps.length) % ex.steps.length]
  const big = step.breath === 'in' || (step.breath === 'hold' && prev.breath === 'in')
  return { index: at.index, step, left: Math.ceil(at.left), progress: 1 - at.left / step.sec, big, count: ex.steps.length }
}

const I = ({ d, size = 20 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
)
export const IconStats = () => <I d="M5 20V12M10 20V6M15 20v-9M20 20V9" />
export const IconSettings = () => <I d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M16 4v4M10 10v4M18 16v4" />
export const IconReset = () => <I d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />
export const IconSkip = () => <I d="M5 4l10 8-10 8zM19 5v14" />
export const IconPlay = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" /></svg>
)
export const IconPause = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="6" y="5" width="4" height="14" rx="1.5" /><rect x="14" y="5" width="4" height="14" rx="1.5" /></svg>
)
