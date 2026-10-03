// Scenario 5 — failure modes: blocked / slow guide chunk, blocked owl art, hidden tab freeze, missing target, pagehide.
// Run one case with --case A|B|C|D|E|F.
import { openPage, createReport, probe, progressOf, waitFor, waitSettled, primary, wait, guarded, unexpectedErrors, openMenu, clickMenu, seedProgress, KEY, unlockIntro, sleepFrames } from './lib.mjs'

const report = createReport('05-failure-modes')
const ABORTED = [/ERR_ABORTED/]
const caseArg = process.argv.includes('--case') ? process.argv[process.argv.indexOf('--case') + 1] : null
const wantCase = (name) => !caseArg || caseArg === name
const dismissed = { storage: { [KEY]: seedProgress({ status: 'dismissed' }) } }
const NOTICE = ['skipped', 'paused', 'module-skipped', 'module-complete', 'route-complete', 'game-skipped', 'game-failed']

// Request router: rules decide per URL whether to abort, hold until released, or pass.
async function route(page, rules) {
  const state = { hits: rules.map(() => 0), release: null }
  const gate = new Promise((resolve) => { state.release = resolve })
  await page.setRequestInterception(true)
  page.on('request', (request) => {
    if (request.isInterceptResolutionHandled()) return
    const index = rules.findIndex((rule) => rule.match.test(request.url()))
    if (index < 0) { request.continue().catch(() => {}); return }
    state.hits[index] += 1
    if (rules[index].action === 'abort') request.abort('failed').catch(() => {})
    else gate.then(() => request.continue().catch(() => {}))
  })
  return state
}

