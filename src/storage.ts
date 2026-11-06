import { exercises } from './exercises.ts'
import { defaultSettings, initialState, palettes, retime, type Phase, type Settings, type TimerState } from './timer.ts'

// All data lives in this browser's localStorage. Records are plain JSON with
// ids/timestamps so a future account sync can merge them.
export interface SessionRecord {
  id: string
  phase: Phase
  startedAt: number
  endedAt: number
  completed: boolean // false = skipped
}

const KEY = 'pomidoro:v1'

export interface Data {
  settings: Settings
  timer: TimerState
  history: SessionRecord[]
}

export function load(): Data {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (raw) {
      const settings = { ...defaultSettings, ...raw.settings }
      return { settings, timer: { ...initialState(settings), ...raw.timer }, history: raw.history ?? [] }
    }
  } catch {
    // corrupted storage: start fresh rather than crash
  }
  return { settings: defaultSettings, timer: initialState(defaultSettings), history: [] }
}

export const save = (d: Data) => localStorage.setItem(KEY, JSON.stringify(d))

const PHASES = ['focus', 'short', 'long']
const isRecord = (r: any): r is SessionRecord =>
  r && typeof r.id === 'string' && PHASES.includes(r.phase) && Number.isFinite(r.startedAt) &&
  Number.isFinite(r.endedAt) && r.endedAt >= r.startedAt && typeof r.completed === 'boolean'

/** Only known keys with the right type survive (imported file is untrusted). */
function cleanSettings(raw: any): Partial<Settings> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, unknown> = {}
  for (const [k, def] of Object.entries(defaultSettings)) {
    const v = raw[k]
    if (typeof v !== typeof def) continue
    if (k === 'exercises') out[k] = Array.isArray(v) ? v.filter((id) => exercises.some((e) => e.id === id)) : def
    else if (k === 'theme') out[k] = ['system', 'dark', 'light'].includes(v) ? v : def
    else if (k === 'palette') out[k] = Object.hasOwn(palettes, v) ? v : def
    else if (typeof def === 'number' && k !== 'updatedAt') {
      if (Number.isInteger(v) && v >= 1 && v <= 180) out[k] = v
    } else out[k] = v
  }
  return out as Partial<Settings>
}

/**
 * Merge an exported file into local data: history is a union by id,
 * settings win if the file's are newer. The running timer stays local.
 */
export function mergeImport(cur: Data, raw: unknown): { data: Data; added: number } {
  const r = raw as any
  if (!r || typeof r !== 'object' || !Array.isArray(r.history)) throw new Error('Это не файл Pomidoro')
  const ids = new Set(cur.history.map((h) => h.id))
  const fresh = (r.history as unknown[]).filter(isRecord).filter((h) => !ids.has(h.id) && ids.add(h.id))
  const incoming = cleanSettings(r.settings)
  const settings = (incoming.updatedAt ?? 0) > cur.settings.updatedAt ? { ...cur.settings, ...incoming } : cur.settings
  const history = [...cur.history, ...fresh].sort((a, b) => a.endedAt - b.endedAt)
  return { data: { ...cur, settings, timer: retime(cur.timer, cur.settings, settings), history }, added: fresh.length }
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
