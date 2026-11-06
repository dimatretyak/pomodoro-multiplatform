import { useState } from 'react'
import Panel from './Panel.tsx'
import { getLang, t } from './i18n.ts'
import { TASK_MAX, type SessionRecord } from './storage.ts'

interface Props {
  record: SessionRecord | null
  recentTasks: string[]
  onSave: (id: string, patch: { task: string }) => void
  onClose: () => void
}

/** Edit one history record. A form so tags/client/rate can be added as fields later. */
export default function RecordEditor({ record, recentTasks, onSave, onClose }: Props) {
  return (
    <Panel open={record !== null} title={t('Изменить сессию', 'Edit session')} side="center" onClose={onClose}>
      {/* key: reset the draft whenever another record is opened */}
      {record && <Form key={record.id} record={record} recentTasks={recentTasks} onSave={onSave} onClose={onClose} />}
    </Panel>
  )
}

function Form({ record, recentTasks, onSave, onClose }: Props & { record: SessionRecord }) {
  const [task, setTask] = useState(record.task ?? '')
  const lang = getLang()
  const time = (ms: number) => new Date(ms).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })
  const min = Math.round((record.endedAt - record.startedAt) / 60_000)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave(record.id, { task })
      }}
    >
      <p className="rec-meta">
        {new Date(record.startedAt).toLocaleDateString(lang, { weekday: 'short', day: 'numeric', month: 'long' })} · {time(record.startedAt)}–{time(record.endedAt)} · {min} {t('мин', 'min')}
        {!record.completed && <em> · {t('прервано', 'stopped')}</em>}
      </p>
      <label className="rec-field">
        <span>{t('Над чем работали', 'What you worked on')}</span>
        <input
          value={task}
          onChange={(e) => setTask(e.currentTarget.value)}
          placeholder={t('Без задачи', 'No task')}
          list="rec-tasks"
          maxLength={TASK_MAX}
          autoComplete="off"
          spellCheck={false}
          data-autofocus
        />
        <datalist id="rec-tasks">{recentTasks.map((x) => <option key={x} value={x} />)}</datalist>
      </label>
      <div className="confirm-actions">
        <button type="button" className="confirm-cancel press" onClick={onClose}>{t('Отмена', 'Cancel')}</button>
        <button type="submit" className="confirm-ok press">{t('Сохранить', 'Save')}</button>
      </div>
    </form>
  )
}
