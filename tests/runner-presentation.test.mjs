import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

const source = await readFile('src/minigame/assets/runner-presentation.js', 'utf8')
const window = {}
vm.runInNewContext(source, { window })
const api = window.MACH_RUNNER_PRESENTATION

test('elapsed animation time advances verified sheet frames and wraps without FPS dependence', () => {
  assert.equal(api.frameAt(0, 12, 20), 0)
  assert.equal(api.frameAt(50, 12, 20), 1)
  assert.equal(api.frameAt(550, 12, 20), 11)
  assert.equal(api.frameAt(600, 12, 20), 0)
  assert.equal(api.frameAt(-1, 12, 20), 0)
  assert.equal(api.frameAt(1000, 1, 20), 0)
})

test('frame drawing selects one source frame, keeps feet anchored and uses crisp pixels', () => {
  const calls = []
  const ctx = { save() {}, restore() {}, drawImage(...args) { calls.push(args) } }
  const image = { width: 384, height: 32 }
  api.drawFrame(ctx, image, { frameWidth: 32, frameHeight: 32, frames: 12 }, 150, 20, 100, 333, 96, 96)
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0].slice(1, 5), [96, 0, 32, 32])
  assert.equal(calls[0][6] + calls[0][8], 333)
  assert.equal(ctx.imageSmoothingEnabled, false)
})

test('render sampling does not mutate campaign/quiz state and missing art is a safe no-op', () => {
  const state = Object.freeze({ score: 55, hearts: 2, stage: 1, answered: false, questionDecks: Object.freeze([]) })
  const before = JSON.stringify(state)
  for (let time = 0; time < 2000; time += 16) api.frameAt(time, 12, 20)
  assert.equal(api.drawFrame({ drawImage() { throw Error('must not draw') } }, null, null, 10, 20, 100, 333, 64, 64), false)
  assert.equal(JSON.stringify(state), before)
})

test('transparent asset gutters are trimmed inside each frame, so visible hazard art reaches its collider', () => {
  const calls = [], ctx = { save() {}, restore() {}, drawImage(...args) { calls.push(args) } }
  api.drawFrame(ctx, {}, { frameWidth: 42, frameHeight: 42, frames: 4, crop: { x: 5, y: 5, width: 32, height: 32 } }, 100, 20, 100, 333, 148, 148)
  assert.deepEqual(calls[0].slice(1, 5), [89, 5, 32, 32])
  api.drawFrame(ctx, {}, { frameWidth: 16, frameHeight: 16, frames: 1, crop: { x: 0, y: 9, width: 15, height: 7 } }, 0, 20, 100, 333, 82, 46)
  assert.deepEqual(calls[1].slice(1), [0, 9, 15, 7, 59, 287, 82, 46])
})
