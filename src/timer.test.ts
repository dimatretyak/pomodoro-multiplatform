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

import { lastDays, streak } from './stats.ts'

test('stats: per-day buckets and streak', () => {
  const now = new Date(2026, 10, 6, 15).getTime()
  const at = (day: number, h: number, min: number, completed = true) => {
    const end = new Date(2026, 10, day, h).getTime()
    return { id: `${day}${h}`, phase: 'focus' as const, startedAt: end - min * 60_000, endedAt: end, completed }
  }
  const hist = [at(6, 10, 25), at(6, 12, 25), at(5, 9, 25), at(4, 9, 25, false), at(3, 9, 50)]
  const days = lastDays(hist, now, 4)
  assert.deepEqual(days.map((d) => [new Date(d.start).getDate(), d.min, d.count]), [[3, 50, 1], [4, 0, 0], [5, 25, 1], [6, 50, 2]])
  assert.equal(streak(hist, now), 2) // 6th and 5th; 4th only skipped
  assert.equal(streak(hist.slice(2), now), 1) // today empty → count from yesterday
})

import { mergeImport } from './storage.ts'

test('import: union history by id, newer settings win, junk rejected', () => {
  const rec = (id: string, end: number) => ({ id, phase: 'focus', startedAt: end - 10, endedAt: end, completed: true })
  const cur = { settings: { ...defaultSettings, updatedAt: 5 }, timer: initialState(defaultSettings), history: [rec('a', 100)] as any }
  const { data, added } = mergeImport(cur, {
    settings: { focusMin: 50, updatedAt: 9, evil: 'x', longEvery: '3' },
    history: [rec('a', 100), rec('b', 50), { id: 'bad' }, { ...rec('c', 1), phase: 'nope' }],
  })
  assert.equal(added, 1)
  assert.deepEqual(data.history.map((h) => h.id), ['b', 'a'])
  assert.equal(data.settings.focusMin, 50)
  assert.equal(data.settings.longEvery, 4) // wrong type ignored
  assert.equal((data.settings as any).evil, undefined)
  assert.equal(mergeImport(cur, { settings: { focusMin: 1, updatedAt: 1 }, history: [] }).data.settings.focusMin, 25) // older ignored
  assert.throws(() => mergeImport(cur, { foo: 1 }))
})

test('import: out-of-range numbers, unknown exercises dropped', () => {
  const cur = { settings: { ...defaultSettings, updatedAt: 0 }, timer: initialState(defaultSettings), history: [] }
  const s = mergeImport(cur, { settings: { focusMin: -5, shortMin: 10, palette: 'toString', exercises: ['box', 'hack'], updatedAt: 1 }, history: [] }).data.settings
  assert.equal(s.focusMin, 25)
  assert.equal(s.shortMin, 10)
  assert.deepEqual(s.exercises, ['box'])
  assert.equal(s.palette, 'classic') // prototype key is not a palette
})

test('import retimes an untouched timer only', () => {
  const cur = { settings: { ...defaultSettings, updatedAt: 0 }, timer: initialState(defaultSettings), history: [] }
  const imp = { settings: { focusMin: 40, updatedAt: 1 }, history: [] }
  assert.equal(mergeImport(cur, imp).data.timer.remaining, 40 * 60_000)
  const touched = { ...cur, timer: { ...cur.timer, remaining: 10 * 60_000 } }
  assert.equal(mergeImport(touched, imp).data.timer.remaining, 10 * 60_000)
})

import { weekCompare } from './stats.ts'

test('week compare', () => {
  const d = (min: number) => ({ start: 0, min, count: 0 })
  assert.deepEqual(weekCompare([...Array(7).fill(d(10)), ...Array(7).fill(d(15))]), { cur: 105, prev: 70, pct: 50 })
  assert.equal(weekCompare(Array(14).fill(d(0))).pct, null)
})
