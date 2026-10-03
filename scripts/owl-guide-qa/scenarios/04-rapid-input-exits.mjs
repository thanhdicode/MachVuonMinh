// Scenario 4 — rapid input, exits from every layer, late preparation never revives the guide.
// Parts: A production (hammer Next, Next/Back, skip step), B lab (Esc, ×, pause, skip in practice),
//        C preparing exits, D dialog exits (I05 menu, H07 source, V10 source). Run one part with --part A|B|C|D.
import { openPage, createReport, probe, progressOf, waitFor, waitSettled, primary, wait, guarded, unexpectedErrors, openMenu, clickMenu, seedProgress, KEY, unlockIntro, sleepFrames } from './lib.mjs'

const report = createReport('04-rapid-input-exits')
const ABORTED = [/ERR_ABORTED/]
const NOTICE = ['skipped', 'paused', 'module-skipped', 'module-complete', 'route-complete', 'game-skipped', 'game-failed']
const partArg = process.argv.includes('--part') ? process.argv[process.argv.indexOf('--part') + 1] : null
const wantPart = (name) => !partArg || partArg === name

const armWatch = (page) => page.evaluate((notices) => {
  window.__qaAdded = []
  window.__qaObs?.disconnect()
  const wanted = '.driver-popover,.driver-overlay,.mach-guide-cue'
  window.__qaObs = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType !== 1) continue
        const hits = node.matches?.(wanted) ? [node] : Array.from(node.querySelectorAll?.(wanted) ?? [])
        for (const hit of hits) window.__qaAdded.push({ cls: String(hit.className).split(' ').slice(0, 2).join('.'), kind: hit.dataset?.kind ?? null, notice: notices.includes(hit.dataset?.kind), t: Math.round(performance.now()) })
      }
    }
  })
  window.__qaObs.observe(document.body, { childList: true, subtree: true })
}, NOTICE)
const added = (page) => page.evaluate(() => window.__qaAdded ?? [])
const pageNow = (page) => page.evaluate(() => Math.round(performance.now()))

const waitGone = (page) => waitFor(page, (notices) => !document.querySelector('.driver-popover') && !document.querySelector('.driver-overlay') && !Array.from(document.querySelectorAll('.mach-guide-cue')).some((cue) => !notices.includes(cue.dataset.kind)), NOTICE, 30000)

async function dismissNotice(page) {
  await page.evaluate(() => document.querySelector('.mach-guide-cue [data-action="dismiss"]')?.click())
}

async function startModule(page, title) {
  await dismissNotice(page)
  await page.evaluate(() => { if (!document.querySelector('.mach-guide-menu')) document.querySelector('.mach-guide-dock__button')?.click() })
  await page.waitForSelector('.mach-guide-menu', { timeout: 30000 })
  await clickMenu(page, title)
  await waitSettled(page)
}

async function resumeFromMenu(page) {
  await dismissNotice(page)
  await page.evaluate(() => { if (!document.querySelector('.mach-guide-menu')) document.querySelector('.mach-guide-dock__button')?.click() })
  await page.waitForSelector('.mach-guide-menu', { timeout: 30000 })
  await clickMenu(page, 'Tiếp tục bước dang dở')
  await waitSettled(page)
}

async function realClick(page, selector) {
  const handle = await page.$(selector)
  if (!handle) throw new Error(`no element for ${selector}`)
  const box = await handle.boundingBox()
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2
  const top = await page.evaluate((x, y) => { const element = document.elementFromPoint(x, y); return element ? `${element.tagName.toLowerCase()}.${String(element.className).split(' ')[0]}` : null }, cx, cy)
  await page.mouse.click(cx, cy)
  return top
}

