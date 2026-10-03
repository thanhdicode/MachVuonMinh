import test from 'node:test'
import assert from 'node:assert/strict'
import { createGuideCatalog } from '../src/onboarding/guideCatalog.ts'
import { GuideError, createGuideController } from '../src/onboarding/guideController.ts'
import { createProgressStore, resumeTarget } from '../src/onboarding/guideProgress.ts'
import { captureDemo, createScrollLeases, demoRestorePatch } from '../src/onboarding/guideSession.ts'

const catalog = createGuideCatalog()
const settle = () => new Promise((resolve) => setImmediate(resolve))
const memory = () => { const data = {}; return { getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = String(v) } } }
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b }); return { promise, resolve, reject } }

function harness(options = {}) {
  const log = []
  const reports = []
  const lockLog = []
  const store = options.store ?? memory()
  const progress = createProgressStore(store)
  const leases = options.leases ?? createScrollLeases((locked) => lockLog.push(locked))
  const state = { demo: { automation: 60, forces: [50, 50, 50, 50, 50], relations: [50, 50, 50], evidenceCase: 0, evidenceLens: 0, farmStage: 1, slots: [null, null, null], reconfigure: 0 } }
  const holds = new Map()
  const failures = new Map()
  const practice = new Map()
  const game = []
  const positions = []
  const reasons = []
  const watchers = []
  let driverActive = false
  const presented = []
  const port = {
    async load() { log.push('load'); if (options.driverFails) throw new Error('chunk failed') },
    present(args) { driverActive = true; presented.push(args); log.push(`present:${args.step.id}`) },
    refresh() { log.push('refresh') },
    destroy() { driverActive = false; log.push('destroy'); if (options.destroyThrows) throw new Error('destroy failed') },
    isActive: () => driverActive,
  }
  const adapters = {
    context: () => options.context ?? {},
    prepare(step, { reason } = {}) {
      log.push(`prepare:${step.id}`)
      reasons.push(reason)
      if (failures.has(step.id)) return Promise.reject(failures.get(step.id))
      const wait = holds.get(step.id)
      const result = { element: { id: step.target }, cueHost: step.kind === 'modal' ? { id: 'dialog' } : null }
      return wait ? wait.promise.then(() => result) : Promise.resolve(result)
    },
    practice(step, { signal }) {
      const wait = deferred()
      practice.set(step.id, wait)
      signal.addEventListener('abort', () => wait.reject(new Error('aborted')), { once: true })
      return wait.promise
    },
    async closeOwnedModal() { log.push('closeModal'); if (options.closeThrows) throw new Error('modal failed') },
    closeOwnedModalSync() { log.push('closeModalSync'); if (options.closeSyncThrows) throw new Error('modal sync failed') },
    snapshotDemo: () => captureDemo(state.demo, options.position),
    restoreDemo(snapshot) { log.push('restoreDemo'); state.demo = demoRestorePatch(snapshot) },
    restorePosition(snapshot) { positions.push({ scrollY: snapshot.scrollY, era: snapshot.era }) },
    restoreFocus() { log.push('focus') },
    watch(step, { lost }) { watchers.push(lost) },
    game: { open: (id) => game.push(`open:${id}`), cancel: (mode) => game.push(`cancel:${mode}`) },
  }
  const controller = createGuideController({ catalog, progress, leases, adapters, port, report: (error, where) => reports.push(where) })
  return {
    controller, progress, leases, log, lockLog, reports, state, holds, failures, practice, game, positions, presented, store, reasons,
    lose: (reason) => watchers.at(-1)(reason),
    view: () => controller.getView(),
    count: (entry) => log.filter((line) => line === entry).length,
    hold(id) { const d = deferred(); holds.set(id, d); return d },
  }
}

