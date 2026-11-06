import { categories, exercises, type Category } from './exercises.ts'
import type { Settings as S } from './timer.ts'

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
    <div className={`fixed inset-0 z-10 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open} inert={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <aside
        role="dialog"
        aria-label="Настройки"
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        className={`absolute inset-y-0 right-0 w-full max-w-[380px] overflow-y-auto border-l border-white/10 bg-[#141113]/95 p-6 transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Настройки</h2>
          <button onClick={onClose} aria-label="Закрыть" className="press grid size-9 place-items-center rounded-full text-(--muted) hover:bg-white/5 hover:text-white">
            ✕
          </button>
        </div>

        <Section title="Длительность, минут">
          <Num label="Фокус" value={s.focusMin} onChange={(v) => set('focusMin', clamp(v, 1, 180))} />
          <Num label="Короткий перерыв" value={s.shortMin} onChange={(v) => set('shortMin', clamp(v, 1, 60))} />
          <Num label="Длинный перерыв" value={s.longMin} onChange={(v) => set('longMin', clamp(v, 1, 90))} />
          <Num label="Сессий до длинного перерыва" value={s.longEvery} onChange={(v) => set('longEvery', clamp(v, 1, 12))} />
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
      </aside>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="mb-3 text-sm font-medium text-white/90">{title}</h3>
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
        className="w-20 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1.5 text-right tabular-nums outline-none focus:border-(--accent)"
      />
    </label>
  )
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg py-1.5 text-[15px] hover:text-white">
      <input type="checkbox" checked={checked} onChange={onChange} className="size-4" />
      <span>{label}</span>
    </label>
  )
}
