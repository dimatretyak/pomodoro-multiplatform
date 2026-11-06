let ctx: AudioContext | null = null

/** Soft single tone: exercise step changed (useful with eyes closed). */
export const tick = () => tones([523], 0.12, 0.6)

export const chime = () => tones([660, 880, 1320], 0.25, 1.2)

function tones(freqs: number[], vol: number, len: number) {
  ctx ??= new AudioContext()
  const t = ctx.currentTime
  freqs.forEach((f, i) => {
    const o = ctx!.createOscillator()
    const g = ctx!.createGain()
    o.type = 'sine'
    o.frequency.value = f
    const at = t + i * 0.18
    g.gain.setValueAtTime(0, at)
    g.gain.linearRampToValueAtTime(vol, at + 0.02)
    g.gain.exponentialRampToValueAtTime(0.001, at + len)
    o.connect(g).connect(ctx!.destination)
    o.start(at)
    o.stop(at + len + 0.1)
  })
}

/** Call from a user gesture so the browser allows audio/notifications later. */
export function unlock() {
  ctx ??= new AudioContext()
  ctx.resume()
  if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission()
}

export async function notify(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted' || document.hasFocus()) return
  const opts = { body, icon: '/icon.svg', tag: 'pomidoro' }
  // Via the service worker when present: required on Android, click focuses the tab (see sw.js).
  const reg = await navigator.serviceWorker?.getRegistration()
  if (reg) return reg.showNotification(title, opts)
  const n = new Notification(title, opts)
  n.onclick = () => {
    window.focus()
    n.close()
  }
}
