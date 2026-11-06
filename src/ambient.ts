import { audio } from './alerts.ts'

// Background sounds synthesized with Web Audio: no files, works offline.
export const ambientKinds = ['off', 'rain', 'waves', 'forest', 'fire', 'brown'] as const
export type Ambient = (typeof ambientKinds)[number]

type Voice = { out: AudioNode; stop: () => void }

const buffers = new Map<string, AudioBuffer>()
/** 6 s of looping noise. brown = integrated white (deep rumble), pink = −3 dB/oct (Paul Kellet). */
function noise(kind: 'white' | 'pink' | 'brown') {
  const c = audio()
  if (buffers.has(kind)) return buffers.get(kind)!
  const b = c.createBuffer(1, c.sampleRate * 6, c.sampleRate)
  const d = b.getChannelData(0)
  let last = 0, b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1
    if (kind === 'white') d[i] = w * 0.5
    else if (kind === 'brown') {
      last = (last + 0.02 * w) / 1.02
      d[i] = last * 3.5
    }
    else {
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852
      b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
      b6 = w * 0.115926
    }
  }
  buffers.set(kind, b)
  return b
}

function loop(kind: 'white' | 'pink' | 'brown') {
  const s = audio().createBufferSource()
  s.buffer = noise(kind)
  s.loop = true
  s.loopStart = Math.random() * 3 // de-correlate layers
  s.start(0, s.loopStart)
  return s
}
const filter = (type: BiquadFilterType, freq: number, q = 0.7) => {
  const f = audio().createBiquadFilter()
  f.type = type
  f.frequency.value = freq
  f.Q.value = q
  return f
}
const gain = (v: number) => {
  const g = audio().createGain()
  g.gain.value = v
  return g
}
/** Slow sine wobble added to an AudioParam. */
function lfo(param: AudioParam, hz: number, depth: number) {
  const o = audio().createOscillator()
  o.frequency.value = hz
  const g = gain(depth)
  o.connect(g).connect(param)
  o.start()
  return o
}
/** Short filtered noise burst: rain drops, fire crackles. */
function burst(out: AudioNode, freq: number, vol: number, len: number) {
  const c = audio(), t = c.currentTime
  const s = c.createBufferSource()
  s.buffer = noise('white')
  const g = gain(0)
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + len)
  s.connect(filter('bandpass', freq, 3)).connect(g).connect(out)
  s.start(t, Math.random() * 5, len + 0.02)
}
/** Calls fn at random intervals until stopped. */
function every(minMs: number, maxMs: number, fn: () => void) {
  let id = 0
  const tick = () => { fn(); id = window.setTimeout(tick, minMs + Math.random() * (maxMs - minMs)) }
  id = window.setTimeout(tick, minMs)
  return () => clearTimeout(id)
}

const voices: Record<Exclude<Ambient, 'off'>, () => Voice> = {
  rain() {
    const out = gain(1)
    const hiss = loop('pink'); hiss.connect(filter('highpass', 500)).connect(filter('lowpass', 8000)).connect(gain(0.55)).connect(out)
    const body = loop('brown'); body.connect(filter('lowpass', 500)).connect(gain(0.35)).connect(out)
    const stopDrops = every(15, 70, () => burst(out, 2500 + Math.random() * 4000, 0.04 + Math.random() * 0.08, 0.02))
    return { out, stop: () => { hiss.stop(); body.stop(); stopDrops() } }
  },
  waves() {
    const out = gain(1)
    const lp = filter('lowpass', 700)
    const swell = gain(0.55)
    const src = loop('brown'); src.connect(lp).connect(swell).connect(out)
    const a = lfo(swell.gain, 0.085, 0.45), b = lfo(lp.frequency, 0.085, 450)
    return { out, stop: () => { src.stop(); a.stop(); b.stop() } }
  },
  forest() {
    const out = gain(1)
    const wind = gain(0.35)
    const bp = filter('bandpass', 450, 0.5)
    const src = loop('pink'); src.connect(bp).connect(wind).connect(out)
    const a = lfo(wind.gain, 0.05, 0.2), b = lfo(bp.frequency, 0.03, 200)
    const stopBirds = every(2500, 7000, () => {
      // a short phrase of 2–5 rising chirps
      const c = audio(), base = 2600 + Math.random() * 1400, n = 2 + Math.floor(Math.random() * 4)
      for (let i = 0; i < n; i++) {
        const t = c.currentTime + i * (0.09 + Math.random() * 0.05)
        const o = c.createOscillator(), g = gain(0)
        o.frequency.setValueAtTime(base, t)
        o.frequency.exponentialRampToValueAtTime(base * (1.3 + Math.random() * 0.4), t + 0.07)
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08)
        o.connect(g).connect(out); o.start(t); o.stop(t + 0.1)
      }
    })
    return { out, stop: () => { src.stop(); a.stop(); b.stop(); stopBirds() } }
  },
  fire() {
    const out = gain(1)
    const roar = loop('brown'); roar.connect(filter('lowpass', 350)).connect(gain(0.6)).connect(out)
    const stopCrackle = every(25, 160, () => {
      if (Math.random() < 0.6) burst(out, 1500 + Math.random() * 3500, 0.05 + Math.random() * 0.15, 0.005 + Math.random() * 0.02)
      if (Math.random() < 0.03) burst(out, 600, 0.35, 0.06) // occasional pop
    })
    return { out, stop: () => { roar.stop(); stopCrackle() } }
  },
  brown() {
    const out = gain(1)
    const src = loop('brown'); src.connect(filter('lowpass', 1000)).connect(gain(0.7)).connect(out)
    return { out, stop: () => src.stop() }
  },
}

let master: GainNode | null = null
let playing: { kind: Ambient; voice: Voice; fade: GainNode } | null = null
const FADE = 1.2

/** Start, switch, re-level or stop the background sound. `volume` is 0..100. Crossfades between sounds. */
export function setAmbient(kind: Ambient, volume: number) {
  const c = audio()
  master ??= (() => { const m = gain(0); m.connect(c.destination); return m })()
  master.gain.setTargetAtTime((volume / 100) ** 2 * 0.6, c.currentTime, 0.1) // perceptual curve
  if ((playing?.kind ?? 'off') === kind) return
  if (playing) {
    const old = playing
    old.fade.gain.setTargetAtTime(0, c.currentTime, FADE / 4)
    setTimeout(() => { old.voice.stop(); old.fade.disconnect() }, FADE * 1000 + 200)
    playing = null
  }
  if (kind === 'off') return
  const voice = voices[kind]()
  const fade = gain(0)
  voice.out.connect(fade).connect(master)
  fade.gain.setTargetAtTime(1, c.currentTime, FADE / 4)
  playing = { kind, voice, fade }
}