test('start prepares the step, presents it and persists the exact id', async () => {
  const h = harness()
  await h.controller.start('lab')
  assert.equal(h.view().phase, 'presenting')
  assert.equal(h.view().step.id, 'L01')
  assert.ok(h.log.indexOf('prepare:L01') < h.log.indexOf('present:L01'))
  const saved = h.progress.get()
  assert.equal(saved.status, 'in-progress')
  assert.equal(saved.stepId, 'L01')
  assert.equal(saved.route, 'lab')
  assert.deepEqual(h.lockLog, [true], 'the tour holds the scroll lease while reading')
  assert.equal(h.view().counter.label, 'LAB')
  assert.equal(h.presented[0].counterText, 'LAB · 01 / 15')
})

test('quick and full routes pre-complete the welcome and start at the first real step', async () => {
  const h = harness()
  await h.controller.start('quick')
  assert.equal(h.view().step.id, 'I02')
  assert.equal(h.view().phase, 'practice')
  assert.ok(h.progress.get().completedStepIds.includes('I01'))
  assert.equal(h.view().canBack, false)
})

test('double Next creates exactly one transition', async () => {
  const h = harness()
  await h.controller.start('lab')
  const gate = h.hold('L02')
  const first = h.controller.next()
  const second = h.controller.next()
  await settle()
  assert.equal(h.count('prepare:L02'), 1)
  gate.resolve()
  await Promise.all([first, second])
  assert.equal(h.count('prepare:L02'), 1)
  assert.equal(h.view().step.id, 'L02')
  assert.deepEqual(h.progress.get().completedStepIds, ['L01'])
})

test('Next then cancel while preparing: the stale step never comes back', async () => {
  const h = harness()
  await h.controller.start('lab')
  const gate = h.hold('L02')
  const pending = h.controller.next()
  await settle()
  await h.controller.cancel()
  gate.resolve()
  await pending
  await settle()
  assert.equal(h.view().phase, 'cancelled')
  assert.equal(h.presented.filter((p) => p.step.id === 'L02').length, 0)
  assert.equal(h.practice.size, 0)
  assert.equal(h.leases.isLocked(), false)
  assert.equal(h.progress.get().lastExit, 'close')
  assert.equal(h.progress.get().status, 'in-progress')
  assert.ok(h.log.includes('destroy'))
})

test('Skip guide while preparing takes effect at once and records skipped, never completed', async () => {
  const h = harness()
  await h.controller.start('lab')
  const gate = h.hold('L02')
  const pending = h.controller.next()
  await settle()
  await h.controller.skip('guide')
  assert.equal(h.view().phase, 'idle')
  assert.equal(h.view().notice.kind, 'skipped')
  assert.equal(h.leases.isLocked(), false)
  const saved = h.progress.get()
  assert.equal(saved.status, 'skipped')
  assert.equal(saved.lastExit, 'skip-guide')
  assert.ok(!saved.completedStepIds.includes('L02'))
  gate.resolve()
  await pending
  await settle()
  assert.equal(h.view().phase, 'idle', 'a late resolve cannot revive the guide')
  assert.equal(h.practice.size, 0)
})

test('start, dispose, start (StrictMode) leaves one owner and one lease', async () => {
  const leases = createScrollLeases(() => {})
  const store = memory()
  const first = harness({ leases, store })
  await first.controller.start('lab')
  assert.equal(leases.counts().tour, 1)
  first.controller.dispose()
  await settle()
  assert.equal(leases.counts().tour, 0)
  const second = harness({ leases, store })
  await second.controller.start('lab')
  assert.equal(leases.counts().tour, 1)
  await second.controller.cancel()
  assert.equal(leases.counts().tour, 0)
})

test('teardown still destroys, releases the lease and persists when cleanup routines throw', async () => {
  const h = harness({ closeThrows: true, destroyThrows: true })
  await h.controller.start('lab')
  await h.controller.cancel()
  assert.ok(h.log.includes('destroy'))
  assert.ok(h.log.includes('closeModal'))
  assert.equal(h.leases.isLocked(), false)
  assert.equal(h.progress.get().lastExit, 'close')
  assert.equal(h.view().phase, 'cancelled')
  assert.ok(h.reports.includes('driver') && h.reports.includes('close-modal'))
  await h.controller.cancel()
  assert.equal(h.lockLog.filter((v) => v === false).length, 1, 'cleanup is idempotent')
})

