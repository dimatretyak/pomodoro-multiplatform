import { t, tr } from './i18n.ts'
import { actionLabel, IconCalendar, IconKeys, IconPause, IconPlay, IconSettings, IconStats, split, stepInfo, type FaceProps } from './face.tsx'

const TICKS = Array.from({ length: 60 }, (_, i) => {
  const a = (i / 60) * Math.PI * 2, major = i % 5 === 0, r1 = major ? 124 : 132, r2 = 144
  return { major, x1: 152 + Math.sin(a) * r1, y1: 152 - Math.cos(a) * r1, x2: 152 + Math.sin(a) * r2, y2: 152 - Math.cos(a) * r2 }
})
const label = (p: FaceProps['phase']) => ({ focus: t('ФОКУС', 'FOCUS'), short: t('ПЕРЕРЫВ', 'BREAK'), long: t('ДЛИННЫЙ ПЕРЕРЫВ', 'LONG BREAK') })[p]

export default function Instrument(p: FaceProps) {
  const frac = 1 - p.left / p.total
  const lit = Math.round(frac * 60)
  const { mm, ss } = split(p.left)
  const st = p.exercise ? stepInfo(p.exercise, p.elapsed) : null

  return (
    <div className="ins">
      <header className="ins-top">
        <button onClick={p.onStats} aria-label={t('Статистика', 'Stats')} title={t('Статистика (A)', 'Stats (A)')} className="ins-icon press"><IconStats /></button>
        <button onClick={p.onCalendar} aria-label={t('Календарь', 'Calendar')} title={t('Календарь (C)', 'Calendar (C)')} className="ins-icon press"><IconCalendar /></button>
        <span>POMIDORO</span>
        <span><i className="ins-led" /> {String(Math.min(p.done + 1, p.longEvery)).padStart(2, '0')} / {String(p.longEvery).padStart(2, '0')}</span>
        <button onClick={p.onHelp} aria-label={t('Горячие клавиши', 'Keyboard shortcuts')} title={t('Горячие клавиши (?)', 'Keyboard shortcuts (?)')} className="ins-icon ins-keys press"><IconKeys /></button>
        <button onClick={p.onSettings} aria-label={t('Настройки', 'Settings')} title={t('Настройки (S)', 'Settings (S)')} className="ins-icon press"><IconSettings /></button>
      </header>

      <label className="ins-task-wrap">
        <span className="sr-only">{t('Над чем работаем', 'What are you working on')}</span>
        <input
          className="ins-task select-text"
          value={p.task}
          onChange={(e) => p.onTask(e.currentTarget.value)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === 'Escape') && e.currentTarget.blur()}
          placeholder={t('Над чем работаем?', 'What are you working on?')}
          list="ins-tasks"
          maxLength={120}
          enterKeyHint="done"
          autoComplete="off"
          spellCheck={false}
          title={t('Задача (T)', 'Task (T)')}
        />
        <datalist id="ins-tasks">{p.recentTasks.map((x) => <option key={x} value={x} />)}</datalist>
      </label>

      <div className="ins-dial" key={p.phase}>
        <svg viewBox="0 0 304 304" aria-hidden>
          {TICKS.map((t, i) => (
            <line key={i} className={`ins-tick${t.major ? ' major' : ''}${i < lit ? ' lit' : ''}`} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />
          ))}
          <path className="ins-hand" d="M152 2 l6 10 h-12z" style={{ rotate: `${frac * 360}deg` }} />
        </svg>
        <div className="ins-center">
          {p.exercise ? (
            st?.step.breath ? (
              <>
                <div className="ins-breath" style={{ scale: st.big ? 1 : 0.6, transitionDuration: `${st.step.sec}s` }} />
                <div className="ins-breath two" style={{ scale: st.big ? 1 : 0.6, transitionDuration: `${st.step.sec}s` }} />
                <div className="relative">
                  <div className="ins-lbl" key={st.index}>{tr(st.step.text).toUpperCase()}</div>
                  <div className="ins-digits sm">{st.left}</div>
                </div>
              </>
            ) : st ? (
              <div className="ins-step fade-up" key={st.index}>
                <div className="ins-lbl">{t('ШАГ', 'STEP')} {st.index + 1} / {st.count}</div>
                <p>{tr(st.step.text)}</p>
                <div className="ins-digits sm">{st.left}</div>
              </div>
            ) : (
              <div className="ins-step fade-up"><div className="ins-lbl">{t('ГОТОВО', 'DONE')}</div><p>{t('Просто отдохните до конца перерыва', 'Just rest until the break ends')}</p></div>
            )
          ) : (
            <div>
              <div className="ins-lbl">{label(p.phase)}</div>
              <div className="ins-digits">
                {mm}<span className={p.running ? 'ins-colon blink' : 'ins-colon'}>:</span>{ss}
              </div>
              <div className="ins-sub">{p.running ? (p.phase === 'focus' ? t('ДО ПЕРЕРЫВА', 'UNTIL BREAK') : t('ОТДЫХ', 'REST')) : t('НАЖМИТЕ СТАРТ', 'PRESS START')}</div>
            </div>
          )}
        </div>
      </div>

      {p.exercise && (
        <div className="ins-meta">
          {tr(p.exercise.title).toUpperCase()} · {mm}:{ss}
          {p.canSwap && <button onClick={p.onSwap} className="ins-link" title={t('Другое упражнение (E)', 'Another exercise (E)')}>{t('ДРУГОЕ', 'ANOTHER')}</button>}
        </div>
      )}

      <div className="ins-ctrl">
        <button className="ins-txt press" onClick={p.onReset} disabled={!p.started} title={p.started ? t('Сброс (R)', 'Reset (R)') : t('Нечего сбрасывать: фаза не начата', 'Nothing to reset yet')}>{t('СБРОС', 'RESET')}</button>
        <button className="ins-play press" onClick={p.onToggle} aria-label={actionLabel(p)} title={`${actionLabel(p)} (${t('пробел', 'space')})`}>
          {p.running ? <IconPause /> : <IconPlay />}
        </button>
        <button className="ins-txt press" onClick={p.onSkip} title={t('Далее (N)', 'Next (N)')}>{t('ДАЛЕЕ', 'NEXT')}</button>
      </div>

      <div className="ins-segs" aria-label={t(`Сессий в цикле: ${p.done} из ${p.longEvery}`, `Sessions in cycle: ${p.done} of ${p.longEvery}`)}>
        {Array.from({ length: p.longEvery }, (_, i) => <span key={i} className={i < p.done ? 'on' : i === p.done && p.phase === 'focus' ? 'cur' : ''} />)}
      </div>
      <div className="ins-foot">{t(`СЕГОДНЯ ${p.today.count} · ${p.today.min} МИН · СЕРИЯ ${p.streak} ДН`, `TODAY ${p.today.count} · ${p.today.min} MIN · STREAK ${p.streak} D`)}</div>
    </div>
  )
}
