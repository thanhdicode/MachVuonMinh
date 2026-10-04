import test from 'node:test'
import assert from 'node:assert/strict'
import { crossesEyelet } from '../src/experience/introInteraction.ts'

const eyelet = { left: 600, top: 250, width: 180, height: 180 }

test('a fast drag through the opening succeeds even with both samples outside', () => {
  assert.equal(crossesEyelet({ x: 510, y: 340 }, { x: 1024, y: 340 }, eyelet), true)
})

test('a drag beside the opening does not unlock', () => {
  assert.equal(crossesEyelet({ x: 510, y: 500 }, { x: 1024, y: 500 }, eyelet), false)
})

test('the rectangular target corner is outside the circular opening', () => {
  assert.equal(crossesEyelet({ x: 510, y: 260 }, { x: 610, y: 260 }, eyelet), false)
})

test('dropping in the opening and crossing its edge both succeed', () => {
  assert.equal(crossesEyelet({ x: 510, y: 425 }, { x: 690, y: 340 }, eyelet), true)
  assert.equal(crossesEyelet({ x: 510, y: 250 }, { x: 1024, y: 250 }, eyelet), true)
})

test('a resized elliptical opening uses its actual DOM bounds', () => {
  const resized = { left: 520, top: 200, width: 110, height: 140 }
  assert.equal(crossesEyelet({ x: 350, y: 270 }, { x: 800, y: 270 }, resized), true)
  assert.equal(crossesEyelet({ x: 350, y: 350 }, { x: 800, y: 350 }, resized), false)
})

test('stationary samples are safe and missing layout never unlocks', () => {
  assert.equal(crossesEyelet({ x: 690, y: 340 }, { x: 690, y: 340 }, eyelet), true)
  assert.equal(crossesEyelet({ x: 510, y: 425 }, { x: 510, y: 425 }, eyelet), false)
  assert.equal(crossesEyelet({ x: 510, y: 340 }, { x: 1024, y: 340 }, { ...eyelet, width: 0 }), false)
})
