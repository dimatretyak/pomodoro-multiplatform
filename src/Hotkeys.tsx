import Panel from './Panel.tsx'

// Keep in sync with the keydown handler in App.tsx.
const KEYS: [string[], string][] = [
  [['Пробел'], 'Старт / пауза'],
  [['R'], 'Сброс текущей фазы'],
  [['N', '→'], 'Далее: следующая фаза'],
  [['E'], 'Другое упражнение (в перерыве)'],
  [['A'], 'Статистика'],
  [['S'], 'Настройки'],
  [['?'], 'Эта справка'],
  [['Esc'], 'Закрыть окно'],
]

export default function Hotkeys({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Panel open={open} title="Горячие клавиши" side="center" onClose={onClose}>
      <dl className="keys">
        {KEYS.map(([keys, what]) => (
          <div key={what} className="keys-row">
            <dt>{keys.map((k, i) => <span key={k}>{i > 0 && <i>или</i>}<kbd>{k}</kbd></span>)}</dt>
            <dd>{what}</dd>
          </div>
        ))}
      </dl>
      <p className="set-note mt-4">Работают на любой раскладке, в том числе на русской.</p>
    </Panel>
  )
}
