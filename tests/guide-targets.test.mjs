import test from 'node:test'
import assert from 'node:assert/strict'
import { findVisibleTarget, waitForTarget, waitUntil } from '../src/onboarding/guideTargets.ts'

function fakeEnv(initial = []) {
  const state = { items: initial, clock: 0, hidden: false, frames: [], visibility: [], viewport: { width: 1000, height: 800 } }
  const env = {
    query: (selector) => { const name = /"([^"]+)"/.exec(selector)[1]; return state.items.filter((i) => i.name === name) },
    isRendered: (e) => e.rendered !== false,
    rect: (e) => e.box,
    viewport: () => state.viewport,
    now: () => state.clock,
    raf: (cb) => { state.frames.push(cb); return state.frames.length },
    caf: (id) => { state.frames[id - 1] = null },
    hidden: () => state.hidden,
    onVisibility: (cb) => { state.visibility.push(cb); return () => { state.visibility = state.visibility.filter((v) => v !== cb) } },
  }
  const step = (ms = 16) => { state.clock += ms; const cb = state.frames.shift(); if (cb) cb() }
  return { env, state, step }
}
const box = (left, top, width, height) => ({ left, top, width, height })
const signal = () => new AbortController()

test('existing is not enough: hidden, collapsed and off-screen candidates are ignored', () => {
  const { env } = fakeEnv([
    { name: 'caption', id: 'old', box: box(0, 2000, 300, 80) },
    { name: 'caption', id: 'hidden', rendered: false, box: box(0, 0, 300, 80) },
    { name: 'caption', id: 'collapsed', box: box(0, 0, 0, 0) },
    { name: 'caption', id: 'live', box: box(20, 100, 300, 80) },
  ])
  assert.equal(findVisibleTarget({ name: 'caption' }, env).id, 'live')
  assert.equal(findVisibleTarget({ name: 'caption', where: (e) => e.id === 'old' }, env), null)
  assert.throws(() => findVisibleTarget({ name: 'Bad Name' }, env), /Invalid guide target name/)
})

test('picks the largest visible duplicate and honours the context filter', () => {
  const { env } = fakeEnv([
    { name: 'nav', id: 'desktop', box: box(0, 0, 600, 300), era: 1 },
    { name: 'nav', id: 'mobile', box: box(0, 0, 100, 50), era: 1 },
    { name: 'nav', id: 'other-era', box: box(0, 0, 900, 700), era: 2 },
  ])
  assert.equal(findVisibleTarget({ name: 'nav', where: (e) => e.era === 1 }, env).id, 'desktop')
})

test('resolves only after the layout is stable for consecutive frames', async () => {
  const target = { name: 'slider', id: 's', box: box(0, 0, 200, 40) }
  const { env, step } = fakeEnv([target])
  const run = signal()
  const pending = waitForTarget({ name: 'slider' }, { signal: run.signal, env, stableFrames: 3 })
  step(); step()
  target.box = box(0, 10, 200, 40)
  step(); step()
  assert.equal(await Promise.race([pending, Promise.resolve('not-yet')]), 'not-yet', 'a moving target must not resolve')
  step()
  assert.equal((await pending).id, 's')
})

test('abort rejects as cancelled and stops requesting frames', async () => {
  const { env, state, step } = fakeEnv([])
  const run = signal()
  const pending = waitForTarget({ name: 'missing' }, { signal: run.signal, env })
  step()
  run.abort()
  await assert.rejects(pending, (e) => e.kind === 'cancelled')
  const queued = state.frames.filter(Boolean).length
  step()
  assert.equal(state.frames.filter(Boolean).length, queued, 'no further frames are scheduled')
  const already = signal(); already.abort()
  await assert.rejects(waitForTarget({ name: 'x' }, { signal: already.signal, env }), (e) => e.kind === 'cancelled')
})

test('timeout distinguishes a target that never rendered from one that never became visible', async () => {
  const none = fakeEnv([])
  const a = waitForTarget({ name: 'ghost' }, { signal: signal().signal, env: none.env, timeoutMs: 100 })
  for (let i = 0; i < 10; i += 1) none.step(20)
  await assert.rejects(a, (e) => e.kind === 'missing-target')
  const offscreen = fakeEnv([{ name: 'late', id: 'l', box: box(0, 5000, 100, 100) }])
  const b = waitForTarget({ name: 'late' }, { signal: signal().signal, env: offscreen.env, timeoutMs: 100 })
  for (let i = 0; i < 10; i += 1) offscreen.step(20)
  await assert.rejects(b, (e) => e.kind === 'missing-target')
})

test('the deadline freezes while the tab is hidden', async () => {
  const { env, state, step } = fakeEnv([])
  const pending = waitForTarget({ name: 'later' }, { signal: signal().signal, env, timeoutMs: 100 })
  state.hidden = true
  for (let i = 0; i < 20; i += 1) step(100)
  state.hidden = false
  state.visibility.forEach((cb) => cb())
  state.items.push({ name: 'later', id: 'x', box: box(10, 10, 100, 100) })
  step(16); step(16)
  assert.equal((await pending).id, 'x', 'two seconds of hidden time did not consume the 100 ms deadline')
})

test('waitUntil polls a real predicate and honours abort and the deadline', async () => {
  const { env, step } = fakeEnv()
  let value = false
  const ok = waitUntil(() => value, { signal: signal().signal, env })
  step(); value = true; step()
  await ok
  const timeout = waitUntil(() => false, { signal: signal().signal, env, timeoutMs: 50 })
  for (let i = 0; i < 6; i += 1) step(20)
  await assert.rejects(timeout, (e) => e.kind === 'timeout')
  const run = signal()
  const cancelled = waitUntil(() => false, { signal: run.signal, env })
  run.abort()
  await assert.rejects(cancelled, (e) => e.kind === 'cancelled')
})
