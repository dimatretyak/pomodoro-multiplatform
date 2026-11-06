import { useEffect, useRef } from 'react'

interface Props {
  open: boolean
  title: string
  side: 'left' | 'right'
  onClose: () => void
  children: React.ReactNode
}

export default function Panel({ open, title, side, onClose, children }: Props) {
  const ref = useRef<HTMLElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    if (!open) return
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close.current()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const left = side === 'left'
  return (
    <div className={`fixed inset-0 z-10 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open} inert={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <aside
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-label={title}
        className={`absolute inset-y-0 w-full max-w-[380px] overflow-y-auto border-(--line) bg-(--panel) p-6 outline-none backdrop-blur-xl transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
          left ? 'left-0 border-r' : 'right-0 border-l'
        } ${open ? 'translate-x-0' : left ? '-translate-x-full' : 'translate-x-full'}`}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Закрыть" className="press grid size-9 place-items-center rounded-full text-(--muted) hover:bg-(--hover) hover:text-(--fg)">
            ✕
          </button>
        </div>
        {children}
      </aside>
    </div>
  )
}