const startModule = async (page, title) => {
  await page.evaluate(() => { if (!document.querySelector('.mach-guide-menu')) document.querySelector('.mach-guide-dock__button')?.click() })
  await page.waitForSelector('.mach-guide-menu', { timeout: 30000 })
  await clickMenu(page, title)
}
const waitGone = (page) => waitFor(page, (notices) => !document.querySelector('.driver-popover') && !document.querySelector('.driver-overlay') && !Array.from(document.querySelectorAll('.mach-guide-cue')).some((cue) => !notices.includes(cue.dataset.kind)), NOTICE, 30000)
const kinds = (page) => page.evaluate(() => window.__qaKinds ?? [])
const watchKinds = (page) => page.evaluate(() => {
  window.__qaKinds = []
  new MutationObserver(() => {
    const kind = document.querySelector('.mach-guide-cue')?.dataset.kind
    const last = window.__qaKinds[window.__qaKinds.length - 1]
    if (kind && kind !== last) window.__qaKinds.push(kind)
  }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-kind'] })
})

// ---- A: Driver chunk blocked ------------------------------------------------------------------------------------
if (wantCase('A')) {
  let hits
  const { browser, page, errors } = await openPage({ ...dismissed, before: async (p) => { hits = await route(p, [{ match: /guideDriver|driver__js|driver\.js\/dist|\/driver\.css/, action: 'abort' }]) } })
  await guarded(report, browser, async () => {
    await unlockIntro(page)
    await startModule(page, 'Công cụ, máy móc')
    await waitFor(page, () => document.querySelector('.mach-guide-cue')?.dataset.kind === 'driver-failed', null, 120000)
    let s = await probe(page)
    const text = await page.evaluate(() => ({ title: document.querySelector('.mach-guide-cue__title')?.textContent, body: document.querySelector('.mach-guide-cue__text')?.textContent?.slice(0, 80), actions: Array.from(document.querySelectorAll('.mach-guide-cue button')).map((b) => `${b.dataset.action}${b.disabled ? '(disabled)' : ''}`) }))
    report.check('5.A1.fallback-cue', 'chunk blocked: the written fallback shows the step title + text with Next and Skip guide (no Driver)', s.cueKind === 'driver-failed' && s.popovers === 0 && text.title && text.body && text.actions.includes('next') && text.actions.includes('skip-guide') && (hits.hits[0] ?? 0) > 0, { cue: s.cueKind, text, blockedRequests: hits.hits[0] })
    await report.shot(page, '5.A1-fallback')
    // Next / Back / Next through the fallback.
    await primary(page)
    await waitFor(page, () => { try { return JSON.parse(localStorage.getItem('mach-vuon-minh:guide:v2')).stepId === 'T02' } catch { return false } }, null, 120000)
    await waitFor(page, () => document.querySelector('.mach-guide-cue')?.dataset.kind === 'driver-failed', null, 120000)
    s = await probe(page)
    const hasBack = await page.evaluate(() => !!document.querySelector('.mach-guide-cue [data-action="back"]'))
    report.check('5.A2.next', 'Next works in the fallback (T01 → T02, T01 completed, still one cue, no popover)', s.progress?.stepId === 'T02' && s.progress.completedStepIds.includes('T01') && s.cues === 1 && s.popovers === 0 && hasBack, { step: s.progress?.stepId, hasBack, cues: s.cues })
    await page.evaluate(() => document.querySelector('.mach-guide-cue [data-action="back"]').click())
    await waitFor(page, () => { try { return JSON.parse(localStorage.getItem('mach-vuon-minh:guide:v2')).stepId === 'T01' } catch { return false } }, null, 120000)
    await waitFor(page, () => document.querySelector('.mach-guide-cue')?.dataset.kind === 'driver-failed', null, 120000)
    s = await probe(page)
    report.check('5.A3.back', 'Back works in the fallback (T02 → T01)', s.progress?.stepId === 'T01' && s.cues === 1 && s.popovers === 0, { step: s.progress?.stepId, cues: s.cues })
    // Practice steps need no Driver at all.
    await primary(page)
    await waitFor(page, () => { try { return JSON.parse(localStorage.getItem('mach-vuon-minh:guide:v2')).stepId === 'T02' } catch { return false } }, null, 120000)
    await waitFor(page, () => document.querySelector('.mach-guide-cue')?.dataset.kind === 'driver-failed', null, 120000)
    await primary(page)
    await waitFor(page, () => document.querySelector('.mach-guide-cue')?.dataset.kind === 'practice', null, 120000)
    s = await probe(page)
    report.check('5.A4.practice-without-driver', 'the practice step T03 still runs (cue) when Driver cannot load', s.progress?.stepId === 'T03' && s.cueKind === 'practice', { step: s.progress?.stepId, cue: s.cueKind })
    const scrollBefore = s.scrollY
    await page.evaluate(() => document.querySelector('.mach-guide-cue [data-action="skip-guide"]').click())
    await waitGone(page)
    s = await probe(page)
    report.check('5.A5.skip', 'Skip guide works in the fallback: skipped, lock released, focus on the owl, scroll unchanged', s.progress?.status === 'skipped' && !s.body.includes('guide-scroll-locked') && s.focus.includes('mach-guide-dock__button') && Math.abs(s.scrollY - scrollBefore) <= 1 && s.popovers === 0 && s.overlays === 0, { status: s.progress?.status, body: s.body, focus: s.focus, scroll: [scrollBefore, s.scrollY] })
    const allow = [/ERR_ABORTED/, /ERR_FAILED/, /Failed to load resource/, /guideDriver|driver__js|driver\.js|driver\.css/, /\[guide\] driver-load/, /Failed to fetch dynamically imported module/]
    const unexpected = unexpectedErrors(errors, allow)
    report.check('5.A6.console', 'only the expected blocked-request / reported driver-load errors appear (nothing else, no uncaught exception)', unexpected.length === 0 && !errors.some((message) => message.startsWith('pageerror')), { unexpected: unexpected.slice(0, 4), expectedSeen: errors.length })
  })
}

// ---- B: owl art blocked --------------------------------------------------------------------------------------------
if (wantCase('B')) {
  let hits
  const { browser, page, errors } = await openPage({ before: async (p) => { hits = await route(p, [{ match: /\/guide\/owl-[a-z-]+\.webp/, action: 'abort' }]) } })
  await guarded(report, browser, async () => {
    await page.waitForSelector('.mach-guide-welcome', { timeout: 120000 })
    let s = await probe(page)
    const welcome = await page.evaluate(() => ({ buttons: Array.from(document.querySelectorAll('.mach-guide-welcome button')).map((b) => ({ a: b.dataset.action, vis: b.checkVisibility(), w: Math.round(b.getBoundingClientRect().width) })), failedFlag: document.querySelector('.mach-guide-root')?.dataset.owlFailed ?? null, text: document.querySelector('.mach-guide-welcome')?.textContent.replace(/\s+/g, ' ').slice(0, 80) }))
    await waitFor(page, () => document.querySelector('.mach-guide-root')?.dataset.owlFailed !== undefined, null, 30000).catch(() => {})
    report.check('5.B1.welcome-usable', 'owl art blocked: the welcome still shows its text and all four buttons, usable', welcome.buttons.length === 4 && welcome.buttons.every((b) => b.vis && b.w > 40) && (hits.hits[0] ?? 0) > 0, { welcome, blocked: hits.hits[0] })
    await report.shot(page, '5.B1-welcome-no-art')
    await page.click('.mach-guide-welcome [data-action="quick"]')
    await waitSettled(page)
    await page.focus('.thread-handle')
    await page.keyboard.press('Enter')
    await waitFor(page, () => !!document.querySelector('.mach-guide-cue__hint[data-signaled]'), null, 120000)
    await primary(page)
    await waitFor(page, () => !!document.querySelector('.driver-popover'), null, 120000)
    s = await probe(page)
    const popoverText = await page.evaluate(() => ({ title: document.querySelector('.driver-popover-title')?.textContent, next: document.querySelector('.driver-popover-next-btn')?.textContent, skip: document.querySelector('.driver-popover .mach-guide__btn--skip')?.textContent }))
    report.check('5.B2.driver-step-usable', 'the Driver popover (I03) shows text, Next and Bỏ qua hướng dẫn without the owl art', !!popoverText.title && !!popoverText.next && popoverText.skip === 'Bỏ qua hướng dẫn', popoverText)
    await report.shot(page, '5.B2-popover-no-art')
    await page.evaluate(() => document.querySelector('.driver-popover .mach-guide__btn--skip').click())
    await waitGone(page)
    s = await probe(page)
    report.check('5.B4.skip', 'Skip guide still works without art', s.progress?.status === 'skipped' && s.popovers === 0 && !s.body.includes('guide-scroll-locked'), { status: s.progress?.status, body: s.body })
    const dock = await page.evaluate(() => { const b = document.querySelector('.mach-guide-dock__button'); if (!b) return null; const r = b.getBoundingClientRect(); const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return { w: Math.round(r.width), h: Math.round(r.height), hit: top === b || b.contains(top), label: b.getAttribute('aria-label') } })
    report.check('5.B3.dock-usable', 'the owl dock button keeps a usable hit area and its accessible name', dock && dock.w >= 40 && dock.h >= 40 && dock.hit && dock.label === 'Mở hướng dẫn của Cú Mạch', dock)
    const allow = [/ERR_ABORTED/, /ERR_FAILED/, /Failed to load resource/, /owl-[a-z-]+\.webp/]
    const unexpected = unexpectedErrors(errors, allow)
    report.check('5.B5.console', 'only the blocked image requests are reported (no other error)', unexpected.length === 0, { unexpected: unexpected.slice(0, 4), seen: errors.length })
  })
}

// ---- C/D: hidden tab freeze, missing target ---------------------------------------------------------------------------
const hideTarget = (page, name) => page.addStyleTag({ content: `[data-guide~="${name}"]{visibility:hidden!important}` }).then((handle) => handle)
const holdVisibility = (page) => page.evaluateOnNewDocument(() => {
  window.__qaHidden = false
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => window.__qaHidden })
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (window.__qaHidden ? 'hidden' : 'visible') })
})
const setHidden = (page, hidden) => page.evaluate((value) => { window.__qaHidden = value; document.dispatchEvent(new Event('visibilitychange')) }, hidden)