test('practice confirms only after the real signal and the manual button completes the step', async () => {
  const h = harness()
  await h.controller.start('lab', 'L02')
  assert.equal(h.view().phase, 'practice')
  assert.equal(h.view().pose, 'practice')
  assert.equal(h.view().practiceSignaled, false)
  h.state.demo.forces[0] = 90
  h.practice.get('L02').resolve()
  await settle()
  assert.equal(h.view().practiceSignaled, true)
  assert.equal(h.view().pose, 'confirm')
  await h.controller.confirmPractice()
  assert.ok(h.progress.get().completedStepIds.includes('L02'))
  assert.equal(h.view().step.id, 'L03')
  assert.equal(h.view().pose, 'practice', 'the next practice starts without a confirm')
})

test('skipping a practice step rolls back only that step and never confirms', async () => {
  const h = harness()
  await h.controller.start('lab', 'L02')
  h.state.demo.forces[0] = 90
  await h.controller.confirmPractice()
  assert.equal(h.view().step.id, 'L03')
  h.state.demo.forces[1] = 10
  await h.controller.skip('step')
  assert.deepEqual(h.state.demo.forces, [90, 50, 50, 50, 50], 'step rollback keeps earlier kept work')
  assert.ok(h.progress.get().skippedStepIds.includes('L03'))
  assert.ok(!h.progress.get().completedStepIds.includes('L03'))
  assert.notEqual(h.view().pose, 'confirm')
  assert.equal(h.view().step.id, 'L04')
})

test('closing during the lab restores the module baseline but not preferences', async () => {
  const h = harness()
  await h.controller.start('lab', 'L02')
  h.state.demo.forces[0] = 99
  h.state.demo.relations[2] = 5
  await h.controller.cancel()
  assert.deepEqual(h.state.demo.forces, [50, 50, 50, 50, 50])
  assert.deepEqual(h.state.demo.relations, [50, 50, 50])
})

test('Skip module in the full route also skips the later steps of that module', async () => {
  const h = harness()
  await h.controller.start('full', 'T01')
  await h.controller.skip('module')
  assert.equal(h.view().step.id, 'H01')
  assert.deepEqual(h.progress.get().skippedModuleIds, ['production'])
  for (let i = 0; i < 8; i += 1) await h.controller.next()
  assert.equal(h.view().step.id, 'L01', 'T02-T05 are not offered after the Atlas')
  const saved = h.progress.get()
  for (const id of ['T01', 'T02', 'T03', 'T04', 'T05']) assert.ok(saved.skippedStepIds.includes(id) && !saved.completedStepIds.includes(id), id)
  assert.deepEqual(saved.completedModules, ['history'])
})

test('the full route never returns to the tool scene after the Atlas', async () => {
  const h = harness()
  await h.controller.start('full', 'I06')
  await h.controller.next()
  assert.equal(h.view().step.id, 'T01')
  await h.controller.next()
  assert.equal(h.view().step.id, 'H01')
  assert.equal(h.view().counter.label, 'ATLAS')
})

test('Back never changes completion', async () => {
  const h = harness()
  await h.controller.start('lab', 'L03')
  await h.controller.back()
  assert.equal(h.view().step.id, 'L02')
  assert.deepEqual(h.progress.get().completedStepIds, [])
})

test('pause keeps the id and resume prepares it again from scratch', async () => {
  const h = harness()
  await h.controller.start('lab', 'L05')
  await h.controller.pause()
  assert.equal(h.view().phase, 'paused')
  assert.equal(h.progress.get().lastExit, 'pause')
  assert.equal(h.progress.get().stepId, 'L05')
  assert.equal(h.leases.isLocked(), false)
  await h.controller.resume()
  assert.equal(h.count('prepare:L05'), 2, 'no stale geometry: the target is resolved again')
  assert.equal(h.view().step.id, 'L05')
  assert.equal(h.view().phase, 'practice')
})

