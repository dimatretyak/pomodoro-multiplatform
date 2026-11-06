let ctx: AudioContext | null = null

/** Soft single tone: exercise step changed (useful with eyes closed). */
export const tick = () => tones([523], 0.12, 0.6)

export const chime = () => tones([660, 880, 1320], 0.25, 1.2)

let noise: AudioBuffer | null = null
/** Clock tick: a 25 ms band-passed noise click; `tock` is slightly lower, like a real escapement. */
export function clockTick(tock: boolean) {
  ctx ??= new AudioContext()
  if (!noise) {
    noise = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.025), ctx.sampleRate)
    const d = noise.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 4
  }
  const src = ctx.createBufferSource()
  src.buffer = noise
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = tock ? 2600 : 3400
  bp.Q.value = 6
  const g = ctx.createGain()
  g.gain.value = 0.35
  src.connect(bp).connect(g).connect(ctx.destination)
  src.start()
}

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
