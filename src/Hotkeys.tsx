import Panel from './Panel.tsx'
import { t, tr, type L } from './i18n.ts'

// Keep in sync with the keydown handler in App.tsx.
const KEYS: [L[], L][] = [
  [[['Пробел', 'Space']], ['Старт / пауза', 'Start / pause']],
  [[['R', 'R']], ['Сброс текущей фазы', 'Reset the current phase']],
  [[['N', 'N'], ['→', '→']], ['Далее: следующая фаза', 'Next phase']],
  [[['E', 'E']], ['Другое упражнение (в перерыве)', 'Another exercise (on a break)']],
  [[['T', 'T']], ['Ввести задачу', 'Edit the task']],
  [[['A', 'A']], ['Статистика', 'Stats']],
  [[['C', 'C']], ['Календарь', 'Calendar']],
  [[['S', 'S']], ['Настройки', 'Settings']],
  [[['?', '?']], ['Эта справка', 'This help']],
  [[['Y', 'Y'], ['N', 'N']], ['Да / нет в окне подтверждения', 'Yes / no in a confirm dialog']],
  [[['Esc', 'Esc']], ['Закрыть окно', 'Close the dialog']],
]

export default function Hotkeys({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Panel open={open} title={t('Горячие клавиши', 'Keyboard shortcuts')} side="center" onClose={onClose}>
      <dl className="keys">
        {KEYS.map(([keys, what]) => (
          <div key={what[1]} className="keys-row">
            <dt>{keys.map((k, i) => <span key={k[1]}>{i > 0 && <i>{keys[0][1] === 'Y' ? '/' : t('или', 'or')}</i>}<kbd>{tr(k)}</kbd></span>)}</dt>
            <dd>{tr(what)}</dd>
          </div>
        ))}
      </dl>
      <p className="set-note mt-4">{t('Работают на любой раскладке, в том числе на русской.', 'They work with any keyboard layout.')}</p>
    </Panel>
  )
}
