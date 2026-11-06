import Panel from './Panel.tsx'

interface Props {
  open: boolean
  title: string
  text: string
  action: string
  onConfirm: () => void
  onClose: () => void
}

/** Small centered confirm dialog. Enter confirms (button is focused), Esc cancels. */
export default function Confirm({ open, title, text, action, onConfirm, onClose }: Props) {
  return (
    <Panel open={open} title={title} side="center" onClose={onClose}>
      <p className="confirm-text">{text}</p>
      <div className="confirm-actions">
        <button className="confirm-cancel press" onClick={onClose}>Отмена</button>
        <button className="confirm-ok press" onClick={onConfirm} data-autofocus>{action}</button>
      </div>
    </Panel>
  )
}
