import { useEffect, useRef } from 'react'
import Panel from './Panel.tsx'

interface Props {
  open: boolean
  title: string
  text: string
  action: string
  onConfirm: () => void
  onClose: () => void
}

/** Small centered confirm dialog. Y / Enter confirm, N / Esc cancel (physical keys, any layout). */
export default function Confirm({ open, title, text, action, onConfirm, onClose }: Props) {
  const cb = useRef({ onConfirm, onClose })
  cb.current = { onConfirm, onClose }
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      // repeat: holding the key that opened the dialog must not answer it
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.code === 'KeyY') cb.current.onConfirm()
      else if (e.code === 'KeyN') cb.current.onClose()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <Panel open={open} title={title} side="center" onClose={onClose}>
      <p className="confirm-text">{text}</p>
      <div className="confirm-actions">
        <button className="confirm-cancel press" onClick={onClose}>Отмена <kbd>N</kbd></button>
        <button className="confirm-ok press" onClick={onConfirm} data-autofocus>{action} <kbd>Y</kbd></button>
      </div>
    </Panel>
  )
}