if (wantCase('C')) {
  const { browser, page, errors } = await openPage({ ...dismissed, timeoutScale: 1, before: holdVisibility })
  await guarded(report, browser, async () => {
    await unlockIntro(page)
    await watchKinds(page)
    const style = await hideTarget(page, 'lab-core')
    await startModule(page, 'Phòng biện chứng')
    await waitFor(page, () => document.querySelector('.mach-guide-cue')?.dataset.kind === 'preparing', null, 60000)
    await setHidden(page, true)
    const t0 = Date.now()
    let sawMissing = false
    while (Date.now() - t0 < 22000) {
      await wait(1000)
      const now = await probe(page)
      if (now.cueKind === 'missing-target') { sawMissing = true; break }
    }
    let s = await probe(page)
    report.check('5.C1.frozen-while-hidden', 'hidden tab (22 s wall clock, longer than every 5 s/6 s deadline): the target wait does not time out; still preparing', !sawMissing && s.cueKind === 'preparing', { sawMissing, cue: s.cueKind, kinds: await kinds(page) })
    await style.evaluate((node) => node.remove())
    await setHidden(page, false)
    await waitFor(page, () => !!document.querySelector('.driver-popover'), null, 90000)
    s = await probe(page)
    const seen = await kinds(page)
    report.check('5.C2.continues-when-visible', 'when the tab is visible again and the target shows, the wait continues and the step opens (L01 popover), never showing missing-target', s.progress?.stepId === 'L01' && s.popovers === 1 && !seen.includes('missing-target'), { step: s.progress?.stepId, popovers: s.popovers, kinds: seen })
    await report.shot(page, '5.C2-continued')
    report.check('5.C3.console-clean', 'no console errors / page errors', unexpectedErrors(errors, ABORTED).length === 0, unexpectedErrors(errors, ABORTED).slice(0, 4))
  })
}