async function assertExit(page, id, label, spec) {
  await waitGone(page)
  await sleepFrames(page, 1)
  const s = await probe(page)
  const stepCues = await page.evaluate((notices) => Array.from(document.querySelectorAll('.mach-guide-cue')).filter((cue) => !notices.includes(cue.dataset.kind)).length, NOTICE)
  report.check(`${id}.layers`, `${label}: no overlay / popover / step cue left`, s.overlays === 0 && s.popovers === 0 && stepCues === 0, { overlays: s.overlays, popovers: s.popovers, stepCues, cue: s.cueKind })
  report.check(`${id}.lock`, `${label}: scroll lock released`, spec.lock ? s.body.includes('guide-scroll-locked') : !s.body.includes('guide-scroll-locked'), { body: s.body })
  if (spec.scrollBefore !== undefined) report.check(`${id}.scroll`, `${label}: the exit did not move the page`, Math.abs(s.scrollY - spec.scrollBefore) <= 1, { before: spec.scrollBefore, after: s.scrollY })
  report.check(`${id}.focus`, `${label}: focus back on the owl button`, s.focus.includes('mach-guide-dock__button'), s.focus)
  const p = s.progress
  report.check(`${id}.progress`, `${label}: status=${spec.status}, lastExit=${spec.lastExit}${spec.stepId ? ', step=' + spec.stepId : ''}`, p?.status === spec.status && p?.lastExit === spec.lastExit && (!spec.stepId || p?.stepId === spec.stepId), { status: p?.status, lastExit: p?.lastExit, stepId: p?.stepId })
  if (spec.completed) report.check(`${id}.completed`, `${label}: completed ids are exactly ${JSON.stringify(spec.completed)} (skip/close never add completion)`, JSON.stringify(p?.completedStepIds) === JSON.stringify(spec.completed), { completed: p?.completedStepIds, skipped: p?.skippedStepIds })
  const disjoint = !p || !(p.completedStepIds ?? []).some((stepId) => (p.skippedStepIds ?? []).includes(stepId))
  report.check(`${id}.disjoint`, `${label}: completed and skipped stay disjoint`, disjoint, { completed: p?.completedStepIds?.length, skipped: p?.skippedStepIds })
  return s
}

async function noRevival(page, id, label, since, extraMs = 9000) {
  const mark = await pageNow(page)
  await waitFor(page, (t) => performance.now() > t, mark + extraMs, extraMs + 30000)
  const stray = (await added(page)).filter((entry) => entry.t >= since && !entry.notice)
  const s = await probe(page)
  report.check(`${id}.no-revival`, `${label}: ${extraMs / 1000} s later nothing revived (no popover/overlay/step cue was added after the exit)`, stray.length === 0 && s.popovers === 0 && s.overlays === 0, { stray, popovers: s.popovers, overlays: s.overlays, status: s.progress?.status })
}

const sessionOptions = { storage: { [KEY]: seedProgress({ status: 'dismissed' }) } }

