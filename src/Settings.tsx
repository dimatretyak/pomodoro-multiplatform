import { useId, useState } from 'react'
import { categories, exercises, type Category } from './exercises.ts'
import { palettes, type Palette, type Settings as S } from './timer.ts'
import Panel from './Panel.tsx'

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
    <Panel open={open} title="Настройки" side="right" onClose={onClose}>
      <Section no="00" title="Палитра">
        <div className="palettes">
          {(Object.keys(palettes) as Palette[]).map((id) => (
            <button key={id} data-palette={id} className="pal press" aria-pressed={s.palette === id} onClick={() => set('palette', id)}>
              <span className="pal-dots" aria-hidden><i className="f" /><i className="s" /><i className="l" /></span>
              {palettes[id]}
            </button>
          ))}
        </div>
        <p className="set-note mt-2">Цвета фокуса, короткого и длинного перерыва.</p>
      </Section>

      <Section no="01" title="Длительность">
        <div className="set-group">
          <Num label="Фокус, мин" value={s.focusMin} min={1} max={180} onChange={(v) => set('focusMin', v)} />
          <Num label="Короткий перерыв" value={s.shortMin} min={1} max={60} onChange={(v) => set('shortMin', v)} />
          <Num label="Длинный перерыв" value={s.longMin} min={1} max={90} onChange={(v) => set('longMin', v)} />
          <Num label="Сессий до длинного" value={s.longEvery} min={1} max={12} onChange={(v) => set('longEvery', v)} />
        </div>
      </Section>

      <Section no="02" title="Поведение">
        <div className="set-group">
          <Switch label="Автостарт перерывов" on={s.autoStartBreaks} onChange={() => set('autoStartBreaks', !s.autoStartBreaks)} />
          <Switch label="Автостарт фокуса" on={s.autoStartFocus} onChange={() => set('autoStartFocus', !s.autoStartFocus)} />
          <Switch label="Звук" on={s.sound} onChange={() => set('sound', !s.sound)} />
        </div>
      </Section>

      <Section no="03" title="Упражнения">
        <p className="set-note">Выбранные чередуются в перерывах. Ничего не выбрано — обычный отдых.</p>
        {(Object.keys(categories) as Category[]).map((c) => (
          <div key={c}>
            <div className="set-sub">{categories[c]}</div>
            <div className="chips">
              {exercises.filter((e) => e.category === c).map((e) => (
                <button key={e.id} className="chip press" aria-pressed={s.exercises.includes(e.id)} onClick={() => toggleEx(e.id)}>
                  {e.title}
                </button>
              ))}
            </div>
          </div>
        ))}
      </Section>

      <Section no="04" title="Данные">
        <p className="set-note">Файл переносит историю и настройки на другое устройство. При импорте история объединяется.</p>
        <div className="seg">
          <button onClick={onExport} className="press">Экспорт</button>
          <label className="press seg-label">
            Импорт
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

      <p className="set-note mt-6">Все данные хранятся только в этом браузере. Пробел — старт/пауза.</p>
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
        <button className="press" aria-label={`${label}: меньше`} onClick={() => commit(value - 1)} disabled={value <= min}>−</button>
        <input
          type="number"
          inputMode="numeric"
          aria-label={label}
          defaultValue={value}
          key={value}
          onBlur={(e) => commit(e.currentTarget.valueAsNumber)}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        <button className="press" aria-label={`${label}: больше`} onClick={() => commit(value + 1)} disabled={value >= max}>+</button>
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