if (wantCase('D')) {
  const { browser, page, errors } = await openPage({ ...dismissed, timeoutScale: 1 })
  await guarded(report, browser, async () => {
    await unlockIntro(page)
    await watchKinds(page)
    const style = await hideTarget(page, 'lab-core')
    await startModule(page, 'Phòng biện chứng')
    await waitFor(page, () => document.querySelector('.mach-guide-cue')?.dataset.kind === 'missing-target', null, 120000)
    let s = await probe(page)
    const actions = await page.evaluate(() => Array.from(document.querySelectorAll('.mach-guide-cue button')).map((b) => `${b.dataset.action}:${b.textContent.trim()}`))
    report.check('5.D1.missing-target-notice', 'control (visible tab): a target that never appears gives Thử lại / Bỏ qua bước này / Đọc hướng dẫn bằng chữ plus Bỏ qua hướng dẫn, not an endless spinner', ['retry:Thử lại', 'skip-step:Bỏ qua bước này', 'read-text:Đọc hướng dẫn bằng chữ', 'skip-guide:Bỏ qua hướng dẫn'].every((a) => actions.includes(a)), actions)
    await report.shot(page, '5.D1-missing-target')
    // Thử lại while still hidden -> preparing again -> fails again.
    await page.evaluate(() => document.querySelector('.mach-guide-cue [data-action="retry"]').click())
    await waitFor(page, () => document.querySelector('.mach-guide-cue')?.dataset.kind === 'missing-target', null, 120000)
    s = await probe(page)
    report.check('5.D2.retry-still-missing', 'Thử lại with the target still missing returns to the notice (no stuck spinner)', s.cueKind === 'missing-target' && s.progress?.stepId === 'L01' && s.popovers === 0, { cue: s.cueKind, step: s.progress?.stepId })
    // Đọc hướng dẫn bằng chữ -> written step with Next and Skip.
    await page.evaluate(() => document.querySelector('.mach-guide-cue [data-action="read-text"]').click())
    await waitFor(page, () => !!document.querySelector('.mach-guide-cue [data-action="next"]'), null, 30000)
    s = await probe(page)
    const read = await page.evaluate(() => ({ title: document.querySelector('.mach-guide-cue__title')?.textContent, text: document.querySelector('.mach-guide-cue__text')?.textContent?.slice(0, 60), skip: !!document.querySelector('.mach-guide-cue [data-action="skip-guide"]') }))
    report.check('5.D3.read-as-text', 'Đọc hướng dẫn bằng chữ shows the step text with Next and Skip guide', !!read.title && !!read.text && read.skip && s.popovers === 0, read)
    // Reveal the target and retry through the menu (resume) -> popover.
    await style.evaluate((node) => node.remove())
    await page.evaluate(() => document.querySelector('.mach-guide-cue [data-action="skip-guide"]').click())
    await waitGone(page)
    await startModule(page, 'Tiếp tục bước dang dở')
    await waitFor(page, () => !!document.querySelector('.driver-popover'), null, 120000)
    s = await probe(page)
    report.check('5.D4.recovers', 'once the target exists a fresh start opens the exact step', s.progress?.stepId === 'L01' && s.popovers === 1, { step: s.progress?.stepId, popovers: s.popovers })
    report.check('5.D5.console-clean', 'no console errors / page errors', unexpectedErrors(errors, ABORTED).length === 0, unexpectedErrors(errors, ABORTED).slice(0, 4))
  })
}