// ======== Part A ========
if (wantPart('A')) {
  const { browser, page, errors } = await openPage(sessionOptions)
  await guarded(report, browser, async () => {
    await unlockIntro(page)
    await armWatch(page)
    // A1: ten synchronous clicks on the same Next button -> one transition (T01 -> T02).
    await startModule(page, 'Công cụ, máy móc')
    await waitFor(page, () => document.querySelectorAll('.driver-overlay').length === 1, null, 60000)
    let s = await probe(page)
    report.check('4.1.start', 'production module starts at T01 with one Driver popover and one overlay', s.progress?.stepId === 'T01' && s.popovers === 1 && s.overlays === 1, { step: s.progress?.stepId, popovers: s.popovers, overlays: s.overlays })
    const hammer = await page.evaluate(() => { const next = document.querySelector('.driver-popover-next-btn'); for (let i = 0; i < 10; i += 1) next.click(); return true })
    await waitFor(page, () => { try { return JSON.parse(localStorage.getItem('mach-vuon-minh:guide:v2')).stepId === 'T02' } catch { return false } }, null, 120000)
    await waitSettled(page)
    await waitFor(page, () => document.querySelectorAll('.driver-overlay').length === 1, null, 60000)
    s = await probe(page)
    report.check('4.2.hammer-next', 'ten rapid Next clicks produce exactly one transition (T01 -> T02), T01 completed once, T03 untouched', hammer && s.progress?.stepId === 'T02' && JSON.stringify(s.progress.completedStepIds) === JSON.stringify(['T01']) && s.popovers === 1 && s.overlays === 1, { step: s.progress?.stepId, done: s.progress?.completedStepIds, popovers: s.popovers, overlays: s.overlays })
    // A2: alternate Next/Back on one popover -> the first click wins, the rest are ignored while busy.
    await page.evaluate(() => { const next = document.querySelector('.driver-popover-next-btn'), prev = document.querySelector('.driver-popover-prev-btn'); for (let i = 0; i < 3; i += 1) { next.click(); prev.click() } })
    await waitFor(page, () => { try { return JSON.parse(localStorage.getItem('mach-vuon-minh:guide:v2')).stepId === 'T03' } catch { return false } }, null, 120000)
    await waitSettled(page)
    await sleepFrames(page, 10)
    s = await probe(page)
    report.check('4.3.alternate-next-back', 'Next,Back,Next,Back,… in one tick lands on T03 only (practice cue, no stale popover/overlay), T02 completed once', s.progress?.stepId === 'T03' && s.cueKind === 'practice' && s.popovers === 0 && s.overlays === 0 && JSON.stringify(s.progress.completedStepIds) === JSON.stringify(['T01', 'T02']), { step: s.progress?.stepId, cue: s.cueKind, done: s.progress?.completedStepIds, popovers: s.popovers })
    await report.shot(page, '4.3-T03-practice')
    // A3: keyboard on the real range changes the value, not the tour; then a double Skip step.
    const slider = '#automation'
    const before = await page.$eval(slider, (input) => Number(input.value))
    await page.focus(slider)
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    const mid = await page.$eval(slider, (input) => Number(input.value))
    const stepMid = (await progressOf(page)).stepId
    report.check('4.4.range-keyboard', 'ArrowRight on the range changes its value and does not advance the tour', mid > before && stepMid === 'T03', { before, mid, step: stepMid })
    await page.evaluate(() => { const skip = document.querySelector('.mach-guide-cue [data-action="skip-step"]'); skip.click(); skip.click() })
    await waitFor(page, () => { try { return JSON.parse(localStorage.getItem('mach-vuon-minh:guide:v2')).stepId === 'T04' } catch { return false } }, null, 120000)
    await waitSettled(page)
    s = await probe(page)
    const restored = await page.$eval(slider, (input) => Number(input.value)).catch(() => null)
    report.check('4.5.double-skip-step', 'a double click on "Bỏ qua bước này" skips T03 once and lands on T04; T03 is skipped, not completed', s.progress?.stepId === 'T04' && JSON.stringify(s.progress.skippedStepIds) === JSON.stringify(['T03']) && !s.progress.completedStepIds.includes('T03'), { step: s.progress?.stepId, skipped: s.progress?.skippedStepIds, done: s.progress?.completedStepIds })
    report.check('4.6.step-rollback', 'skipping the practice step restores the slider to the value it had before the step', restored === before || restored === null, { before, mid, restored })
    // A4: Bỏ qua hướng dẫn while a Driver step is presented (real mouse click).
    const scrollBefore = (await probe(page)).scrollY
    const t0 = await pageNow(page)
    const top = await realClick(page, '.driver-popover .mach-guide__btn--skip')
    report.note('4.7.hit-test', `element under the Skip centre before the click: ${top}`)
    s = await assertExit(page, '4.7', 'Skip guide while presenting (T04)', { scrollBefore, status: 'skipped', lastExit: 'skip-guide', stepId: 'T04', completed: ['T01', 'T02'] })
    await noRevival(page, '4.7', 'Skip guide while presenting', t0, 4000)
    await report.shot(page, '4.7-after-skip')
    // A5: Skip the instant the popover is inserted: Driver has not drawn its overlay yet (first animation frame pending).
    await dismissNotice(page)
    await page.evaluate(() => {
      window.__qaInstant = null
      const obs = new MutationObserver(() => {
        const pop = document.querySelector('.driver-popover')
        if (!pop || window.__qaInstant) return
        obs.disconnect()
        window.__qaInstant = { overlayAtPopover: document.querySelectorAll('.driver-overlay').length, t: Math.round(performance.now()) }
        pop.querySelector('.mach-guide__btn--skip')?.click()
      })
      obs.observe(document.body, { childList: true })
    })
    await page.evaluate(() => document.querySelector('.mach-guide-dock__button').click())
    await page.waitForSelector('.mach-guide-menu', { timeout: 30000 })
    await clickMenu(page, 'Công cụ, máy móc')
    await waitFor(page, () => !!window.__qaInstant, null, 120000)
    const instant = await page.evaluate(() => window.__qaInstant)
    await waitGone(page)
    await noRevival(page, '4.9', 'Skip the instant the popover appears', instant.t + 2, 6000)
    s = await probe(page)
    report.check('4.9.instant-skip', 'Skip before Driver drew its overlay: no overlay ever appears afterwards, no popover, lock released, status skipped', instant.overlayAtPopover === 0 && s.overlays === 0 && s.popovers === 0 && !s.body.includes('guide-scroll-locked') && s.progress?.status === 'skipped', { overlayAtPopover: instant.overlayAtPopover, overlays: s.overlays, popovers: s.popovers, body: s.body, status: s.progress?.status, bodyClasses: s.body })
    report.check('4.8.console-clean', 'no console errors / page errors (Part A)', unexpectedErrors(errors, ABORTED).length === 0, unexpectedErrors(errors, ABORTED).slice(0, 4))
  })
}

