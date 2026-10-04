import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile('src/minigame/assets/game-background.js', 'utf8')

function context() {
  const operations = []
  const ctx = { operations }
  for (const name of ['save', 'restore', 'beginPath', 'closePath', 'fill', 'stroke', 'moveTo', 'lineTo', 'bezierCurveTo', 'arc', 'ellipse', 'fillRect', 'strokeRect', 'drawImage', 'translate', 'rotate', 'scale', 'setLineDash']) {
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
  const images = { pixel_tiles: {}, pixel_farm: {}, pixel_industry: {}, ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => ['pixel_background_' + i, { stage: i }])) }
  return { api: window.MACH_GAME_BACKGROUND, canvases, factory, images }
}

const frame = (overrides = {}) => ({ stage: 0, width: 900, height: 430, groundY: 333, world: 0, reduced: false, ...overrides })

test('exposes one renderer with three bounded cached layers', () => {
  const h = harness()
  const renderer = h.api.create(h.factory, { images: h.images })
  const main = context()
  renderer.draw(main, frame())
  assert.equal(h.canvases.length, 3)
  assert.deepEqual(h.canvases.map((canvas) => canvas.contextOptions?.alpha), [false, true, true])
  assert.equal(h.canvases[0].height, 430)
  assert.deepEqual(h.canvases.slice(1).map((canvas) => canvas.height), [333, 97])
  assert.ok(h.canvases.every((canvas) => canvas.width <= 1600))
  assert.ok(main.operations.some(([name]) => name === 'drawImage'))
})

test('reuses bounded caches across viewport widths, rebuilding for a new stage or invalidation', () => {
  const h = harness()
  const renderer = h.api.create(h.factory)
  const main = context()
  renderer.draw(main, frame())
  renderer.draw(main, frame({ world: 450 }))
  assert.equal(h.canvases.length, 3)
  renderer.draw(main, frame({ stage: 1, world: 450 }))
  assert.equal(h.canvases.length, 6)
  renderer.draw(main, frame({ stage: 1, width: 1100 }))
  assert.equal(h.canvases.length, 6)
  renderer.invalidate()
  renderer.draw(main, frame({ stage: 1, width: 1100 }))
  assert.equal(h.canvases.length, 9)
})

test('parallax and ambient effects use bounded frame work; reduced motion keeps only essential road movement', () => {
  const h = harness()
  const renderer = h.api.create(h.factory)
  const main = context()
  renderer.draw(main, frame())
  main.operations.length = 0
  renderer.draw(main, frame({ world: 10 }))
  const moving = main.operations.filter(([name]) => name === 'drawImage').map((operation) => operation[2])
  assert.ok(moving.some((x) => Number.isFinite(x) && x < 0))
  assert.ok(main.operations.filter(([name]) => name === 'fillRect').length <= 32)
  assert.equal(main.operations.some(([name]) => ['beginPath', 'lineTo', 'arc'].includes(name)), false)
  main.operations.length = 0
  renderer.draw(main, frame({ world: 999, reduced: true }))
  const reducedA = main.operations.filter(([name, canvas]) => name === 'drawImage' && canvas.height !== 97).map((operation) => operation[2])
  assert.equal(main.operations.some(([name]) => name === 'fillRect'), false)
  main.operations.length = 0
  renderer.draw(main, frame({ world: 1999, reduced: true }))
  const reducedB = main.operations.filter(([name, canvas]) => name === 'drawImage' && canvas.height !== 97).map((operation) => operation[2])
  assert.deepEqual(reducedA, reducedB)
})

test('renders the authored panorama and licensed terrain in all five chapters', () => {
  const h = harness()
  const renderer = h.api.create(h.factory, { images: h.images })
  const main = context()
  const skies = []
  for (let stage = 0; stage < 5; stage += 1) {
    renderer.draw(main, frame({ stage }))
    const layers = h.canvases.slice(-3)
    skies.push(layers[0].ctx.operations.find(([name]) => name === 'fillStyle')?.[1])
    assert.ok(layers[0].ctx.operations.some(([name, image]) => name === 'drawImage' && image === h.images['pixel_background_' + stage]))
    assert.ok(layers[2].ctx.operations.filter(([name]) => name === 'drawImage').length >= 38, `stage ${stage + 1} has real terrain tiles`)
  }
  assert.equal(new Set(skies).size, 5)
})

