import test from 'node:test'
import assert from 'node:assert/strict'
import { isScene07Audible, scene07PulseBpm, shouldPlayScene07Finale } from '../src/experience/Scene07AudioEngine.ts'

test('Scene 07 audio requires an active, visible, unpaused scene', () => {
  const base = { active: true, paused: false, hidden: false }
  assert.equal(isScene07Audible(base), true)
  assert.equal(isScene07Audible({ ...base, active: false }), false)
  assert.equal(isScene07Audible({ ...base, paused: true }), false)
  assert.equal(isScene07Audible({ ...base, hidden: true }), false)
})

test('factory pulse stays in its quiet 55–70 bpm range', () => {
  assert.equal(scene07PulseBpm(0), 55)
  assert.equal(scene07PulseBpm(20), 62)
  assert.equal(scene07PulseBpm(1000), 70)
  assert.equal(scene07PulseBpm(-1000), 70)
})

test('final chord fires once only on a forward arrival', () => {
  assert.equal(shouldPlayScene07Finale(.9, .97, 1), true)
  assert.equal(shouldPlayScene07Finale(.97, 1, 1), false)
  assert.equal(shouldPlayScene07Finale(1, .9, -1), false)
  assert.equal(shouldPlayScene07Finale(.9, .97, -1), false)
})
