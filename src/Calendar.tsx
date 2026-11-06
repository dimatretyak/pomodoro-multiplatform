import { useMemo, useState } from 'react'
import { byTask, dayRecords, focusByDay, midnight, monthCells } from './stats.ts'
import type { SessionRecord } from './storage.ts'
import { getLang, sessionsWord, t } from './i18n.ts'
import { phaseLabel } from './face.tsx'
import Panel from './Panel.tsx'

interface Props {
  open: boolean
  history: SessionRecord[]
  onClose: () => void
}

const fmtMin = (m: number) => {
  const r = Math.round(m)
  return r < 60 ? `${r} ${t('мин', 'min')}` : `${Math.floor(r / 60)} ${t('ч', 'h')} ${r % 60} ${t('мин', 'min')}`
}

export default function Calendar({ open, history, onClose }: Props) {
  const today = midnight(Date.now())
  const [cursor, setCursor] = useState(() => ({ y: new Date().getFullYear(), m: new Date().getMonth() }))
  const [day, setDay] = useState(today)
  const lang = getLang()
  const weekStart = lang === 'en' ? 0 : 1
  const cells = monthCells(cursor.y, cursor.m, weekStart)
  const perDay = useMemo(() => focusByDay(history), [history])
  const max = Math.max(1, ...cells.map((c) => (c ? perDay.get(c) ?? 0 : 0)))
  const recs = useMemo(() => dayRecords(history, day), [history, day])
  const focus = recs.filter((r) => r.phase === 'focus' && r.completed)
  const tasks = byTask(recs)
  const time = (ms: number) => new Date(ms).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })
  const shift = (d: number) => setCursor(({ y, m }) => ({ y: m + d < 0 ? y - 1 : m + d > 11 ? y + 1 : y, m: (m + d + 12) % 12 }))
  const isCurrentMonth = cursor.y === new Date().getFullYear() && cursor.m === new Date().getMonth()

  return (
    <Panel open={open} title={t('Календарь', 'Calendar')} side="left" onClose={onClose}>
      <div className="cal-head">
        <button className="cal-nav press" onClick={() => shift(-1)} aria-label={t('Предыдущий месяц', 'Previous month')}>‹</button>
        <span aria-live="polite">
          {new Date(cursor.y, cursor.m, 1).toLocaleDateString(lang, { month: 'long' })} <i>{cursor.y}</i>
        </span>
        <button className="cal-nav press" onClick={() => shift(1)} disabled={isCurrentMonth} aria-label={t('Следующий месяц', 'Next month')}>›</button>
      </div>

      <div className="cal-grid" role="grid">
        {Array.from({ length: 7 }, (_, i) => (
          <span key={i} className="cal-wd" aria-hidden>
            {new Date(2024, 0, 7 + i + weekStart).toLocaleDateString(lang, { weekday: 'short' }).slice(0, 2)}
          </span>
        ))}
        {cells.map((c, i) => {
          if (c === null) return <span key={`b${i}`} />
          const min = perDay.get(c) ?? 0
          const level = min ? Math.ceil((min / max) * 4) : 0
          const label = `${new Date(c).toLocaleDateString(lang, { day: 'numeric', month: 'long' })}: ${fmtMin(min)}`
          return (
            <button
              key={c}
              className={`cal-day press lv${level}${c === today ? ' today' : ''}`}
              aria-pressed={c === day}
              aria-label={label}
              title={label}
              disabled={c > today}
              onClick={() => setDay(c)}
            >
              {new Date(c).getDate()}
            </button>
          )
        })}
      </div>

      <div className="cal-sum">
        <b>{new Date(day).toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' })}</b>
        <span>
          {fmtMin(focus.reduce((a, r) => a + (r.endedAt - r.startedAt) / 60_000, 0))} · {focus.length} {sessionsWord(focus.length)}
        </span>
      </div>

      {recs.length === 0 ? (
        <p className="set-note mt-3">{t('В этот день сессий не было.', 'No sessions on this day.')}</p>
      ) : (
        <>
          {tasks.length > 0 && (
            <div className="cal-tasks">
              {tasks.map(([name, min]) => (
                <div key={name} className="cal-task">
                  <span className={name ? '' : 'muted'}>{name || t('Без задачи', 'No task')}</span>
                  <b>{fmtMin(min)}</b>
                  <i style={{ width: `${(min / tasks[0][1]) * 100}%` }} />
                </div>
              ))}
            </div>
          )}
          <ol className="cal-list">
            {recs.map((r) => (
              <li key={r.id} data-phase={r.phase} className={r.completed ? '' : 'skipped'}>
                <span className="cal-time">{time(r.startedAt)}–{time(r.endedAt)}</span>
                <span className="cal-what">
                  {r.phase === 'focus' ? r.task || t('Фокус', 'Focus') : phaseLabel(r.phase)}
                  {!r.completed && <em>{t('прервано', 'stopped')}</em>}
                </span>
                <span className="cal-dur">{fmtMin((r.endedAt - r.startedAt) / 60_000)}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </Panel>
  )
}
