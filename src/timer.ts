export type Phase = 'focus' | 'short' | 'long'
// Colors live in index.css under [data-palette=…]; this is the list of ids and names.
import { browserLang, type L, type Lang } from './i18n.ts'
export const palettes = {
  classic: ['Классика', 'Classic'], ocean: ['Океан', 'Ocean'], sunset: ['Закат', 'Sunset'], forest: ['Лес', 'Forest'],
  neon: ['Неон', 'Neon'], amber: ['Янтарь', 'Amber'], mono: ['Монохром', 'Mono'],
  lavender: ['Лаванда', 'Lavender'], cherry: ['Вишня', 'Cherry'], citrus: ['Цитрус', 'Citrus'], arctic: ['Арктика', 'Arctic'],
  retro: ['Ретро', 'Retro'], fjord: ['Фьорд', 'Fjord'], sakura: ['Сакура', 'Sakura'],
} satisfies Record<string, L>
export type Palette = keyof typeof palettes

export interface Settings {
  focusMin: number
  shortMin: number
  longMin: number
  longEvery: number // long break after every N focus sessions
  autoStartBreaks: boolean
  autoStartFocus: boolean
  sound: boolean
  exercises: string[] // enabled exercise ids, may be empty
  palette: Palette
  theme: 'system' | 'dark' | 'light'
  lang: Lang
  updatedAt: number
}

export interface TimerState {
  phase: Phase
  done: number // focus sessions finished in the current set
  endAt: number | null // set while running
  remaining: number // ms, meaningful while paused
  exerciseId: string | null // picked for the current break
  exerciseTurn: number // rotation index over enabled exercises
}

export const defaultSettings: Settings = {
  focusMin: 25,
  shortMin: 5,
  longMin: 15,
  longEvery: 4,
  autoStartBreaks: true,
  autoStartFocus: false,
  sound: true,
  exercises: ['box', 'rule-20', 'neck'],
  palette: 'classic',
  theme: 'system',
  lang: browserLang(),
  updatedAt: 0,
}

export const duration = (phase: Phase, s: Settings) =>
  (phase === 'focus' ? s.focusMin : phase === 'short' ? s.shortMin : s.longMin) * 60_000

export const initialState = (s: Settings): TimerState => ({
  phase: 'focus',
  done: 0,
  endAt: null,
  remaining: duration('focus', s),
  exerciseId: null,
  exerciseTurn: 0,
})

export const remainingMs = (t: TimerState, now: number) =>
  t.endAt === null ? t.remaining : Math.max(0, t.endAt - now)

export const start = (t: TimerState, now: number): TimerState =>
  t.endAt !== null ? t : { ...t, endAt: now + t.remaining }

export const pause = (t: TimerState, now: number): TimerState =>
  t.endAt === null ? t : { ...t, endAt: null, remaining: remainingMs(t, now) }

/** Move to the following phase (natural end or skip). */
export function next(t: TimerState, s: Settings, now: number): TimerState {
  let phase: Phase
  let done = t.done
  if (t.phase === 'focus') {
    done += 1
    phase = done >= s.longEvery ? 'long' : 'short'
  } else {
    phase = 'focus'
    if (t.phase === 'long') done = 0
  }
  const isBreak = phase !== 'focus'
  const pool = s.exercises
  const exerciseId = isBreak && pool.length ? pool[t.exerciseTurn % pool.length] : null
  const auto = isBreak ? s.autoStartBreaks : s.autoStartFocus
  const ms = duration(phase, s)
  return {
    phase,
    done,
    endAt: auto ? now + ms : null,
    remaining: ms,
    exerciseId,
    exerciseTurn: exerciseId ? t.exerciseTurn + 1 : t.exerciseTurn,
  }
}

export const reset = (t: TimerState, s: Settings): TimerState => ({
  ...t,
  endAt: null,
  remaining: duration(t.phase, s),
})

/** After a settings change: an untouched paused timer picks up the new duration; progress is kept otherwise. */
export const retime = (t: TimerState, prev: Settings, s: Settings): TimerState =>
  t.endAt === null && t.remaining === duration(t.phase, prev) ? reset(t, s) : t

export const fmt = (ms: number) => {
  const sec = Math.ceil(ms / 1000)
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`
}
