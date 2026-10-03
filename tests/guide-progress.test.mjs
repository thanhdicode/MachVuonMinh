import test from 'node:test'
import assert from 'node:assert/strict'
import {
  GUIDE_LEGACY_STORAGE_KEY, GUIDE_STORAGE_KEY, beginGuide, closeGuide, completeStep, createProgress, createProgressStore,
  dismissWelcome, finishRoute, pauseGuide, readGuideProgress, resumeTarget, skipGameAtFinale, skipGuide, skipModule, skipStep, writeGuideProgress,
} from '../src/onboarding/guideProgress.ts'
import { ALL_STEP_IDS, MODULE_STEP_IDS } from '../src/onboarding/guideIds.ts'

const memory = (initial = {}) => {
  const data = { ...initial }
  return { data, getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v) }, removeItem: (k) => { delete data[k] } }
}
const forbidden = { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') } }
const disjoint = (p) => p.completedStepIds.every((id) => !p.skippedStepIds.includes(id))

test('catalog ids: 70 unique, full route order and per-module counts', () => {
  assert.equal(ALL_STEP_IDS.length, 70)
  assert.equal(new Set(ALL_STEP_IDS).size, 70)
  assert.deepEqual(Object.fromEntries(Object.entries(MODULE_STEP_IDS).map(([k, v]) => [k, v.length])), { intro: 6, history: 8, production: 5, lab: 15, vietnam: 11, policy: 11, finale: 4, game: 10 })
  const full = ALL_STEP_IDS.join(' ')
  assert.ok(full.startsWith('I01 I02 I03 I04 I05 I06 T01 H01 H02'), 'T01 comes before the Atlas')
  assert.ok(full.includes('H08 T02 T03 T04 T05 L01'), 'rest of production follows the Atlas')
  assert.ok(full.endsWith('F04 G01 G02 G03 G04 G05 G06 G07 G08 G09 G10'))
})

test('blocked, malformed and missing storage fall back safely', () => {
  assert.equal(readGuideProgress(forbidden).status, 'new')
  assert.equal(writeGuideProgress(forbidden, createProgress()), false)
  assert.equal(readGuideProgress(null).status, 'new')
  assert.equal(writeGuideProgress(null, createProgress()), false)
  const bad = memory({ [GUIDE_STORAGE_KEY]: '{broken' })
  assert.deepEqual(readGuideProgress(bad).completedModules, [])
  assert.equal(readGuideProgress(memory({ [GUIDE_STORAGE_KEY]: '[1,2]' })).status, 'new')
  assert.equal(readGuideProgress(memory({ [GUIDE_STORAGE_KEY]: JSON.stringify({ schemaVersion: 2, status: 'bogus' }) })).status, 'new')
})

test('v2 round trip keeps ids, never numeric indexes', () => {
  const store = memory()
  let p = beginGuide(createProgress(), 'full', 'H03')
  p = completeStep(completeStep(p, 'H01'), 'H02')
  assert.equal(writeGuideProgress(store, p), true)
  const raw = JSON.parse(store.data[GUIDE_STORAGE_KEY])
  assert.equal(raw.schemaVersion, 2)
  assert.equal(raw.stepId, 'H03')
  assert.equal(raw.moduleId, 'history')
  assert.deepEqual(raw.completedStepIds, ['H01', 'H02'])
  assert.deepEqual(readGuideProgress(store), p)
})

test('stale ids and shapes are filtered on read', () => {
  const store = memory({ [GUIDE_STORAGE_KEY]: JSON.stringify({
    schemaVersion: 2, status: 'in-progress', route: 'full', moduleId: 'nope', stepId: 'X99',
    completedStepIds: ['H01', 'H01', 'Z01', 7, 'L02'], skippedStepIds: ['H01', 'P03', 'bad'], skippedModuleIds: ['lab', 'zzz'], lastExit: 'close',
  }) })
  const p = readGuideProgress(store)
  assert.deepEqual(p.completedStepIds, ['H01', 'L02'])
  assert.deepEqual(p.skippedStepIds, ['P03'], 'completed ids never stay skipped')
  assert.deepEqual(p.skippedModuleIds, ['lab'])
  assert.equal(p.status, 'dismissed', 'a stale in-progress step must not greet the user again')
  assert.equal(p.stepId, null)
})

test('v1 migration: valid, malformed, precedence and failed v2 write', () => {
  const v1 = JSON.stringify({ status: 'in-progress', route: 'lab', stepId: 'L04', completedModules: ['intro', 'lab', 'nope'] })
  const only = memory({ [GUIDE_LEGACY_STORAGE_KEY]: v1 })
  const migrated = readGuideProgress(only)
  assert.equal(migrated.schemaVersion, 2)
  assert.equal(migrated.status, 'in-progress')
  assert.equal(migrated.stepId, 'L04')
  assert.deepEqual(migrated.completedModules, ['intro', 'lab'])
  assert.ok(MODULE_STEP_IDS.intro.every((id) => migrated.completedStepIds.includes(id)))
  assert.ok(!migrated.completedStepIds.includes('H01'), 'only ids inside valid completed modules are inferred')
  assert.equal(readGuideProgress(memory({ [GUIDE_LEGACY_STORAGE_KEY]: '{oops' })).status, 'new')
  assert.equal(readGuideProgress(memory({ [GUIDE_LEGACY_STORAGE_KEY]: JSON.stringify({ status: 'dismissed' }) })).status, 'dismissed', 'dismissed stays dismissed')
  const both = memory({ [GUIDE_LEGACY_STORAGE_KEY]: v1, [GUIDE_STORAGE_KEY]: JSON.stringify({ ...createProgress(), status: 'completed' }) })
  assert.equal(readGuideProgress(both).status, 'completed', 'v2 wins when both are valid')
  const brokenV2 = memory({ [GUIDE_LEGACY_STORAGE_KEY]: v1, [GUIDE_STORAGE_KEY]: '{x' })
  assert.equal(readGuideProgress(brokenV2).stepId, 'L04', 'valid v1 rescues a corrupted v2')
  const failing = { ...only, setItem() { throw new Error('quota') } }
  assert.equal(writeGuideProgress(failing, migrated), false)
  assert.equal(only.data[GUIDE_LEGACY_STORAGE_KEY], v1, 'v1 survives a failed v2 write')
  assert.equal(writeGuideProgress(only, migrated), true)
  assert.equal(GUIDE_LEGACY_STORAGE_KEY in only.data, false, 'v1 removed only after a successful v2 write')
})

test('skip never records completion and never skips completed work', () => {
  let p = beginGuide(createProgress(), 'full', 'L02')
  p = skipStep(p, 'L02')
  assert.deepEqual(p.completedStepIds, [])
  assert.deepEqual(p.skippedStepIds, ['L02'])
  p = completeStep(p, 'L03')
  p = skipStep(p, 'L03')
  assert.deepEqual(p.skippedStepIds, ['L02'], 'a completed step cannot be skipped again')
  p = skipModule(p, 'lab')
  assert.ok(!p.skippedStepIds.includes('L03'))
  assert.ok(p.skippedStepIds.includes('L15'))
  assert.deepEqual(p.skippedModuleIds, ['lab'])
  assert.deepEqual(p.completedModules, [])
  assert.equal(p.lastExit, 'skip-module')
})

test('replaying and finishing a skipped step clears skipped state and recomputes modules', () => {
  let p = createProgress()
  for (const id of MODULE_STEP_IDS.finale) p = completeStep(p, id)
  assert.deepEqual(p.completedModules, ['finale'])
  p = skipModule(p, 'finale')
  assert.deepEqual(p.skippedModuleIds, [], 'completed module is never re-skipped')
  let q = createProgress()
  for (const id of MODULE_STEP_IDS.intro.slice(0, 5)) q = completeStep(q, id)
  q = skipModule(q, 'intro')
  assert.deepEqual(q.skippedStepIds, ['I06'])
  assert.deepEqual(q.skippedModuleIds, ['intro'])
  q = completeStep(q, 'I06')
  assert.deepEqual(q.skippedStepIds, [])
  assert.deepEqual(q.skippedModuleIds, [])
  assert.deepEqual(q.completedModules, ['intro'])
})

test('quick route completion is not the whole tour', () => {
  let p = beginGuide(createProgress(), 'quick', 'I02')
  for (const id of MODULE_STEP_IDS.intro) p = completeStep(p, id)
  p = finishRoute(p)
  assert.equal(p.status, 'completed')
  assert.equal(p.route, 'quick')
  assert.deepEqual(p.completedModules, ['intro'])
  assert.equal(p.completedStepIds.length, 6)
  assert.equal(resumeTarget(p), null)
})

test('welcome dismissal, pause and close keep the exact resume id', () => {
  const dismissed = dismissWelcome(createProgress())
  assert.equal(dismissed.status, 'dismissed')
  assert.equal(resumeTarget(dismissed), null)
  const running = beginGuide(createProgress(), 'full', 'H05')
  const paused = pauseGuide(running)
  assert.equal(paused.lastExit, 'pause')
  assert.deepEqual(resumeTarget(paused), { route: 'full', stepId: 'H05', moduleId: 'history' })
  const closed = closeGuide(running)
  assert.equal(closed.lastExit, 'close')
  assert.equal(closed.status, 'in-progress')
  const skipped = skipGuide(running)
  assert.equal(skipped.status, 'skipped')
  assert.equal(skipped.lastExit, 'skip-guide')
  assert.equal(resumeTarget(skipped).stepId, 'H05', 'skip-guide stays resumable')
})

test('declining the game at F04 follows the agreed persistence decision', () => {
  let p = beginGuide(createProgress(), 'full', 'F04')
  p = completeStep(p, 'G02')
  p = skipGameAtFinale(p)
  assert.equal(p.status, 'skipped')
  assert.equal(p.route, 'full')
  assert.equal(p.lastExit, 'skip-module')
  assert.equal(p.moduleId, 'game')
  assert.equal(p.stepId, 'G01')
  assert.ok(p.completedStepIds.includes('F04'))
  assert.ok(p.completedStepIds.includes('G02'), 'earlier game progress is kept')
  assert.ok(!p.skippedStepIds.includes('G02'))
  assert.ok(p.skippedStepIds.includes('G01') && p.skippedStepIds.includes('G10'))
  assert.deepEqual(p.skippedModuleIds, ['game'])
  assert.ok(!p.completedModules.includes('game'))
  assert.ok(disjoint(p))
  let done = createProgress()
  for (const id of MODULE_STEP_IDS.game) done = completeStep(done, id)
  done = skipGameAtFinale(done)
  assert.deepEqual(done.skippedModuleIds, [], 'a completed game is never marked skipped')
  assert.deepEqual(done.skippedStepIds, [])
})

test('invariants hold across random operation sequences and reloads', () => {
  let seed = 20261003
  const rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
  const pick = (list) => list[Math.floor(rand() * list.length)]
  const store = memory()
  let p = createProgress()
  for (let i = 0; i < 400; i += 1) {
    const id = pick(ALL_STEP_IDS)
    const op = pick(['complete', 'skip', 'skipModule', 'begin', 'pause', 'close', 'skipGuide', 'finish', 'game'])
    if (op === 'complete') p = completeStep(p, id)
    else if (op === 'skip') p = skipStep(p, id)
    else if (op === 'skipModule') p = skipModule(p, pick(Object.keys(MODULE_STEP_IDS)))
    else if (op === 'begin') p = beginGuide(p, pick(['full', 'quick', 'lab']), id)
    else if (op === 'pause') p = pauseGuide(p)
    else if (op === 'close') p = closeGuide(p)
    else if (op === 'skipGuide') p = skipGuide(p)
    else if (op === 'finish') p = finishRoute(p)
    else p = skipGameAtFinale(p)
    assert.ok(disjoint(p), `completed and skipped overlap after ${op} ${id}`)
    const derived = Object.keys(MODULE_STEP_IDS).filter((m) => MODULE_STEP_IDS[m].every((s) => p.completedStepIds.includes(s)))
    assert.deepEqual(p.completedModules, derived, 'completedModules must be derived from completed steps')
    assert.ok(p.skippedModuleIds.every((m) => !p.completedModules.includes(m)))
    assert.equal(new Set(p.completedStepIds).size, p.completedStepIds.length)
    writeGuideProgress(store, p)
    assert.deepEqual(readGuideProgress(store), p, 'reload reproduces the exact state')
  }
})

test('progress store keeps working when storage is blocked and notifies listeners', () => {
  const blocked = createProgressStore(forbidden)
  let calls = 0
  const stop = blocked.subscribe(() => { calls += 1 })
  blocked.update((p) => beginGuide(p, 'full', 'I02'))
  assert.equal(blocked.get().stepId, 'I02')
  assert.equal(blocked.isPersisted(), false)
  assert.equal(calls, 1)
  stop()
  blocked.update((p) => completeStep(p, 'I02'))
  assert.equal(calls, 1)
  const working = createProgressStore(memory())
  working.update((p) => beginGuide(p, 'quick', 'I02'))
  assert.equal(working.isPersisted(), true)
})
