import { lastDays, streak, totalMin, weekCompare } from './stats.ts'
import type { SessionRecord } from './storage.ts'
import Panel from './Panel.tsx'
import { getLang, plural, sessionsWord, t } from './i18n.ts'

interface Props {
  open: boolean
  history: SessionRecord[]
  onClose: () => void
}

const hm = (min: number) => {
  const m = t('мин', 'min'), h = t('ч', 'h')
  return min < 60 ? `${Math.round(min)} ${m}` : `${Math.floor(min / 60)} ${h} ${Math.round(min % 60)} ${m}`
}
const dayLabel = (ms: number) => new Date(ms).toLocaleDateString(getLang(), { weekday: 'short', day: 'numeric', month: 'short' })

export default function Stats({ open, history, onClose }: Props) {
  const now = Date.now()
  const days = lastDays(history, now, 14)
  const today = days[days.length - 1]
  const week = weekCompare(days)
  const max = Math.max(...days.map((d) => d.min))
  const s = streak(history, now)

  return (
    <Panel open={open} title={t('Статистика', 'Stats')} side="left" onClose={onClose}>
      <div className="st-hero">
        <span>{t('Фокус за 7 дней', 'Focus, last 7 days')}</span>
        <b>{hm(week.cur)}</b>
        {week.pct !== null && <em>{week.pct >= 0 ? '▲' : '▼'} {Math.abs(week.pct)}% {t('к прошлой неделе', 'vs previous week')}</em>}
      </div>

      {max === 0 ? (
        <p className="set-note mt-6">{t('Завершите первую фокус-сессию, и здесь появится график.', 'Finish your first focus session to see the chart.')}</p>
      ) : (
        <>
          {/* key on `open` replays the grow animation each time the panel opens */}
          <div key={String(open)} className="st-chart" aria-label={t('Минуты фокуса за 14 дней', 'Focus minutes, last 14 days')}>
            {days.map((d, i) => {
              const label = `${dayLabel(d.start)}: ${Math.round(d.min)} ${t('мин', 'min')}, ${d.count} ${sessionsWord(d.count)}`
              return (
                <div key={d.start} tabIndex={0} aria-label={label} className={`st-col ${i === days.length - 1 ? 'today' : ''}`}>
                  <div className="st-track" />
                  <div className={`st-bar ${d.min ? '' : 'zero'}`} style={{ height: d.min ? `${Math.max(4, (d.min / max) * 100)}%` : undefined, animationDelay: `${i * 25}ms` }} />
                  <div className="st-tip">
                    <span>{dayLabel(d.start)}</span>
                    {Math.round(d.min)} {t('мин', 'min')} · {d.count} {sessionsWord(d.count)}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="st-days" aria-hidden>
            {days.map((d) => (
              <span key={d.start}>
                <i className="wd">{new Date(d.start).toLocaleDateString(getLang(), { weekday: 'short' }).slice(0, 2)}</i>
                <i className="num">{new Date(d.start).getDate()}</i>
              </span>
            ))}
          </div>
          <table className="sr-only">
            <caption>{t('Минуты фокуса по дням', 'Focus minutes per day')}</caption>
            <tbody>
              {days.map((d) => (
                <tr key={d.start}><th>{dayLabel(d.start)}</th><td>{Math.round(d.min)} {t('мин', 'min')}</td><td>{d.count} {sessionsWord(d.count)}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div className="st-tiles">
        <div>{t('Сегодня', 'Today')}<b>{hm(today.min)}</b><small>{today.count} {sessionsWord(today.count)}</small></div>
        <div>{t('Серия', 'Streak')}<b>{s} {plural(s, ['день', 'дня', 'дней'], ['day', 'days'])}</b><small>{t('подряд', 'in a row')}</small></div>
        <div>{t('Всего', 'Total')}<b>{hm(totalMin(history))}</b><small>{t('фокуса', 'focus')}</small></div>
      </div>
    </Panel>
  )
}
