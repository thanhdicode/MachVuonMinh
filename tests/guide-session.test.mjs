import test from 'node:test'
import assert from 'node:assert/strict'
import { captureDemo, createRunGate, demoEquals, demoRestorePatch, escapeAction } from '../src/onboarding/guideSession.ts'

const demo = () => ({ automation: 60, forces: [50, 50, 50, 50, 50], relations: [50, 50, 50], evidenceCase: 0, evidenceLens: 0, farmStage: 1, slots: [null, null, null], reconfigure: 0 })

test('starting a new run aborts and invalidates the previous one', async () => {
  const gate = createRunGate()
  const first = gate.begin()
  const second = gate.begin()
  assert.equal(first.signal.aborted, true)
  assert.equal(first.isCurrent(), false)
  assert.equal(second.isCurrent(), true)
  assert.equal(gate.current(), second)
  second.cancel()
  assert.equal(second.isCurrent(), false)
  assert.equal(second.signal.aborted, true)
  assert.equal(gate.current(), null)
})

test('a late promise cannot mutate after cancel', async () => {
  const gate = createRunGate()
  const run = gate.begin()
  const writes = []
  const late = new Promise((resolve) => setTimeout(resolve, 5)).then(() => { if (run.isCurrent()) writes.push('mutated') })
  gate.cancelAll()
  await late
  assert.deepEqual(writes, [])
  assert.equal(run.signal.aborted, true)
})

test('cancelling a stale run does not cancel the current one', () => {
  const gate = createRunGate()
  const stale = gate.begin()
  const current = gate.begin()
  stale.cancel()
  assert.equal(current.isCurrent(), true)
  assert.equal(current.signal.aborted, false)
})

test('snapshot is a deep copy and restore only returns demo-owned fields', () => {
  const state = { ...demo(), sound: true, paused: true, unlocked: true, reduced: true }
  const snapshot = captureDemo(state, { scrollY: 480, era: 3 })
  state.forces[0] = 99
  state.slots[1] = 4
  assert.deepEqual(snapshot.fields.forces, [50, 50, 50, 50, 50])
  assert.deepEqual(snapshot.fields.slots, [null, null, null])
  assert.equal(snapshot.scrollY, 480)
  assert.equal(snapshot.era, 3)
  const patch = demoRestorePatch(snapshot)
  assert.deepEqual(Object.keys(patch).sort(), ['automation', 'evidenceCase', 'evidenceLens', 'farmStage', 'forces', 'reconfigure', 'relations', 'slots'])
  for (const forbidden of ['sound', 'paused', 'unlocked', 'reduced']) assert.equal(forbidden in patch, false)
  patch.forces[2] = 1
  assert.deepEqual(snapshot.fields.forces, [50, 50, 50, 50, 50], 'restoring never aliases the stored snapshot')
  assert.equal(demoEquals(demoRestorePatch(snapshot), demo()), true)
})

const idle = { dialogOpen: false, menuOpen: false, welcomeVisible: false, presenter: 'none', phase: 'idle', focusInCue: false }

test('Escape belongs to the topmost layer: dialog, then owl menu, then welcome, then the guide', () => {
  assert.equal(escapeAction({ ...idle, dialogOpen: true, menuOpen: true, welcomeVisible: true, presenter: 'driver', phase: 'presenting' }), 'ignore')
  assert.equal(escapeAction({ ...idle, menuOpen: true, welcomeVisible: true, presenter: 'driver', phase: 'presenting' }), 'close-menu')
  assert.equal(escapeAction({ ...idle, welcomeVisible: true, presenter: 'welcome' }), 'skip-welcome')
  assert.equal(escapeAction({ ...idle, presenter: 'driver', phase: 'presenting' }), 'cancel')
})

test('Escape closes the guide while it prepares or shows the written fallback, wherever focus is', () => {
  assert.equal(escapeAction({ ...idle, presenter: 'cue', phase: 'preparing' }), 'cancel')
  assert.equal(escapeAction({ ...idle, presenter: 'cue', phase: 'presenting' }), 'cancel')
})

test('Escape in a practice cue is left to the page unless focus is inside the cue', () => {
  assert.equal(escapeAction({ ...idle, presenter: 'cue', phase: 'practice', focusInCue: false }), 'ignore')
  assert.equal(escapeAction({ ...idle, presenter: 'cue', phase: 'practice', focusInCue: true }), 'cancel')
  assert.equal(escapeAction({ ...idle, presenter: 'cue', phase: 'modal', focusInCue: false }), 'ignore')
})

test('Escape never touches an idle guide or the game guide (the iframe owns its own Escape)', () => {
  assert.equal(escapeAction(idle), 'ignore')
  assert.equal(escapeAction({ ...idle, presenter: 'game', phase: 'modal' }), 'ignore')
  assert.equal(escapeAction({ ...idle, presenter: 'cue', phase: 'paused', focusInCue: false }), 'ignore')
})