test('declining the game at F04 follows the agreed decision and never opens the game', async () => {
  const h = harness()
  await h.controller.start('full', 'F04')
  assert.equal(h.view().nextText, 'Mở game và xem cách chơi')
  await h.controller.skipGame()
  const saved = h.progress.get()
  assert.equal(saved.status, 'skipped')
  assert.equal(saved.route, 'full')
  assert.equal(saved.lastExit, 'skip-module')
  assert.equal(saved.stepId, 'G01')
  assert.equal(saved.moduleId, 'game')
  assert.ok(saved.completedStepIds.includes('F04'))
  assert.ok(saved.skippedStepIds.includes('G01'))
  assert.deepEqual(saved.skippedModuleIds, ['game'])
  assert.deepEqual(h.game, [])
  assert.equal(h.view().notice.kind, 'game-skipped')
  assert.equal(h.leases.isLocked(), false)
})

test('choosing the game hands off to the iframe guide; skipping it keeps the game open', async () => {
  const h = harness()
  await h.controller.start('full', 'F04')
  await h.controller.playGame()
  assert.deepEqual(h.game, ['open:G01'])
  assert.equal(h.view().presenter, 'game')
  assert.equal(h.view().step.id, 'G01')
  assert.equal(h.leases.isLocked(), false, 'the tour lease is not what keeps the game open')
  assert.ok(h.progress.get().completedStepIds.includes('F04'))
  h.controller.gameEvent({ type: 'step-done', stepId: 'G01' })
  assert.ok(h.progress.get().completedStepIds.includes('G01'))
  await h.controller.skip('guide')
  assert.deepEqual(h.game, ['open:G01', 'cancel:guide-only'], 'skip never closes the game dialog')
  assert.equal(h.progress.get().status, 'skipped')
  assert.equal(h.progress.get().stepId, 'G01')
})

test('the lab ends with keep-or-restore and defaults to restoring', async () => {
  const h = harness()
  await h.controller.start('lab', 'L15')
  h.state.demo.forces[3] = 77
  await h.controller.confirmPractice()
  assert.equal(h.view().notice.kind, 'keep-or-restore')
  assert.notEqual(h.progress.get().status, 'completed', 'the route is not finished before the choice')
  await h.controller.resolveKeepRestore('restore')
  assert.deepEqual(h.state.demo.forces, [50, 50, 50, 50, 50])
  assert.equal(h.progress.get().status, 'completed')
  assert.equal(h.view().notice.kind, 'module-complete')
  const keep = harness()
  await keep.controller.start('policy', 'P11')
  keep.state.demo.slots = [1, 2, 3]
  await keep.controller.confirmPractice()
  await keep.controller.resolveKeepRestore('keep')
  assert.deepEqual(keep.state.demo.slots, [1, 2, 3])
  const dismissed = harness()
  await dismissed.controller.start('lab', 'L15')
  dismissed.state.demo.forces[0] = 1
  await dismissed.controller.confirmPractice()
  await dismissed.controller.cancel()
  assert.deepEqual(dismissed.state.demo.forces, [50, 50, 50, 50, 50], 'leaving the prompt restores by default')
})

