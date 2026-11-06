import type { SessionRecord } from './storage.ts'

export interface Day {
  start: number // local midnight, ms
  min: number
  count: number
}


const midnight = (t: number) => new Date(t).setHours(0, 0, 0, 0)
const shift = (t: number, days: number) => {
  const d = new Date(t)
  d.setDate(d.getDate() + days) // DST-safe, unlike t + days * DAY
  return d.getTime()
}

/** Completed focus minutes per local day, oldest first, last `n` days incl. today. */
export function lastDays(history: SessionRecord[], now: number, n: number): Day[] {
  const today = midnight(now)
  const days: Day[] = Array.from({ length: n }, (_, i) => ({ start: shift(today, i - n + 1), min: 0, count: 0 }))
  const index = new Map(days.map((d, i) => [d.start, i]))
  for (const h of history) {
    if (h.phase !== 'focus' || !h.completed) continue
    const i = index.get(midnight(h.endedAt))
    if (i === undefined) continue
    days[i].min += (h.endedAt - h.startedAt) / 60_000
    days[i].count += 1
  }
  return days
}

/** Consecutive days with a completed focus session, ending today (or yesterday if today is empty so far). */
export function streak(history: SessionRecord[], now: number): number {
  const days = new Set(history.filter((h) => h.phase === 'focus' && h.completed).map((h) => midnight(h.endedAt)))
  let d = midnight(now)
  if (!days.has(d)) d = shift(d, -1)
  let n = 0
  while (days.has(d)) {
    n++
    d = shift(d, -1)
  }
  return n
}

export const totalMin = (history: SessionRecord[]) =>
  history.reduce((a, h) => (h.phase === 'focus' && h.completed ? a + (h.endedAt - h.startedAt) / 60_000 : a), 0)


