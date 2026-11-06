import { categories, exercises, type Category } from './exercises.ts'
import type { Settings as S } from './timer.ts'
import Panel from './Panel.tsx'

interface Props {
  open: boolean
  settings: S
  onClose: () => void
  onChange: (s: S) => void
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(v) || min))

export default function Settings({ open, settings: s, onClose, onChange }: Props) {
  const set = <K extends keyof S>(k: K, v: S[K]) => onChange({ ...s, [k]: v })
  const toggleEx = (id: string) =>
    set('exercises', s.exercises.includes(id) ? s.exercises.filter((x) => x !== id) : [...s.exercises, id])

  return (
    <Panel open={open} title="Настройки" side="right" onClose={onClose}>
        <Section title="Длительность, минут">
          <Num label="Фокус" value={s.focusMin} onChange={(v) => set('focusMin', clamp(v, 1, 180))} />
          <Num label="Короткий перерыв" value={s.shortMin} onChange={(v) => set('shortMin', clamp(v, 1, 60))} />
          <Num label="Длинный перерыв" value={s.longMin} onChange={(v) => set('longMin', clamp(v, 1, 90))} />
          <Num label="Сессий до длинного перерыва" value={s.longEvery} onChange={(v) => set('longEvery', clamp(v, 1, 12))} />
        </Section>

        <Section title="Тема">
          <div className="grid grid-cols-3 gap-1 rounded-xl border border-(--line) bg-(--surface) p-1 text-sm">
            {(['system', 'dark', 'light'] as const).map((t) => (
              <button
                key={t}
                onClick={() => set('theme', t)}
                className={`press rounded-lg py-1.5 ${s.theme === t ? 'bg-(--accent) font-medium text-[#0e0b0d]' : 'text-(--muted) hover:text-(--fg)'}`}
              >
                {{ system: 'Системная', dark: 'Тёмная', light: 'Светлая' }[t]}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Поведение">
          <Check label="Автостарт перерывов" checked={s.autoStartBreaks} onChange={() => set('autoStartBreaks', !s.autoStartBreaks)} />
          <Check label="Автостарт фокуса после перерыва" checked={s.autoStartFocus} onChange={() => set('autoStartFocus', !s.autoStartFocus)} />
          <Check label="Звуковой сигнал" checked={s.sound} onChange={() => set('sound', !s.sound)} />
        </Section>

        <Section title="Упражнения в перерывах">
          <p className="-mt-1 mb-3 text-[13px] text-(--muted)">
            Выбранные упражнения чередуются. Ничего не выбрано — обычный таймер отдыха.
          </p>
          {(Object.keys(categories) as Category[]).map((c) => (
            <div key={c} className="mb-3">
              <div className="mb-1 text-xs font-medium tracking-wider text-(--muted) uppercase">{categories[c]}</div>
              {exercises.filter((e) => e.category === c).map((e) => (
                <Check key={e.id} label={e.title} checked={s.exercises.includes(e.id)} onChange={() => toggleEx(e.id)} />
              ))}
            </div>
          ))}
        </Section>

        <p className="mt-6 text-xs leading-relaxed text-(--muted)">
          Все данные хранятся только в этом браузере. Пробел — старт/пауза.
        </p>
    </Panel>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="mb-3 text-sm font-medium text-(--fg)">{title}</h3>
      {children}
    </section>
  )
}

function Num({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center justify-between py-1.5 text-[15px]">
      <span>{label}</span>
      <input
        type="number"
        inputMode="numeric"
        defaultValue={value}
        key={value}
        onBlur={(e) => onChange(e.currentTarget.valueAsNumber)}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className="w-20 rounded-lg border border-(--line) bg-(--surface) px-3 py-1.5 text-right tabular-nums outline-none focus:border-(--accent)"
      />
    </label>
  )
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg py-1.5 text-[15px] hover:text-(--fg)">
      <input type="checkbox" checked={checked} onChange={onChange} className="size-4" />
      <span>{label}</span>
    </label>
  )
}
