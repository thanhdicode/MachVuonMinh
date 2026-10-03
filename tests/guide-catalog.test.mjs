import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createGuideCatalog, resolveStep, STEP_WIRING } from '../src/onboarding/guideCatalog.ts'
import { ALL_STEP_IDS, MODULE_STEP_IDS } from '../src/onboarding/guideIds.ts'

const catalog = createGuideCatalog()
const words = (text) => text.trim().split(/\s+/).length

test('runtime catalog maps all 70 unique ids with wiring', () => {
  assert.equal(catalog.list().length, 70)
  assert.equal(Object.keys(STEP_WIRING).length, 70)
  assert.deepEqual(catalog.list().map((s) => s.id), [...ALL_STEP_IDS])
  for (const step of catalog.list()) {
    assert.ok(step.target && !/\s/.test(step.target), `${step.id} target`)
    assert.ok(['read', 'practice', 'modal'].includes(step.kind))
  }
  assert.equal(new Set(catalog.list().map((s) => s.target)).size, 70, 'targets are meaningful and unique, not shared by position')
})

test('src copy is byte-identical to the canonical docs catalog', { skip: !existsSync('docs/superpowers/specs/2026-10-03-owl-guide-copy.json') }, () => {
  const docs = readFileSync('docs/superpowers/specs/2026-10-03-owl-guide-copy.json')
  const runtime = readFileSync('src/onboarding/guideCopy.json')
  assert.ok(docs.equals(runtime), 'src/onboarding/guideCopy.json drifted from docs/superpowers/specs/2026-10-03-owl-guide-copy.json')
})

test('routes follow the agreed order and module counters', () => {
  assert.deepEqual(catalog.route('quick').map((s) => s.id), [...MODULE_STEP_IDS.intro])
  const full = catalog.route('full').map((s) => s.id)
  assert.equal(full.length, 70)
  assert.equal(full.indexOf('T01'), 6)
  assert.ok(full.indexOf('T01') < full.indexOf('H01'), 'tool scene before the Atlas')
  assert.ok(full.indexOf('H08') < full.indexOf('T02'), 'no step returns to production after the Atlas')
  assert.deepEqual(catalog.route('production').map((s) => s.id), ['T01', 'T02', 'T03', 'T04', 'T05'])
  assert.equal(catalog.next('full', 'T01').id, 'H01')
  assert.equal(catalog.next('full', 'H08').id, 'T02')
  assert.equal(catalog.next('full', 'G10'), null)
  assert.equal(catalog.prev('full', 'I01'), null)
  assert.equal(catalog.prev('lab', 'L01'), null)
  assert.equal(catalog.next('lab', 'L15'), null)
  assert.deepEqual(catalog.counter('L04'), { moduleId: 'lab', label: 'LAB', index: 4, total: 15 })
  assert.deepEqual(catalog.counter('T02'), { moduleId: 'production', label: 'CÔNG CỤ & MÁY', index: 2, total: 5 })
})

test('user-facing copy follows the voice rules', () => {
  const banned = /\b(proxy|lease|callback|iframe|driver|state|click|hook)\b/i
  for (const step of catalog.list()) {
    const spoken = [step.title, step.say, ...(step.variants ?? []).map((v) => v.say)]
    for (const text of spoken) {
      assert.ok(!banned.test(text), `${step.id}: technical word in "${text}"`)
      assert.ok(words(text) <= 40, `${step.id}: more than 40 words`)
    }
  }
})

test('variants resolve by real context and fall back to the base copy', () => {
  const h02 = catalog.get('H02')
  assert.equal(resolveStep(h02).say, h02.say)
  const staticH02 = resolveStep(h02, { 'history-static': true })
  assert.match(staticH02.say, /Vuốt/)
  assert.equal(staticH02.pose, 'neutral')
  assert.equal(staticH02.motion, 'read')
  assert.equal(staticH02.variant, 'history-static')
  const h05 = resolveStep(catalog.get('H05'), { 'audio-on': true })
  assert.match(h05.say, /Âm thanh đang bật/)
  assert.equal(h05.pose, catalog.get('H05').pose, 'a variant without pose keeps the base pose')
  assert.equal(resolveStep(catalog.get('V11'), { 'case-farm': true }).variant, 'case-farm')
  assert.equal(resolveStep(catalog.get('G09'), { 'boss-final': true }).variant, 'boss-final')
})

test('a broken catalog is rejected instead of starting', () => {
  const source = JSON.parse(readFileSync('src/onboarding/guideCopy.json', 'utf8'))
  assert.throws(() => createGuideCatalog({ ...source, steps: source.steps.slice(1) }), /expected 70 steps|missing step I01/)
  assert.throws(() => createGuideCatalog({ ...source, steps: [...source.steps.slice(0, 69), source.steps[0]] }), /duplicate id/)
  const badPose = structuredClone(source)
  badPose.steps[3].pose = 'dance'
  assert.throws(() => createGuideCatalog(badPose), /not a known pose/)
})

test('every pose referenced by the catalog has an art file', () => {
  const poses = new Set(['neutral', 'point-left', 'point-right', 'inspect', 'practice', 'confirm', 'bye', 'dock'])
  for (const step of catalog.list()) assert.ok(poses.has(step.pose), step.id)
  for (const pose of poses) assert.ok(existsSync(`public/guide/owl-${pose}.webp`), pose)
})
