import { exercises } from './exercises.ts'
import { ambientKinds } from './ambient.ts'
import { langs, t } from './i18n.ts'
import { defaultSettings, initialState, isHex, palettes, retime, type Phase, type Settings, type TimerState } from './timer.ts'

// All data lives in this browser's localStorage. Records are plain JSON with
// ids/timestamps so a future account sync can merge them.
export interface SessionRecord {
  id: string
  phase: Phase
  startedAt: number
  endedAt: number
  completed: boolean // false = skipped
  task?: string // what the user was working on (focus records only)
  updatedAt?: number // set when edited; newer wins on import/sync
}

export const TASK_MAX = 120

const KEY = 'pomidoro:v1'

export interface Data {
  settings: Settings
  timer: TimerState
  history: SessionRecord[]
  task: string // current "what are you working on"
}

export function load(): Data {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (raw) {
      const settings = { ...defaultSettings, ...raw.settings }
      const task = typeof raw.task === 'string' ? raw.task.slice(0, TASK_MAX) : ''
      return { settings, timer: { ...initialState(settings), ...raw.timer }, history: raw.history ?? [], task }
    }
  } catch {
    // corrupted storage: start fresh rather than crash
  }
  return { settings: defaultSettings, timer: initialState(defaultSettings), history: [], task: '' }
}

export const save = (d: Data) => localStorage.setItem(KEY, JSON.stringify(d))

const PHASES = ['focus', 'short', 'long']
const isRecord = (r: any): r is SessionRecord =>
  r && typeof r.id === 'string' && PHASES.includes(r.phase) && Number.isFinite(r.startedAt) &&
  Number.isFinite(r.endedAt) && r.endedAt >= r.startedAt && typeof r.completed === 'boolean' &&
  (r.task === undefined || (typeof r.task === 'string' && r.task.length <= TASK_MAX)) &&
  (r.updatedAt === undefined || Number.isFinite(r.updatedAt))

/** Only known keys with the right type survive (imported file is untrusted). */
function cleanSettings(raw: any): Partial<Settings> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, unknown> = {}
  for (const [k, def] of Object.entries(defaultSettings)) {
    const v = raw[k]
    if (typeof v !== typeof def) continue
    if (k === 'exercises') out[k] = Array.isArray(v) ? v.filter((id) => exercises.some((e) => e.id === id)) : def
    else if (k === 'lang') out[k] = langs.includes(v) ? v : def
    else if (k === 'theme') out[k] = ['system', 'dark', 'light'].includes(v) ? v : def
    else if (k === 'ambient') out[k] = (ambientKinds as readonly string[]).includes(v) ? v : def
    else if (k === 'ambientVolume') out[k] = Number.isInteger(v) && v >= 0 && v <= 100 ? v : def
    else if (k === 'palette') out[k] = Object.hasOwn(palettes, v) ? v : def
    else if (k === 'customColors') {
      const d = def as Settings['customColors']
      out[k] = { focus: isHex(v?.focus) ? v.focus : d.focus, short: isHex(v?.short) ? v.short : d.short, long: isHex(v?.long) ? v.long : d.long }
    }
    else if (typeof def === 'number' && k !== 'updatedAt') {
      if (Number.isInteger(v) && v >= 1 && v <= 180) out[k] = v
    } else out[k] = v
  }
  return out as Partial<Settings>
}

/**
 * Merge an exported file into local data: history is a union by id (an edited copy with a
 * newer updatedAt replaces the local one), settings win if newer. The running timer stays local.
 */
export function mergeImport(cur: Data, raw: unknown): { data: Data; added: number } {
  const r = raw as any
  if (!r || typeof r !== 'object' || !Array.isArray(r.history)) throw new Error(t('Это не файл Pomidoro', 'Not a Pomidoro file'))
  const byId = new Map(cur.history.map((h) => [h.id, h]))
  let added = 0
  for (const h of (r.history as unknown[]).filter(isRecord)) {
    const mine = byId.get(h.id)
    if (!mine) added++
    if (!mine || (h.updatedAt ?? 0) > (mine.updatedAt ?? 0)) byId.set(h.id, h)
  }
  const incoming = cleanSettings(r.settings)
  const settings = (incoming.updatedAt ?? 0) > cur.settings.updatedAt ? { ...cur.settings, ...incoming } : cur.settings
  const history = [...byId.values()].sort((a, b) => a.endedAt - b.endedAt)
  return { data: { ...cur, settings, timer: retime(cur.timer, cur.settings, settings), history }, added }
}

export function download(d: Data) {
  const { settings, history } = d
  const blob = new Blob([JSON.stringify({ app: 'pomidoro', version: 1, exportedAt: Date.now(), settings, history }, null, 1)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `pomidoro-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

/** Edit a history record. Empty task removes it. Stamps updatedAt so the edit wins on merge. */
export function editRecord(history: SessionRecord[], id: string, patch: { task?: string }, now: number): SessionRecord[] {
  return history.map((h) => {
    if (h.id !== id) return h
    const { task: _, ...rest } = h
    const task = patch.task?.trim().slice(0, TASK_MAX)
    return { ...rest, ...(task ? { task } : {}), updatedAt: now }
  })
}