test('a missing target offers retry, skip and text instead of an endless spinner', async () => {
  const h = harness()
  h.failures.set('L01', new GuideError('timeout'))
  await h.controller.start('lab')
  assert.equal(h.view().busy, false)
  assert.deepEqual(h.view().notice, { kind: 'missing-target', reason: 'timeout' })
  assert.equal(h.progress.get().completedStepIds.length, 0, 'a failure never marks anything completed')
  h.failures.delete('L01')
  await h.controller.retry()
  assert.equal(h.view().phase, 'presenting')
  assert.equal(h.view().notice, null)
  const text = harness()
  text.failures.set('L01', new GuideError('missing-target'))
  await text.controller.start('lab')
  text.controller.readAsText()
  assert.equal(text.view().presenter, 'cue')
  assert.equal(text.view().phase, 'presenting')
  const skip = harness()
  skip.failures.set('L01', new GuideError('missing-target'))
  await skip.controller.start('lab')
  await skip.controller.skip('step')
  assert.equal(skip.view().step.id, 'L02')
  assert.ok(skip.progress.get().skippedStepIds.includes('L01'))
})

test('a Driver chunk failure falls back to the written guide', async () => {
  const h = harness({ driverFails: true })
  await h.controller.start('lab')
  assert.equal(h.view().presenter, 'cue')
  assert.equal(h.view().notice.kind, 'driver-failed')
  assert.equal(h.presented.length, 0)
  await h.controller.skip('guide')
  assert.equal(h.progress.get().status, 'skipped')
})

test('handoff between steps keeps the tour lease and the end releases it once', async () => {
  const h = harness()
  await h.controller.start('lab', 'L01')
  await h.controller.next()
  await h.controller.next()
  assert.deepEqual(h.lockLog, [true])
  await h.controller.finish()
  assert.deepEqual(h.lockLog, [true, false])
  assert.equal(h.progress.get().status, 'completed')
})

test('welcome choices: explore and skip both persist dismissed and a reload does not greet again', async () => {
  const store = memory()
  const a = harness({ store })
  a.controller.showWelcome()
  assert.equal(a.view().welcomeVisible, true)
  await a.controller.chooseWelcome('explore')
  assert.equal(a.progress.get().status, 'dismissed')
  assert.equal(a.view().welcomeVisible, false)
  assert.equal(a.log.includes('present:I01'), false)
  assert.equal(createProgressStore(store).get().status, 'dismissed')
  const b = harness()
  b.controller.showWelcome()
  await b.controller.skip('guide')
  assert.equal(b.progress.get().status, 'dismissed', 'Skip at the welcome is dismissed, not skipped')
  const c = harness()
  c.controller.showWelcome()
  await c.controller.chooseWelcome('quick')
  assert.equal(c.view().route, 'quick')
  assert.equal(c.view().step.id, 'I02')
})

test('a new start while a guide runs tears the old one down and restores its demo', async () => {
  const h = harness()
  await h.controller.start('lab', 'L02')
  h.state.demo.forces[4] = 12
  await h.controller.start('policy')
  assert.deepEqual(h.state.demo.forces, [50, 50, 50, 50, 50])
  assert.equal(h.view().step.id, 'P01')
  assert.equal(h.leases.counts().tour, 1)
})

test('pagehide suspends layers synchronously and keeps the id resumable without skipped or completed marks', async () => {
  const h = harness()
  await h.controller.start('lab', 'L04')
  h.state.demo.forces[0] = 9
  h.controller.suspend()
  assert.equal(h.leases.isLocked(), false)
  assert.ok(h.log.includes('destroy'))
  assert.ok(h.log.includes('closeModalSync'))
  assert.deepEqual(h.state.demo.forces, [50, 50, 50, 50, 50])
  const saved = h.progress.get()
  assert.equal(saved.stepId, 'L04')
  assert.equal(saved.status, 'in-progress')
  assert.deepEqual(saved.skippedStepIds, [])
  assert.deepEqual(saved.completedStepIds, [])
})

test('pagehide releases and persists even when synchronous cleanup throws', async () => {
  const h = harness({ closeSyncThrows: true, destroyThrows: true })
  await h.controller.start('lab', 'L04')
  h.state.demo.forces[1] = 7
  h.controller.suspend()
  assert.equal(h.leases.isLocked(), false)
  assert.equal(h.progress.get().lastExit, 'close')
  assert.deepEqual(h.state.demo.forces, [50, 50, 50, 50, 50])
  assert.ok(h.reports.includes('driver') && h.reports.includes('close-modal'))
})

