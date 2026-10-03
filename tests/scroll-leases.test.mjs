import test from 'node:test'
import assert from 'node:assert/strict'
import { canResumeScroll, createScrollLeases } from '../src/onboarding/guideSession.ts'

test('only the combined state notifies and releasing the tour never unlocks the game', () => {
  const changes = []
  const leases = createScrollLeases((value) => changes.push(value))
  const tour = leases.acquire('tour')
  const game = leases.acquire('game')
  tour()
  tour()
  assert.equal(leases.isLocked(), true, 'game still holds the lock')
  assert.equal(leases.isHeldBy('game'), true)
  assert.equal(leases.isHeldBy('tour'), false)
  game()
  assert.deepEqual(changes, [true, false])
})

test('each acquire has its own token and release is idempotent', () => {
  const changes = []
  const leases = createScrollLeases((value) => changes.push(value))
  const first = leases.acquire('dialog')
  const second = leases.acquire('dialog')
  assert.deepEqual(leases.counts(), { tour: 0, game: 0, dialog: 2 })
  first()
  first()
  assert.equal(leases.isLocked(), true, 'a repeated release must not drop the other lease')
  second()
  assert.equal(leases.isLocked(), false)
  assert.deepEqual(changes, [true, false])
})

test('a user dialog keeps the lock after the tour is torn down', () => {
  const leases = createScrollLeases(() => {})
  const dialog = leases.acquire('dialog')
  const tour = leases.acquire('tour')
  tour()
  assert.equal(leases.isLocked(), true)
  assert.equal(canResumeScroll({ unlocked: true, leasesLocked: leases.isLocked() }), false)
  dialog()
  assert.equal(canResumeScroll({ unlocked: true, leasesLocked: leases.isLocked() }), true)
})

test('resume needs the intro to be unlocked as well', () => {
  assert.equal(canResumeScroll({ unlocked: false, leasesLocked: false }), false)
  assert.equal(canResumeScroll({ unlocked: true, leasesLocked: false }), true)
})
