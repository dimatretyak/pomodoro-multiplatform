import { lastDays, streak, totalMin } from './stats.ts'
import type { SessionRecord } from './storage.ts'
import Panel from './Panel.tsx'

interface Props {
  open: boolean
  history: SessionRecord[]
  onClose: () => void
}

const plural = (n: number, [one, few, many]: [string, string, string]) => {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}
export const sessionsWord = (n: number) => plural(n, ['сессия', 'сессии', 'сессий'])
const hm = (min: number) => (min < 60 ? `${Math.round(min)} мин` : `${Math.floor(min / 60)} ч ${Math.round(min % 60)} мин`)
const dayLabel = (t: number) => new Date(t).toLocaleDateString('ru', { weekday: 'short', day: 'numeric', month: 'short' })

export default function Stats({ open, history, onClose }: Props) {
  const now = Date.now()
  const days = lastDays(history, now, 14)
  const today = days[days.length - 1]
  const week = days.slice(-7)
  const weekMin = week.reduce((a, d) => a + d.min, 0)
  const max = Math.max(...days.map((d) => d.min))
  const maxIdx = days.findIndex((d) => d.min === max)
  const s = streak(history, now)

  return (
    <Panel open={open} title="Статистика" side="left" onClose={onClose}>
      <div className="grid grid-cols-2 gap-2">
        <Tile label="Сегодня" value={hm(today.min)} sub={`${today.count} ${sessionsWord(today.count)}`} />
        <Tile label="За 7 дней" value={hm(weekMin)} sub={`${week.reduce((a, d) => a + d.count, 0)} ${sessionsWord(week.reduce((a, d) => a + d.count, 0))}`} />
        <Tile label="Всего" value={hm(totalMin(history))} />
        <Tile label="Серия" value={`${s} ${plural(s, ['день', 'дня', 'дней'])}`} sub="подряд с фокусом" />
      </div>

      <h3 className="mt-8 mb-4 text-sm font-medium">Фокус по дням, минут</h3>
      {max === 0 ? (
        <p className="text-sm text-(--muted)">Завершите первую фокус-сессию, и здесь появится график.</p>
      ) : (
        <>
          {/* key on `open` replays the grow animation each time the panel opens */}
          <div key={String(open)} className="flex h-44 items-end gap-1.5 border-b border-(--line) pt-6">
            {days.map((d, i) => {
              const isToday = i === days.length - 1
              const label = `${dayLabel(d.start)}: ${Math.round(d.min)} мин, ${d.count} ${sessionsWord(d.count)}`
              return (
                <div key={d.start} tabIndex={0} aria-label={label} className="group relative flex h-full flex-1 items-end outline-none">
                  {d.min > 0 ? (
                    <div
                      className="bar w-full rounded-t-[4px] bg-(--accent) group-hover:brightness-110 group-focus-visible:brightness-110"
                      style={{ height: `${Math.max(3, (d.min / max) * 100)}%`, animationDelay: `${i * 25}ms`, opacity: isToday ? 1 : 0.75 }}
                    >
                      {i === maxIdx && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[11px] text-(--muted) tabular-nums">{Math.round(d.min)}</span>
                      )}
                    </div>
                  ) : (
                    <div className="h-[2px] w-full rounded-full bg-(--line)" />
                  )}
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-lg border border-(--line) bg-(--panel) px-2.5 py-1.5 text-xs whitespace-nowrap shadow-lg backdrop-blur-xl group-hover:block group-focus-visible:block">
                    <div className="text-(--muted)">{dayLabel(d.start)}</div>
                    <div className="tabular-nums">{Math.round(d.min)} мин · {d.count} {sessionsWord(d.count)}</div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-1.5 flex gap-1.5">
            {days.map((d, i) => (
              <span key={d.start} className={`flex-1 text-center text-[10px] ${i === days.length - 1 ? 'font-semibold text-(--fg)' : 'text-(--muted)'}`}>
                {new Date(d.start).toLocaleDateString('ru', { weekday: 'short' })}
              </span>
            ))}
          </div>
          <table className="sr-only">
            <caption>Минуты фокуса по дням</caption>
            <tbody>
              {days.map((d) => (
                <tr key={d.start}><th>{dayLabel(d.start)}</th><td>{Math.round(d.min)} мин</td><td>{d.count} {sessionsWord(d.count)}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </Panel>
  )
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-(--line) bg-(--surface) p-4">
      <div className="text-xs text-(--muted)">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-(--muted)">{sub}</div>}
    </div>
  )
}