test('single-module replay restores its caller position but the full tour keeps its final position', async () => {
  const module = harness({ position: { scrollY: 732, era: 4 } })
  await module.controller.start('history', 'H08')
  await module.controller.next()
  assert.deepEqual(module.positions, [{ scrollY: 732, era: 4 }])

  const full = harness({ position: { scrollY: 211, era: 1 } })
  await full.controller.start('full', 'F04')
  await full.controller.skipGame()
  assert.deepEqual(full.positions, [])
})

test('single-module pause and cancel restore the caller position', async () => {
  for (const exit of ['pause', 'cancel']) {
    const h = harness({ position: { scrollY: 410, era: 2 } })
    await h.controller.start('history', 'H01')
    await h.controller[exit]()
    assert.deepEqual(h.positions, [{ scrollY: 410, era: 2 }])
  }
})

test('single-module guide skip and final module skip restore the caller position', async () => {
  const guide = harness({ position: { scrollY: 515, era: 3 } })
  await guide.controller.start('history', 'H01')
  await guide.controller.skip('guide')
  assert.deepEqual(guide.positions, [{ scrollY: 515, era: 3 }])

  const module = harness({ position: { scrollY: 616, era: 5 } })
  await module.controller.start('history', 'H08')
  await module.controller.skip('module')
  assert.deepEqual(module.positions, [{ scrollY: 616, era: 5 }])
})

test('suspend restores the module origin before resume can capture a replacement', async () => {
  const h = harness({ position: { scrollY: 840, era: 6 } })
  await h.controller.start('history', 'H03')
  h.controller.suspend()
  assert.deepEqual(h.positions, [{ scrollY: 840, era: 6 }])
  await h.controller.resume()
  await h.controller.cancel()
  assert.deepEqual(h.positions, [{ scrollY: 840, era: 6 }, { scrollY: 840, era: 6 }])
})

test('finishing the quick route marks only the intro and reports a partial tour', async () => {
  const h = harness()
  await h.controller.start('quick', 'I06')
  await h.controller.next()
  const saved = h.progress.get()
  assert.equal(saved.status, 'completed')
  assert.equal(saved.route, 'quick')
  assert.deepEqual(saved.completedModules, [])
  assert.deepEqual(h.view().notice, { kind: 'route-complete', route: 'quick', partial: true })
  assert.equal(h.view().pose, 'confirm')
})

test('replaying only the finale still hands the game offer to the game guide', async () => {
  const h = harness()
  await h.controller.start('finale', 'F04')
  assert.equal(h.view().nextText, 'Mở game và xem cách chơi')
  await h.controller.next()
  assert.deepEqual(h.game, ['open:G01'])
  assert.equal(h.view().presenter, 'game')
  assert.ok(h.progress.get().completedStepIds.includes('F04'))
})

test('a game started from a module replay is saved as the game route and resumes inside it', async () => {
  const h = harness()
  await h.controller.start('finale', 'F04')
  await h.controller.next()
  assert.equal(h.progress.get().route, 'game')
  assert.equal(h.view().route, 'game')
  h.controller.gameEvent({ type: 'step', stepId: 'G03' })
  h.controller.gameEvent({ type: 'closed', mode: 'dialog-closed' })
  const saved = h.progress.get()
  assert.equal(saved.status, 'in-progress')
  assert.equal(saved.route, 'game')
  assert.equal(saved.stepId, 'G03')
  assert.equal(saved.lastExit, 'close')
  assert.deepEqual(resumeTarget(saved), { route: 'game', stepId: 'G03', moduleId: 'game' })
})