test('loading fallback is replaced when assets arrive, without touching game state', () => {
  const h = harness(), images = {}, renderer = h.api.create(h.factory, { images }), main = context(), input = frame({ world: 1e8 })
  const before = JSON.stringify(input)
  renderer.draw(main, input)
  images.pixel_background_0 = h.images.pixel_background_0
  images.pixel_tiles = h.images.pixel_tiles
  renderer.draw(main, input)
  assert.equal(h.canvases.length, 6)
  assert.equal(JSON.stringify(input), before)
  assert.ok(main.operations.filter(([name]) => name === 'drawImage').length < 50)
})

function sceneryFixture(h) {
  h.images.pixel_scenery = { width: 1536, height: 1280 }
  return { atlas: 'pixel_scenery', stages: Array.from({ length: 5 }, (_, stage) =>
    Array.from({ length: 3 }, (_, col) => ({ x: col * 512 + 16, y: stage * 256 + 16, width: 460, height: 220 }))) }
}

test('uses each chapter\'s scenery crops above the lane without borrowing hazard or coarse prop sheets', () => {
  const h = harness(), scenery = sceneryFixture(h)
  const renderer = h.api.create(h.factory, { images: h.images, scenery })
  const input = frame(), before = JSON.stringify(input)
  for (let stage = 0; stage < 5; stage++) {
    renderer.draw(context(), { ...input, stage })
    const props = h.canvases.at(-2)
    const art = props.ctx.operations.filter(([name]) => name === 'drawImage')
    assert.ok(art.length >= 3, `chapter ${stage + 1} has background clusters`)
    for (const [, image, sx, sy, sw, sh, dx, dy, dw, dh] of art) {
      assert.equal(image, h.images.pixel_scenery)
      assert.ok(sy >= stage * 256 && sy + sh <= (stage + 1) * 256)
      assert.ok(sx >= 0 && sx + sw <= image.width)
      assert.ok(dw <= 176 && dh <= 96)
      assert.ok(dy + dh <= input.groundY - 4, 'decorations remain behind the obstacle lane')
      assert.ok([dx, dy, dw, dh].every(Number.isInteger), 'pixel placement stays crisp')
    }
  }
  assert.equal(JSON.stringify(input), before)
})

test('late scenery rebuilds its cache; wind keeps foliage rooted and freezes for reduced motion', () => {
  const h = harness(), scenery = sceneryFixture(h), atlas = h.images.pixel_scenery
  delete h.images.pixel_scenery
  const renderer = h.api.create(h.factory, { images: h.images, scenery }), main = context()
  renderer.draw(main, frame({ stage: 1 }))
  assert.equal(h.canvases[1].ctx.operations.filter(([name]) => name === 'drawImage').length, 0, 'missing art leaves the panorama clear')
  h.images.pixel_scenery = atlas
  renderer.draw(main, frame({ stage: 1 }))
  assert.equal(h.canvases.length, 6)
  renderer.draw(main, frame({ stage: 0 }))
  const foliage = (input) => {
    main.operations.length = 0
    renderer.draw(main, input)
    return main.operations.filter(([name, image]) => name === 'drawImage' && image === atlas)
  }
  const a = foliage(frame({ time: 0 })), b = foliage(frame({ time: 1600 }))
  assert.ok(a.length > 0, 'foliage canopy is drawn separately from its rooted lower half')
  assert.notDeepEqual(a.map((op) => op[6]), b.map((op) => op[6]), 'wind changes canopy X')
  assert.deepEqual(a.map((op) => op[7]), b.map((op) => op[7]), 'wind keeps canopy height fixed')
  assert.deepEqual(foliage(frame({ reduced: true, time: 0 })), foliage(frame({ reduced: true, time: 9000, world: 1e8 })))
  assert.equal(h.canvases.length, 9, 'animation reuses the three bounded caches')
})
