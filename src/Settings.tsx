import { useId, useState } from 'react'
import { categories, exercises, type Category } from './exercises.ts'
import { palettes, type Palette, type Settings as S } from './timer.ts'
import Panel from './Panel.tsx'
import { langNames, langs, t, tr } from './i18n.ts'

interface Props {
  open: boolean
  settings: S
  onClose: () => void
  onChange: (s: S) => void
  onExport: () => void
  onImport: (file: File) => Promise<string> // resolves to a status message
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(v) || min))

export default function Settings({ open, settings: s, onClose, onChange, onExport, onImport }: Props) {
  const [msg, setMsg] = useState('')
  const set = <K extends keyof S>(k: K, v: S[K]) => onChange({ ...s, [k]: v })
  const toggleEx = (id: string) =>
    set('exercises', s.exercises.includes(id) ? s.exercises.filter((x) => x !== id) : [...s.exercises, id])

  return (
    <Panel open={open} title={t('Настройки', 'Settings')} side="right" onClose={onClose}>
      <Section no="00" title={t('Тема', 'Theme')}>
        <div className="seg">
          {(['system', 'dark', 'light'] as const).map((th) => (
            <button key={th} aria-pressed={s.theme === th} onClick={() => set('theme', th)} className="press">
              {{ system: t('Авто', 'Auto'), dark: t('Тёмная', 'Dark'), light: t('Светлая', 'Light') }[th]}
            </button>
          ))}
        </div>
      </Section>

      <Section no="00" title={t('Язык', 'Language')}>
        <div className="palettes langs">
          {langs.map((l) => (
            <button key={l} lang={l} aria-pressed={s.lang === l} onClick={() => set('lang', l)} className="pal press">
              {langNames[l]}
            </button>
          ))}
        </div>
      </Section>

      <Section no="00" title={t('Палитра', 'Palette')}>
        <div className="palettes">
          {(Object.keys(palettes) as Palette[]).map((id) => (
            <button
              key={id}
              data-palette={id}
              className="pal press"
              aria-pressed={s.palette === id}
              onClick={() => set('palette', id)}
              style={id === 'custom' ? ({ '--c-focus': s.customColors.focus, '--c-short': s.customColors.short, '--c-long': s.customColors.long } as React.CSSProperties) : undefined}
            >
              <span className="pal-dots" aria-hidden><i className="f" /><i className="s" /><i className="l" /></span>
              {tr(palettes[id])}
            </button>
          ))}
        </div>
        {s.palette === 'custom' && (
          <div className="custom-colors fade-up">
            {(['focus', 'short', 'long'] as const).map((k) => {
              const label = { focus: t('Фокус', 'Focus'), short: t('Короткий перерыв', 'Short break'), long: t('Длинный перерыв', 'Long break') }[k]
              return (
                <label key={k} className="custom-color">
                  <input
                    type="color"
                    value={s.customColors[k]}
                    onChange={(e) => set('customColors', { ...s.customColors, [k]: e.currentTarget.value })}
                    aria-label={label}
                  />
                  <span>{label}</span>
                </label>
              )
            })}
          </div>
        )}
      </Section>

      <Section no="01" title={t('Длительность', 'Durations')}>
        <div className="set-group">
          <Num label={t('Фокус, мин', 'Focus, min')} value={s.focusMin} min={1} max={180} onChange={(v) => set('focusMin', v)} />
          <Num label={t('Короткий перерыв', 'Short break')} value={s.shortMin} min={1} max={60} onChange={(v) => set('shortMin', v)} />
          <Num label={t('Длинный перерыв', 'Long break')} value={s.longMin} min={1} max={90} onChange={(v) => set('longMin', v)} />
          <Num label={t('Сессий до длинного', 'Sessions before long')} value={s.longEvery} min={1} max={12} onChange={(v) => set('longEvery', v)} />
        </div>
      </Section>

      <Section no="02" title={t('Поведение', 'Behavior')}>
        <div className="set-group">
          <Switch label={t('Автостарт перерывов', 'Auto-start breaks')} on={s.autoStartBreaks} onChange={() => set('autoStartBreaks', !s.autoStartBreaks)} />
          <Switch label={t('Автостарт фокуса', 'Auto-start focus')} on={s.autoStartFocus} onChange={() => set('autoStartFocus', !s.autoStartFocus)} />
          <Switch label={t('Звук', 'Sound')} on={s.sound} onChange={() => set('sound', !s.sound)} />
          {s.sound && (
            <div className="set-nested fade-up">
              <Switch label={t('Тиканье во время фокуса', 'Ticking during focus')} on={s.ticking} onChange={() => set('ticking', !s.ticking)} />
            </div>
          )}
        </div>
      </Section>

      <Section no="03" title={t('Упражнения', 'Exercises')}>
        <p className="set-note">{t('Выбранные чередуются в перерывах. Ничего не выбрано — обычный отдых.', 'Selected ones rotate between breaks. None selected means a plain rest.')}</p>
        {(Object.keys(categories) as Category[]).map((c) => (
          <div key={c}>
            <div className="set-sub">{tr(categories[c])}</div>
            <div className="chips">
              {exercises.filter((e) => e.category === c).map((e) => (
                <button key={e.id} className="chip press" aria-pressed={s.exercises.includes(e.id)} onClick={() => toggleEx(e.id)}>
                  {tr(e.title)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section no="04" title={t('Данные', 'Data')}>
        <p className="set-note">{t('Все данные хранятся только в этом браузере. Файл переносит историю и настройки на другое устройство, при импорте история объединяется.', 'All data stays in this browser. A file moves history and settings to another device; import merges the history.')}</p>
        <div className="seg">
          <button onClick={onExport} className="press">{t('Экспорт', 'Export')}</button>
          <label className="press seg-label">
            {t('Импорт', 'Import')}
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={async (e) => {
                const f = e.currentTarget.files?.[0]
                e.currentTarget.value = ''
                if (f) setMsg(await onImport(f))
              }}
            />
          </label>
        </div>
        {msg && <p className="set-note fade-up mt-2" role="status">{msg}</p>}
      </Section>

    </Panel>
  )
}

function Section({ no, title, children }: { no: string; title: string; children: React.ReactNode }) {
  return (
    <section className="set-sec">
      <span className="set-no">{no}</span>
      <div>
        <h3 className="set-h">{title}</h3>
        {children}
      </div>
    </section>
  )
}

function Num({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const commit = (v: number) => onChange(clamp(v, min, max))
  return (
    <div className="set-row">
      <span>{label}</span>
      <span className="stepper">
        <button className="press" aria-label={`${label}: ${t('меньше', 'less')}`} onClick={() => commit(value - 1)} disabled={value <= min}>−</button>
        <input
          type="number"
          inputMode="numeric"
          aria-label={label}
          defaultValue={value}
          key={value}
          onBlur={(e) => commit(e.currentTarget.valueAsNumber)}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        <button className="press" aria-label={`${label}: ${t('больше', 'more')}`} onClick={() => commit(value + 1)} disabled={value >= max}>+</button>
      </span>
    </div>
  )
}

function Switch({ label, on, onChange }: { label: string; on: boolean; onChange: () => void }) {
  const id = useId()
  return (
    <div className="set-row">
      <span id={id}>{label}</span>
      <button role="switch" aria-checked={on} aria-labelledby={id} onClick={onChange} className="switch press" />
    </div>
  )
}