// ======== Part B ========
if (wantPart('B')) {
  const { browser, page, errors } = await openPage(sessionOptions)
  await guarded(report, browser, async () => {
    await unlockIntro(page)
    await armWatch(page)
    // B1: Esc on a Driver step -> close.
    await startModule(page, 'Phòng biện chứng')
    let s = await probe(page)
    report.check('4.10.start', 'lab module starts at L01 (Driver popover)', s.progress?.stepId === 'L01' && s.popovers === 1, { step: s.progress?.stepId })
    let scrollBefore = s.scrollY
    await page.keyboard.press('Escape')
    s = await assertExit(page, '4.11', 'Esc on a Driver step', { scrollBefore, status: 'in-progress', lastExit: 'close', stepId: 'L01' })
    const menuAfterEsc = await (async () => { await openMenu(page); const entry = await page.evaluate(() => Array.from(document.querySelectorAll('.mach-guide-menu button')).some((b) => b.textContent.startsWith('Tiếp tục bước dang dở'))); await page.keyboard.press('Escape'); return entry })()
    report.check('4.12.esc-resumable', 'Esc leaves the exact step resumable from the owl menu', menuAfterEsc, null)
    // B2: resume, then × -> close.
    await resumeFromMenu(page)
    await waitFor(page, () => document.querySelectorAll('.driver-overlay').length === 1, null, 60000)
    s = await probe(page)
    report.check('4.13.resume', 'resume re-prepares L01 (one popover, one overlay)', s.progress?.stepId === 'L01' && s.popovers === 1 && s.overlays === 1, { step: s.progress?.stepId, popovers: s.popovers, overlays: s.overlays })
    scrollBefore = s.scrollY
    await realClick(page, '.driver-popover-close-btn')
    await assertExit(page, '4.14', '× on a Driver step', { scrollBefore, status: 'in-progress', lastExit: 'close', stepId: 'L01' })
    // B3: pause.
    await resumeFromMenu(page)
    scrollBefore = (await probe(page)).scrollY
    await realClick(page, '.driver-popover .mach-guide__btn--quiet[data-action="pause"]')
    s = await assertExit(page, '4.15', 'Tạm dừng hướng dẫn', { scrollBefore, status: 'in-progress', lastExit: 'pause', stepId: 'L01' })
    report.check('4.16.pause-notice', 'pausing shows the paused notice with a resume button', s.cueKind === 'paused' && await page.evaluate(() => !!document.querySelector('.mach-guide-cue [data-action="resume"]')), { cue: s.cueKind })
    await page.evaluate(() => document.querySelector('.mach-guide-cue [data-action="resume"]').click())
    await waitSettled(page)
    s = await probe(page)
    report.check('4.17.resume-after-pause', 'Tiếp tục hướng dẫn re-prepares exactly L01', s.progress?.stepId === 'L01' && s.popovers === 1 && s.progress?.lastExit === null, { step: s.progress?.stepId, lastExit: s.progress?.lastExit, popovers: s.popovers })
    // B4: practice step (L02) with a changed slider, then Skip guide -> demo restored.
    await primary(page)
    await waitFor(page, () => document.querySelector('.mach-guide-cue')?.dataset.kind === 'practice', null, 120000)
    const input = '[data-guide~="lab-technology"] input'
    const original = await page.$eval(input, (el) => Number(el.value))
    await page.focus(input)
    for (let i = 0; i < 4; i += 1) await page.keyboard.press('ArrowRight')
    await waitFor(page, () => !!document.querySelector('.mach-guide-cue__hint[data-signaled]'), null, 30000)
    const changed = await page.$eval(input, (el) => Number(el.value))
    scrollBefore = (await probe(page)).scrollY
    const t0 = await pageNow(page)
    const top = await realClick(page, '.mach-guide-cue .mach-guide__btn--skip')
    report.note('4.18.hit-test', `element under Skip (practice cue): ${top}`)
    s = await assertExit(page, '4.18', 'Skip guide while practising L02', { scrollBefore, status: 'skipped', lastExit: 'skip-guide', stepId: 'L02', completed: ['L01'] })
    const rolled = await page.$eval(input, (el) => Number(el.value))
    report.check('4.19.rollback-on-skip', 'the slider the reader moved during the unfinished lab practice is restored when the guide is skipped', rolled === original, { original, changed, rolled })
    await noRevival(page, '4.18', 'Skip guide in practice', t0, 4000)
    await report.shot(page, '4.18-after-skip-practice')
    // B5: replay completes a previously skipped step and removes it from skipped.
    await startModule(page, 'Phòng biện chứng')
    s = await probe(page)
    await primary(page)
    await waitFor(page, () => { try { return JSON.parse(localStorage.getItem('mach-vuon-minh:guide:v2')).stepId === 'L02' } catch { return false } }, null, 120000)
    await waitSettled(page)
    await page.evaluate(() => document.querySelector('.mach-guide-cue [data-action="skip-step"]').click())
    await waitFor(page, () => { try { return JSON.parse(localStorage.getItem('mach-vuon-minh:guide:v2')).stepId === 'L03' } catch { return false } }, null, 120000)
    await waitSettled(page)
    s = await probe(page)
    report.check('4.20.skip-step-records', 'Skip step records L02 as skipped (not completed)', s.progress.skippedStepIds.includes('L02') && !s.progress.completedStepIds.includes('L02'), { skipped: s.progress.skippedStepIds, done: s.progress.completedStepIds })
    await page.evaluate(() => document.querySelector('.mach-guide-cue [data-action="skip-guide"]')?.click())
    await waitGone(page)
    await startModule(page, 'Phòng biện chứng')
    await primary(page)
    await waitFor(page, () => { try { return JSON.parse(localStorage.getItem('mach-vuon-minh:guide:v2')).stepId === 'L02' } catch { return false } }, null, 120000)
    await waitSettled(page)
    await page.evaluate(() => document.querySelector('.mach-guide-cue [data-action="practice-done"]').click())
    await waitFor(page, () => { try { return JSON.parse(localStorage.getItem('mach-vuon-minh:guide:v2')).stepId === 'L03' } catch { return false } }, null, 120000)
    s = await probe(page)
    report.check('4.21.replay-clears-skipped', 'replaying and completing L02 removes it from skippedStepIds', s.progress.completedStepIds.includes('L02') && !s.progress.skippedStepIds.includes('L02'), { skipped: s.progress.skippedStepIds, done: s.progress.completedStepIds })
    report.check('4.22.console-clean', 'no console errors / page errors (Part B)', unexpectedErrors(errors, ABORTED).length === 0, unexpectedErrors(errors, ABORTED).slice(0, 4))
  })
}

