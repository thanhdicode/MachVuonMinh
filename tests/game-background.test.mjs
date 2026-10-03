import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile('src/minigame/assets/game-background.js', 'utf8')

function context() {
  const operations = []
  const ctx = { operations }
  for (const name of ['save', 'restore', 'beginPath', 'closePath', 'fill', 'stroke', 'moveTo', 'lineTo', 'bezierCurveTo', 'arc', 'ellipse', 'fillRect', 'strokeRect', 'drawImage', 'translate', 'scale', 'setLineDash']) {
    ctx[name] = (...args) => operations.push([name, ...args])
  }
  for (const name of ['fillStyle', 'strokeStyle', 'lineWidth', 'globalAlpha', 'globalCompositeOperation']) {
    Object.defineProperty(ctx, name, { set: (value) => operations.push([name, value]) })
  }
  return ctx
}

function harness() {
  const window = {}
  new Function('window', source)(window)
  const canvases = []
  const factory = (width, height) => {
    const ctx = context()
    const canvas = {
      width, height, ctx, contextOptions: null,
      getContext(kind, options) { assert.equal(kind, '2d'); this.contextOptions = options; return ctx },
    }
    canvases.push(canvas)
    return canvas
  }
  return { api: window.MACH_GAME_BACKGROUND, canvases, factory }
}

const frame = (overrides = {}) => ({ stage: 0, width: 900, height: 430, groundY: 333, world: 0, reduced: false, ...overrides })

test('exposes one renderer with three bounded cached layers', () => {
  const h = harness()
  const renderer = h.api.create(h.factory)
  const main = context()
  renderer.draw(main, frame())
  assert.equal(h.canvases.length, 3)
  assert.deepEqual(h.canvases.map((canvas) => canvas.contextOptions?.alpha), [false, true, true])
  assert.equal(h.canvases[0].height, 430)
  assert.deepEqual(h.canvases.slice(1).map((canvas) => canvas.height), [333, 333])
  assert.ok(h.canvases.every((canvas) => canvas.width <= 1600))
  assert.ok(main.operations.some(([name]) => name === 'drawImage'))
})

test('reuses caches until stage, width, or explicit invalidation changes them', () => {
  const h = harness()
  const renderer = h.api.create(h.factory)
  const main = context()
  renderer.draw(main, frame())
  renderer.draw(main, frame({ world: 450 }))
  assert.equal(h.canvases.length, 3)
  renderer.draw(main, frame({ stage: 1, world: 450 }))
  assert.equal(h.canvases.length, 6)
  renderer.draw(main, frame({ stage: 1, width: 1100 }))
  assert.equal(h.canvases.length, 9)
  renderer.invalidate()
  renderer.draw(main, frame({ stage: 1, width: 1100 }))
  assert.equal(h.canvases.length, 12)
})

test('per-frame work only composites cached images with smooth or reduced offsets', () => {
  const h = harness()
  const renderer = h.api.create(h.factory)
  const main = context()
  renderer.draw(main, frame())
  main.operations.length = 0
  renderer.draw(main, frame({ world: 10 }))
  const moving = main.operations.filter(([name]) => name === 'drawImage').map((operation) => operation[2])
  assert.ok(moving.some((x) => Number.isFinite(x) && x < 0))
  assert.equal(main.operations.some(([name]) => ['beginPath', 'fillRect', 'lineTo', 'arc'].includes(name)), false)
  main.operations.length = 0
  renderer.draw(main, frame({ world: 999, reduced: true }))
  const reducedA = main.operations.filter(([name]) => name === 'drawImage').map((operation) => operation[2])
  main.operations.length = 0
  renderer.draw(main, frame({ world: 1999, reduced: true }))
  const reducedB = main.operations.filter(([name]) => name === 'drawImage').map((operation) => operation[2])
  assert.deepEqual(reducedA, reducedB)
})

test('builds a distinct print palette and substantial scenery for all five chapters', () => {
  const h = harness()
  const renderer = h.api.create(h.factory)
  const main = context()
  const skies = []
  for (let stage = 0; stage < 5; stage += 1) {
    renderer.draw(main, frame({ stage }))
    const layers = h.canvases.slice(-3)
    skies.push(layers[0].ctx.operations.find(([name]) => name === 'fillStyle')?.[1])
    assert.ok(layers.slice(1).every((canvas) => canvas.ctx.operations.length > 35), `stage ${stage + 1} has drawn scenery`)
  }
  assert.equal(new Set(skies).size, 5)
})
