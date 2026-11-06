import { test } from 'node:test'
import assert from 'node:assert/strict'
import { defaultSettings, initialState, next, start, pause, remainingMs, fmt } from './timer.ts'

const s = { ...defaultSettings, longEvery: 2, autoStartBreaks: true, autoStartFocus: false, exercises: ['a', 'b'] }

test('cycle: focus → short → focus → long → focus resets set', () => {
  let t = initialState(s)
  const seen: string[] = []
  for (let i = 0; i < 5; i++) {
    t = next(t, s, 0)
    seen.push(`${t.phase}:${t.done}`)
  }
  assert.deepEqual(seen, ['short:1', 'focus:1', 'long:2', 'focus:0', 'short:1'])
})

test('auto-start only per setting, exercises rotate', () => {
  const b1 = next(initialState(s), s, 1000)
  assert.equal(b1.endAt, 1000 + 5 * 60_000)
  assert.equal(b1.exerciseId, 'a')
  const f = next(b1, s, 0)
  assert.equal(f.endAt, null)
  assert.equal(f.exerciseId, null)
  assert.equal(next(f, s, 0).exerciseId, 'b')
  assert.equal(next(initialState({ ...s, exercises: [] }), { ...s, exercises: [] }, 0).exerciseId, null)
})

test('pause/resume keeps remaining time', () => {
  let t = start(initialState(s), 0)
  t = pause(t, 60_000)
  assert.equal(remainingMs(t, 999_999), 24 * 60_000)
  t = start(t, 100_000)
  assert.equal(remainingMs(t, 100_000 + 1000), 24 * 60_000 - 1000)
  assert.equal(fmt(24 * 60_000 - 1), '24:00')
  assert.equal(fmt(0), '00:00')
})

import { byId, stepAt } from './exercises.ts'

test('exercise steps: linear ends, breathing loops', () => {
  const neck = byId('neck')!
  assert.deepEqual(stepAt(neck, 0), { index: 0, left: 20 })
  assert.deepEqual(stepAt(neck, 25), { index: 1, left: 15 })
  assert.equal(stepAt(neck, 80), null)
  const box = byId('box')!
  assert.deepEqual(stepAt(box, 16 * 3 + 5), { index: 1, left: 3 })
})
