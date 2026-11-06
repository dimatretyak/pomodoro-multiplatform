let ctx: AudioContext | null = null

export function chime() {
  ctx ??= new AudioContext()
  const t = ctx.currentTime
  ;[660, 880, 1320].forEach((f, i) => {
    const o = ctx!.createOscillator()
    const g = ctx!.createGain()
    o.type = 'sine'
    o.frequency.value = f
    const at = t + i * 0.18
    g.gain.setValueAtTime(0, at)
    g.gain.linearRampToValueAtTime(0.25, at + 0.02)
    g.gain.exponentialRampToValueAtTime(0.001, at + 1.2)
    o.connect(g).connect(ctx!.destination)
    o.start(at)
    o.stop(at + 1.3)
  })
}

/** Call from a user gesture so the browser allows audio/notifications later. */
export function unlock() {
  ctx ??= new AudioContext()
  ctx.resume()
  if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission()
}

export function notify(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted' || document.hasFocus()) return
  const n = new Notification(title, { body, icon: '/icon.svg', tag: 'pomidoro' })
  n.onclick = () => {
    window.focus()
    n.close()
  }
}