test('after a scene change the cue keeps working and a restart restores the baseline before taking a new one', async () => {
  const h = harness()
  await h.controller.start('lab')
  h.state.demo.forces[3] = 77
  h.lose('scene-changed')
  assert.equal(h.view().phase, 'paused')
  assert.equal(h.view().notice.kind, 'scene-changed')
  await h.controller.retry()
  assert.equal(h.view().phase, 'presenting', 'the go-back button of the cue is not dead')
  assert.equal(h.view().step.id, 'L01')
  h.lose('scene-changed')
  await h.controller.start('lab')
  assert.equal(h.state.demo.forces[3], 50, 'the paused run is restored first, so the new baseline is the reader\'s own state')
  await h.controller.next()
  await h.controller.skip('step')
  h.lose('target-lost')
  assert.equal(h.view().notice.kind, 'missing-target')
  const before = h.view().step.id
  await h.controller.skip('step')
  assert.notEqual(h.view().step.id, before, 'skip works from a lost-target cue too')
})

test('skipping a step tells the adapters not to redirect; next and back do not', async () => {
  const h = harness()
  await h.controller.start('lab')
  await h.controller.skip('step')
  await h.controller.next()
  await h.controller.back()
  assert.deepEqual(h.reasons, ['enter', 'skip', 'enter', 'back'])
})

test('skips inside the game guide are saved, so finishing it reads as partial', async () => {
  const h = harness()
  await h.controller.start('full', 'F04')
  await h.controller.playGame()
  h.controller.gameEvent({ type: 'step-skipped', stepId: 'G02' })
  h.controller.gameEvent({ type: 'step-skipped', stepId: 'G03' })
  h.controller.gameEvent({ type: 'finished' })
  const saved = h.progress.get()
  assert.deepEqual(saved.skippedStepIds, ['G02', 'G03'])
  assert.equal(saved.status, 'completed')
  assert.deepEqual(h.view().notice, { kind: 'route-complete', route: 'full', partial: true })
})

test('a finished game can replay skipped steps until the dialog closes', async () => {
  const h = harness()
  await h.controller.start('full', 'F04')
  await h.controller.playGame()
  h.controller.gameEvent({ type: 'step-skipped', stepId: 'G02' })
  h.controller.gameEvent({ type: 'finished' })
  h.controller.gameEvent({ type: 'step', stepId: 'G02' })
  h.controller.gameEvent({ type: 'step-done', stepId: 'G02' })
  assert.ok(h.progress.get().completedStepIds.includes('G02'))
  assert.ok(!h.progress.get().skippedStepIds.includes('G02'))
  h.controller.gameEvent({ type: 'closed', mode: 'dialog-closed' })
  h.controller.gameEvent({ type: 'step', stepId: 'G03' })
  assert.notEqual(h.progress.get().stepId, 'G03')
})

test('a module-skipped game can replay while its dialog remains open', async () => {
  const h = harness()
  await h.controller.start('full', 'F04')
  await h.controller.playGame()
  h.controller.gameEvent({ type: 'skipped', scope: 'module' })
  h.controller.gameEvent({ type: 'step', stepId: 'G01' })
  assert.equal(h.view().presenter, 'game')
  assert.equal(h.view().step.id, 'G01')
  assert.equal(h.progress.get().status, 'in-progress')
})

test('a guide opened from the game owl records progress without a parent tour', () => {
  const h = harness()
  h.controller.gameEvent({ type: 'ready' })
  h.controller.gameEvent({ type: 'step', stepId: 'G01' })
  assert.equal(h.progress.get().route, 'game')
  assert.equal(h.progress.get().status, 'in-progress')
  h.controller.gameEvent({ type: 'step-done', stepId: 'G01' })
  assert.ok(h.progress.get().completedStepIds.includes('G01'))
  h.controller.gameEvent({ type: 'step', stepId: 'G02' })
  h.controller.gameEvent({ type: 'closed', mode: 'dialog-closed' })
  assert.deepEqual(resumeTarget(h.progress.get()), { route: 'game', stepId: 'G02', moduleId: 'game' })
  h.controller.gameEvent({ type: 'step', stepId: 'G03' })
  assert.equal(h.progress.get().stepId, 'G02')
})