// ---- E: pagehide mid-step -------------------------------------------------------------------------------------------
if (wantCase('E')) {
  const { browser, page, errors } = await openPage(dismissed)
  await guarded(report, browser, async () => {
    await unlockIntro(page)
    await startModule(page, 'Phòng biện chứng')
    await waitFor(page, () => !!document.querySelector('.driver-popover'), null, 120000)
    await page.evaluate(() => document.querySelector('.driver-popover-next-btn').click())
    await waitFor(page, () => document.querySelector('.mach-guide-cue')?.dataset.kind === 'practice', null, 120000)
    const before = await probe(page)
    const sync = await page.evaluate(() => {
      window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }))
      const stored = JSON.parse(localStorage.getItem('mach-vuon-minh:guide:v2'))
      return { popovers: document.querySelectorAll('.driver-popover').length, overlays: document.querySelectorAll('.driver-overlay').length, locked: document.body.classList.contains('guide-scroll-locked'), stored }
    })
    report.check('5.E1.pagehide-sync', 'pagehide synchronously: layers gone, scroll lease released, step stays in-progress (close), nothing skipped or completed beyond the finished steps', !sync.locked && sync.popovers === 0 && sync.overlays === 0 && sync.stored.status === 'in-progress' && sync.stored.stepId === 'L02' && sync.stored.lastExit === 'close' && sync.stored.skippedStepIds.length === 0 && JSON.stringify(sync.stored.completedStepIds) === JSON.stringify(['L01']), { sync, step: before.progress?.stepId })
    // A page restored from the back/forward cache must not show a half-dead guide: the owl offers to continue.
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })))
    await sleepFrames(page, 1)
    const after = await probe(page)
    await page.evaluate(() => { if (!document.querySelector('.mach-guide-menu')) document.querySelector('.mach-guide-dock__button')?.click() })
    await page.waitForSelector('.mach-guide-menu', { timeout: 30000 })
    const items = await page.evaluate(() => Array.from(document.querySelectorAll('.mach-guide-menu button')).map((b) => b.textContent.trim().slice(0, 40)))
    report.check('5.E2.bfcache-ui-coherent', 'after pagehide + pageshow(persisted) there is no stale step cue and the owl menu offers "Tiếp tục bước dang dở"', after.cues === 0 && items.some((text) => text.startsWith('Tiếp tục bước dang dở')), { cues: after.cues, cueKind: after.cueKind, items })
    await report.shot(page, '5.E2-after-pageshow')
    await page.evaluate(() => document.querySelector('.mach-guide-menu')?.querySelector('button')?.blur())
    // Real reload: the id survives.
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.mach-guide-dock__button', { timeout: 120000 })
    const saved = await progressOf(page)
    report.check('5.E3.reload-keeps-id', 'after a real reload the stored progress is still in-progress at the same id, no skipped, completed only L01', saved?.status === 'in-progress' && saved.stepId === 'L02' && saved.skippedStepIds.length === 0 && JSON.stringify(saved.completedStepIds) === JSON.stringify(['L01']), { saved: [saved?.status, saved?.stepId, saved?.lastExit, saved?.skippedStepIds, saved?.completedStepIds] })
    report.check('5.E4.console-clean', 'no console errors / page errors', unexpectedErrors(errors, ABORTED).length === 0, unexpectedErrors(errors, ABORTED).slice(0, 4))
  })
}

