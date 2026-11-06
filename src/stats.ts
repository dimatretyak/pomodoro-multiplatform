import type { SessionRecord } from './storage.ts'

export interface Day {
  start: number // local midnight, ms
  min: number
  count: number
}


export const midnight = (t: number) => new Date(t).setHours(0, 0, 0, 0)
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



/** Last 7 days vs the 7 before, from a 14-day series. pct is null when there is nothing to compare with. */
export function weekCompare(days14: Day[]) {
  const sum = (ds: Day[]) => ds.reduce((a, d) => a + d.min, 0)
  const cur = sum(days14.slice(-7)), prev = sum(days14.slice(-14, -7))
  return { cur, prev, pct: prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null }
}

const mins = (h: SessionRecord) => (h.endedAt - h.startedAt) / 60_000

/** Month grid: leading nulls for the days before the 1st, then each day's local midnight. */
export function monthCells(y: number, m: number, weekStart: 0 | 1): (number | null)[] {
  const offset = (new Date(y, m, 1).getDay() - weekStart + 7) % 7
  const days = new Date(y, m + 1, 0).getDate()
  return [...Array<null>(offset).fill(null), ...Array.from({ length: days }, (_, i) => new Date(y, m, i + 1).getTime())]
}

/** Completed focus minutes per local day (key = midnight). */
export function focusByDay(history: SessionRecord[]) {
  const out = new Map<number, number>()
  for (const h of history) if (h.phase === 'focus' && h.completed) out.set(midnight(h.endedAt), (out.get(midnight(h.endedAt)) ?? 0) + mins(h))
  return out
}

/** Records that ended on the given day, oldest first. */
export const dayRecords = (history: SessionRecord[], day: number) =>
  history.filter((h) => midnight(h.endedAt) === day).sort((a, b) => a.startedAt - b.startedAt)

/** Focus minutes per task for a set of records, biggest first. Untitled work has task ''. */
export function byTask(records: SessionRecord[]): [task: string, min: number][] {
  const m = new Map<string, number>()
  for (const h of records) if (h.phase === 'focus' && h.completed) m.set(h.task?.trim() ?? '', (m.get(h.task?.trim() ?? '') ?? 0) + mins(h))
  return [...m].sort((a, b) => b[1] - a[1])
}

/** Distinct recent task names, newest first. */
export function recentTasks(history: SessionRecord[], n = 20) {
  const seen = new Set<string>()
  for (let i = history.length - 1; i >= 0 && seen.size < n; i--) {
    const t = history[i].task?.trim()
    if (t) seen.add(t)
  }
  return [...seen]
}