test('game exits keep the module origin until the dialog actually closes', async () => {
  const exits = [
    { type: 'finished' },
    { type: 'skipped', scope: 'module' },
    { type: 'skipped', scope: 'guide' },
    { type: 'failed', reason: 'load' },
  ]
  for (const event of exits) {
    const h = harness({ position: { scrollY: 925, era: 7 } })
    await h.controller.start('finale', 'F04')
    await h.controller.playGame()
    h.controller.gameEvent(event)
    assert.deepEqual(h.positions, [], `${event.type} must not restore behind an open game dialog`)
    h.controller.gameEvent({ type: 'closed', mode: 'dialog-closed' })
    assert.deepEqual(h.positions, [{ scrollY: 925, era: 7 }], `${event.type} restores when the dialog closes`)
  }
})

test('parent-side game exits also defer position restore until dialog close', async () => {
  for (const exit of ['skip', 'cancel', 'pause']) {
    const h = harness({ position: { scrollY: 975, era: 7 } })
    await h.controller.start('finale', 'F04')
    await h.controller.playGame()
    if (exit === 'skip') await h.controller.skip('guide')
    else await h.controller[exit]()
    assert.deepEqual(h.positions, [], `${exit} must not restore behind the game dialog`)
    h.controller.gameEvent({ type: 'closed', mode: 'dialog-closed' })
    assert.deepEqual(h.positions, [{ scrollY: 975, era: 7 }])
  }
})

test('"skip this part" inside the game records the whole game as skipped', async () => {
  const h = harness()
  await h.controller.start('full', 'F04')
  await h.controller.playGame()
  h.controller.gameEvent({ type: 'step-done', stepId: 'G01' })
  h.controller.gameEvent({ type: 'step', stepId: 'G03' })
  h.controller.gameEvent({ type: 'skipped', scope: 'module' })
  const saved = h.progress.get()
  assert.equal(saved.status, 'skipped')
  assert.equal(saved.lastExit, 'skip-module')
  assert.deepEqual(saved.skippedModuleIds, ['game'])
  assert.deepEqual(saved.skippedStepIds, ['G02', 'G03', 'G04', 'G05', 'G06', 'G07', 'G08', 'G09', 'G10'])
  assert.ok(saved.completedStepIds.includes('G01'), 'what was already seen stays completed')
  assert.deepEqual(h.view().notice, { kind: 'module-skipped', moduleId: 'game' })
})

test('a game reached through the full route stays on the full route', async () => {
  const h = harness()
  await h.controller.start('full', 'F04')
  await h.controller.playGame()
  assert.equal(h.progress.get().route, 'full')
  h.controller.gameEvent({ type: 'step', stepId: 'G02' })
  h.controller.gameEvent({ type: 'closed', mode: 'dialog-closed' })
  assert.deepEqual(resumeTarget(h.progress.get()), { route: 'full', stepId: 'G02', moduleId: 'game' })
})

test('pagehide leaves a coherent, resumable state: no dead cue, late signals and Next are inert', async () => {
  const h = harness()
  await h.controller.start('lab', 'L02')
  assert.equal(h.view().phase, 'practice')
  h.controller.suspend()
  assert.equal(h.view().phase, 'cancelled')
  assert.equal(h.view().presenter, 'none')
  assert.equal(h.view().busy, false)
  assert.equal(h.progress.get().lastExit, 'close')
  h.practice.get('L02').resolve()
  await settle()
  assert.equal(h.view().practiceSignaled, false, 'a late practice signal cannot revive the cue')
  await h.controller.next()
  assert.equal(h.view().phase, 'cancelled')
  assert.deepEqual(h.progress.get().completedStepIds, [])
  assert.equal(h.leases.isLocked(), false)
  await h.controller.resume()
  assert.equal(h.view().step.id, 'L02')
  assert.equal(h.view().phase, 'practice')
  assert.equal(h.leases.isLocked(), true)
})