// ======== Part C: exits while preparing ========
if (wantPart('C')) {
  const { browser, page, errors } = await openPage(sessionOptions)
  await guarded(report, browser, async () => {
    await unlockIntro(page)
    await armWatch(page)
    const preparingCue = () => waitFor(page, () => document.querySelector('.mach-guide-cue')?.dataset.kind === 'preparing', null, 60000)
    // C1: Skip guide while a far scene is being prepared (intro -> policy chamber).
    await dismissNotice(page)
    await page.evaluate(() => document.querySelector('.mach-guide-dock__button').click())
    await page.waitForSelector('.mach-guide-menu')
    await clickMenu(page, 'Buồng chính sách')
    await preparingCue()
    let before = await probe(page)
    const skipVisible = await page.evaluate(() => { const b = document.querySelector('.mach-guide-cue .mach-guide__btn--skip'); if (!b) return null; const r = b.getBoundingClientRect(); return { disabled: b.disabled, inViewport: r.top >= 0 && r.bottom <= innerHeight } })
    report.check('4.30.skip-visible-preparing', 'while preparing, Bỏ qua hướng dẫn is on screen and enabled', skipVisible && !skipVisible.disabled && skipVisible.inViewport, skipVisible)
    await report.shot(page, '4.30-preparing')
    const t0 = await pageNow(page)
    const top = await realClick(page, '.mach-guide-cue .mach-guide__btn--skip')
    report.note('4.30.hit-test', `element under Skip while preparing: ${top}`)
    await waitGone(page)
    await sleepFrames(page, 1)
    let s = await probe(page)
    report.check('4.31.skip-preparing', 'Skip guide while preparing: status skipped / skip-guide, nothing completed, no overlay/popover/step cue, lock released', s.progress?.status === 'skipped' && s.progress.lastExit === 'skip-guide' && s.progress.completedStepIds.length === 0 && s.overlays === 0 && s.popovers === 0 && !s.body.includes('guide-scroll-locked'), { status: s.progress?.status, lastExit: s.progress?.lastExit, done: s.progress?.completedStepIds, body: s.body, cue: s.cueKind })
    report.check('4.32.focus-preparing', 'focus on the owl button after skipping during preparation', s.focus.includes('mach-guide-dock__button'), s.focus)
    const scrollAtExit = s.scrollY
    await noRevival(page, '4.33', 'Skip while preparing (late preparation)', t0, 12000)
    const settled = await probe(page)
    report.note('4.33.scroll', `scrollY at exit ${before.scrollY}->${scrollAtExit}, 12 s later ${settled.scrollY} (a navigation already started by the guide may finish on its own)`)
    report.check('4.34.unlocked-after-late-resolve', 'after the late resolve: still skipped, scroll lock still released, no body lock', settled.progress?.status === 'skipped' && !settled.body.includes('guide-scroll-locked'), { status: settled.progress?.status, body: settled.body })
    // C2: Esc while preparing.
    await dismissNotice(page)
    await page.evaluate(() => document.querySelector('.mach-guide-dock__button').click())
    await page.waitForSelector('.mach-guide-menu')
    await clickMenu(page, 'Việt Nam và bằng chứng')
    await preparingCue()
    const t1 = await pageNow(page)
    await page.keyboard.press('Escape')
    await wait(1500)
    s = await probe(page)
    const closedByEsc = s.progress?.status === 'in-progress' && s.progress.lastExit === 'close' && s.popovers === 0
    report.check('4.35.esc-preparing', 'Esc while preparing closes the guide (in-progress + close) and the late preparation cannot revive it', closedByEsc && s.cueKind !== 'preparing', { status: s.progress?.status, lastExit: s.progress?.lastExit, cue: s.cueKind, focus: s.focus })
    if (closedByEsc) { await waitGone(page); await noRevival(page, '4.35', 'Esc while preparing', t1, 9000) }
    await report.shot(page, '4.35-after-esc')
    report.check('4.36.console-clean', 'no console errors / page errors (Part C)', unexpectedErrors(errors, ABORTED).length === 0, unexpectedErrors(errors, ABORTED).slice(0, 4))
  })
}