// ---- F: slow guide chunk, Skip while it loads ---------------------------------------------------------------------
if (wantCase('F')) {
  let gate
  const { browser, page, errors } = await openPage({ ...dismissed, before: async (p) => { gate = await route(p, [{ match: /guideDriver|driver__js|driver\.css/, action: 'hold' }]) } })
  await guarded(report, browser, async () => {
    await unlockIntro(page)
    await startModule(page, 'Công cụ, máy móc')
    await waitFor(page, () => document.querySelector('.mach-guide-cue')?.dataset.kind === 'preparing', null, 60000)
    await wait(1500)
    const held = await probe(page)
    report.check('5.F1.slow-load', 'slow chunk: the guide waits with the preparing cue (Bỏ qua hướng dẫn visible), the intro/page stays usable', held.cueKind === 'preparing' && held.popovers === 0 && (gate.hits[0] ?? 0) > 0, { cue: held.cueKind, requests: gate.hits[0] })
    await report.shot(page, '5.F1-slow-load')
    const t0 = await page.evaluate(() => Math.round(performance.now()))
    await page.evaluate(() => document.querySelector('.mach-guide-cue [data-action="skip-guide"]').click())
    await waitGone(page)
    gate.release()
    await waitFor(page, (t) => performance.now() > t + 12000, t0, 60000)
    const s = await probe(page)
    report.check('5.F2.late-chunk-never-revives', 'Skip during the slow load, then the chunk arrives: no popover, no overlay, no cue, still skipped, lock released', s.popovers === 0 && s.overlays === 0 && s.progress?.status === 'skipped' && !s.body.includes('guide-scroll-locked') && s.cueKind !== 'driver-failed', { popovers: s.popovers, overlays: s.overlays, status: s.progress?.status, cue: s.cueKind, body: s.body })
    report.check('5.F3.console-clean', 'no console errors / page errors', unexpectedErrors(errors, ABORTED).length === 0, unexpectedErrors(errors, ABORTED).slice(0, 4))
  })
}

// ---- G: hung guide chunk (never answers): the written fallback must appear after the deadline -----------------------
if (wantCase('G')) {
  let gate
  const { browser, page, errors } = await openPage({ ...dismissed, timeoutScale: 1, before: async (p) => { gate = await route(p, [{ match: /guideDriver|driver__js|driver\.css/, action: 'hold' }]) } })
  await guarded(report, browser, async () => {
    await unlockIntro(page)
    await startModule(page, 'Công cụ, máy móc')
    await waitFor(page, () => document.querySelector('.mach-guide-cue')?.dataset.kind === 'preparing', null, 60000)
    const t0 = Date.now()
    await waitFor(page, () => document.querySelector('.mach-guide-cue')?.dataset.kind === 'driver-failed', null, 60000)
    const waited = Date.now() - t0
    let s = await probe(page)
    const actions = await page.evaluate(() => Array.from(document.querySelectorAll('.mach-guide-cue button')).map((b) => b.dataset.action))
    report.check('5.G1.deadline-fallback', 'a chunk that never answers: after the deadline the written fallback (text + Next + Skip) replaces "preparing"; no endless wait', s.cueKind === 'driver-failed' && actions.includes('next') && actions.includes('skip-guide') && s.popovers === 0 && waited < 25000, { waitedMs: waited, cue: s.cueKind, actions })
    await report.shot(page, '5.G1-deadline-fallback')
    // The chunk finally arrives: the very next step uses Driver again.
    gate.release()
    await wait(1500)
    await primary(page)
    await waitFor(page, () => !!document.querySelector('.driver-popover'), null, 120000)
    s = await probe(page)
    report.check('5.G2.recovers-when-chunk-arrives', 'when the held chunk arrives, the next step opens as a normal Driver popover', s.progress?.stepId === 'T02' && s.popovers === 1, { step: s.progress?.stepId, popovers: s.popovers })
    await page.evaluate(() => document.querySelector('.driver-popover .mach-guide__btn--skip').click())
    await waitGone(page)
    const end = await probe(page)
    report.check('5.G3.clean-exit', 'Skip guide afterwards leaves no overlay/popover/lock', end.popovers === 0 && end.overlays === 0 && !end.body.includes('guide-scroll-locked') && end.progress?.status === 'skipped', { popovers: end.popovers, overlays: end.overlays, body: end.body, status: end.progress?.status })
    const allow = [/ERR_ABORTED/, /\[guide\] driver-load/]
    report.check('5.G4.console', 'only the reported driver-load timeout is logged', unexpectedErrors(errors, allow).length === 0, unexpectedErrors(errors, allow).slice(0, 4))
  })
}

void unlockIntro
report.done()
