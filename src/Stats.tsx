import { lastDays, streak, totalMin, weekCompare } from './stats.ts'
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
  const week = weekCompare(days)
  const max = Math.max(...days.map((d) => d.min))
  const s = streak(history, now)

  return (
    <Panel open={open} title="Статистика" side="left" onClose={onClose}>
      <div className="st-hero">
        <span>Фокус за 7 дней</span>
        <b>{hm(week.cur)}</b>
        {week.pct !== null && <em>{week.pct >= 0 ? '▲' : '▼'} {Math.abs(week.pct)}% к прошлой неделе</em>}
      </div>

      {max === 0 ? (
        <p className="set-note mt-6">Завершите первую фокус-сессию, и здесь появится график.</p>
      ) : (
        <>
          {/* key on `open` replays the grow animation each time the panel opens */}
          <div key={String(open)} className="st-chart" aria-label="Минуты фокуса за 14 дней">
            {days.map((d, i) => {
              const label = `${dayLabel(d.start)}: ${Math.round(d.min)} мин, ${d.count} ${sessionsWord(d.count)}`
              return (
                <div key={d.start} tabIndex={0} aria-label={label} className={`st-col ${i === days.length - 1 ? 'today' : ''}`}>
                  <div className="st-track" />
                  <div className={`st-bar ${d.min ? '' : 'zero'}`} style={{ height: d.min ? `${Math.max(4, (d.min / max) * 100)}%` : undefined, animationDelay: `${i * 25}ms` }} />
                  <div className="st-tip">
                    <span>{dayLabel(d.start)}</span>
                    {Math.round(d.min)} мин · {d.count} {sessionsWord(d.count)}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="st-days" aria-hidden>
            {days.map((d) => (
              <span key={d.start}>
                <i className="wd">{new Date(d.start).toLocaleDateString('ru', { weekday: 'short' }).slice(0, 2)}</i>
                <i className="num">{new Date(d.start).getDate()}</i>
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

      <div className="st-tiles">
        <div>Сегодня<b>{hm(today.min)}</b><small>{today.count} {sessionsWord(today.count)}</small></div>
        <div>Серия<b>{s} {plural(s, ['день', 'дня', 'дней'])}</b><small>подряд</small></div>
        <div>Всего<b>{hm(totalMin(history))}</b><small>фокуса</small></div>
      </div>
    </Panel>
  )
}