// ======== Part D: dialogs ========
if (wantPart('D')) {
  const cases = [
    { id: '4.40', name: 'H07 source drawer (history)', module: 'history', step: 'H07', done: ['H01', 'H02', 'H03', 'H04', 'H05', 'H06'], dialog: 'dialog.source-drawer' },
    { id: '4.41', name: 'V10 source drawer (vietnam)', module: 'vietnam', step: 'V10', done: ['V01', 'V02', 'V03', 'V04', 'V05', 'V06', 'V07', 'V08', 'V09'], dialog: 'dialog.source-drawer' },
    { id: '4.42', name: 'I05 menu drawer (intro)', module: 'intro', step: 'I05', done: ['I01', 'I02', 'I03', 'I04'], dialog: 'dialog.source-drawer' },
  ]
  for (const entry of cases) {
    const { browser, page, errors } = await openPage({ storage: { [KEY]: seedProgress({ status: 'in-progress', route: entry.module === 'intro' ? 'full' : entry.module, moduleId: entry.module, stepId: entry.step, completedStepIds: entry.done, lastExit: 'close' }) } })
    await guarded(report, browser, async () => {
      await armWatch(page)
      if (entry.step === 'I05') await unlockIntro(page)
      await resumeFromMenu(page)
      await waitFor(page, (dialog) => !!document.querySelector(`${dialog}[open] .mach-guide-cue`), entry.dialog, 120000)
      let s = await probe(page)
      report.check(`${entry.id}.modal-cue`, `${entry.name}: the guide opened the dialog and its cue lives inside it`, s.cueHost === 'dialog' && s.openDialogs.length === 1 && s.body.includes('guide-scroll-locked'), { cueHost: s.cueHost, dialogs: s.openDialogs, body: s.body })
      await report.shot(page, `${entry.id}-dialog-cue`)
      const scrollBefore = s.scrollY
      const t0 = await pageNow(page)
      const top = await realClick(page, '.mach-guide-cue .mach-guide__btn--skip')
      report.note(`${entry.id}.hit-test`, `element under Skip inside the dialog: ${top}`)
      await waitFor(page, (dialog) => !document.querySelector(`${dialog}[open]`), entry.dialog, 30000).catch(() => {})
      s = await assertExit(page, entry.id, `${entry.name}: Skip guide inside the dialog`, { scrollBefore, status: 'skipped', lastExit: 'skip-guide', stepId: entry.step })
      report.check(`${entry.id}.dialog-closed`, `${entry.name}: the dialog the guide opened is closed, drawer-open class gone`, s.openDialogs.length === 0 && !s.body.includes('drawer-open'), { dialogs: s.openDialogs, body: s.body })
      report.check(`${entry.id}.completed-kept`, `${entry.name}: earlier completed steps are kept, ${entry.step} is not completed`, entry.done.every((id) => s.progress.completedStepIds.includes(id)) && !s.progress.completedStepIds.includes(entry.step), { done: s.progress.completedStepIds })
      await noRevival(page, entry.id, entry.name, t0, 5000)
      await report.shot(page, `${entry.id}-after-skip`)
      report.check(`${entry.id}.console-clean`, 'no console errors / page errors', unexpectedErrors(errors, ABORTED).length === 0, unexpectedErrors(errors, ABORTED).slice(0, 4))
    })
  }
}

