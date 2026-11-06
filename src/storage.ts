import { defaultSettings, initialState, type Phase, type Settings, type TimerState } from './timer.ts'

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

interface Data {
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
