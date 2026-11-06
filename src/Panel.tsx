import { useEffect, useRef } from 'react'

interface Props {
  open: boolean
  title: string
  side: 'left' | 'right' | 'center'
  onClose: () => void
  children: React.ReactNode
}

export default function Panel({ open, title, side, onClose, children }: Props) {
  const ref = useRef<HTMLElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    if (!open) return
    // Prefer an explicit target (e.g. the confirm button) over the dialog itself.
    ;(ref.current?.querySelector<HTMLElement>('[data-autofocus]') ?? ref.current)?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close.current()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className={`panel-root ${open ? 'open' : ''}`} data-side={side} aria-hidden={!open} inert={!open}>
      <div className="panel-scrim" onClick={onClose} />
      <aside ref={ref} tabIndex={-1} role="dialog" aria-label={title} className="panel">
        <div className="panel-head">
          <h2>{title}</h2>
          <button onClick={onClose} aria-label="Закрыть" className="panel-x press">✕</button>
        </div>
        {children}
      </aside>
    </div>
  )
}