// ======== Part E: Skip the instant the guide opens a dialog (ownership must already be claimed) ========
if (wantPart('E')) {
  const cases = [
    { id: '4.50', name: 'H07 (history source drawer)', module: 'history', step: 'H07', done: ['H01', 'H02', 'H03', 'H04', 'H05', 'H06'], dialog: 'dialog.source-drawer' },
    { id: '4.51', name: 'V10 (vietnam source drawer)', module: 'vietnam', step: 'V10', done: ['V01', 'V02', 'V03', 'V04', 'V05', 'V06', 'V07', 'V08', 'V09'], dialog: 'dialog.source-drawer' },
  ]
  for (const entry of cases) {
    const { browser, page, errors } = await openPage({ storage: { [KEY]: seedProgress({ status: 'in-progress', route: entry.module, moduleId: entry.module, stepId: entry.step, completedStepIds: entry.done, lastExit: 'close' }) } })
    await guarded(report, browser, async () => {
      await armWatch(page)
      await page.evaluate((selector) => {
        window.__qaOpenHit = null
        const obs = new MutationObserver(() => {
          const dialog = document.querySelector(`${selector}[open]`)
          if (!dialog || window.__qaOpenHit) return
          obs.disconnect()
          window.__qaOpenHit = { t: Math.round(performance.now()), cueInside: !!dialog.querySelector('.mach-guide-cue') }
          document.querySelector('.mach-guide-cue [data-action="skip-guide"]')?.click()
        })
        obs.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'], childList: true })
      }, entry.dialog)
      await resumeFromMenuNoWait(page)
      await waitFor(page, () => !!window.__qaOpenHit, null, 120000)
      const hit = await page.evaluate(() => window.__qaOpenHit)
      await waitGone(page)
      // Give Driver / React / the guide time to settle, then look at what is left.
      await noRevival(page, entry.id, entry.name, hit.t + 2, 5000)
      const s = await probe(page)
      report.check(`${entry.id}.dialog-closed`, `${entry.name}: Skip pressed the moment the guide opened its dialog still closes that dialog`, s.openDialogs.length === 0 && !s.body.includes('drawer-open') && !s.body.includes('guide-scroll-locked'), { hit, dialogs: s.openDialogs, body: s.body })
      report.check(`${entry.id}.progress`, `${entry.name}: skipped, nothing completed beyond the earlier steps`, s.progress?.status === 'skipped' && s.progress.lastExit === 'skip-guide' && JSON.stringify(s.progress.completedStepIds) === JSON.stringify(entry.done), { status: s.progress?.status, done: s.progress?.completedStepIds })
      report.check(`${entry.id}.focus`, `${entry.name}: focus on the owl`, s.focus.includes('mach-guide-dock__button'), s.focus)
      await report.shot(page, `${entry.id}-after`)
      report.check(`${entry.id}.console-clean`, 'no console errors / page errors', unexpectedErrors(errors, ABORTED).length === 0, unexpectedErrors(errors, ABORTED).slice(0, 4))
    })
  }
}

async function resumeFromMenuNoWait(page) {
  await dismissNotice(page)
  await page.evaluate(() => { if (!document.querySelector('.mach-guide-menu')) document.querySelector('.mach-guide-dock__button')?.click() })
  await page.waitForSelector('.mach-guide-menu', { timeout: 30000 })
  await clickMenu(page, 'Tiếp tục bước dang dở')
}

report.done()
