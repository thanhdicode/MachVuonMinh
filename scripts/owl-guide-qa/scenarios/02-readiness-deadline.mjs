// Scenario 2 — readiness deadline: fonts / intro thread late beyond the 5 s overall budget.
import { openPage, createReport, probe, progressOf, waitFor, waitSettled, wait, guarded, unexpectedErrors, openMenu, menuTexts, clickMenu } from './lib.mjs'

const report = createReport('02-readiness-deadline')
const ABORTED = [/ERR_ABORTED/]

// Keeps the intro thread invisible until released from the test (the page exposes __qaRelease).
const holdThread = (page) => page.evaluateOnNewDocument(() => {
  const apply = () => {
    const style = document.createElement('style')
    style.id = 'qa-hide-thread'
    style.textContent = '.thread-handle{visibility:hidden!important}'
    document.documentElement.appendChild(style)
    window.__qaRelease = () => style.remove()
  }
  window.__qaWelcomeInserts = 0
  new MutationObserver((records) => {
    for (const record of records) for (const node of record.addedNodes) if (node.nodeType === 1 && (node.matches?.('.mach-guide-welcome') || node.querySelector?.('.mach-guide-welcome'))) window.__qaWelcomeInserts += 1
  }).observe(document, { childList: true, subtree: true })
  if (document.documentElement) apply()
  else new MutationObserver((_, observer) => { if (document.documentElement) { observer.disconnect(); apply() } }).observe(document, { childList: true })
})

// Holds every font response until released: document.fonts stays 'loading'.
const holdFonts = async (page) => {
  let release
  const gate = new Promise((resolve) => { release = resolve })
  page.__releaseFonts = release
  await page.setRequestInterception(true)
  page.on('request', (request) => {
    if (request.isInterceptResolutionHandled()) return
    if (request.resourceType() === 'font') gate.then(() => request.continue().catch(() => {}))
    else request.continue().catch(() => {})
  })
  await page.evaluateOnNewDocument(() => {
    window.__qaWelcomeInserts = 0
    new MutationObserver((records) => {
      for (const record of records) for (const node of record.addedNodes) if (node.nodeType === 1 && (node.matches?.('.mach-guide-welcome') || node.querySelector?.('.mach-guide-welcome'))) window.__qaWelcomeInserts += 1
    }).observe(document, { childList: true, subtree: true })
  })
}

async function lateWelcomeAbsent(page, id, label) {
  // Wall clock: the guide's budget is 5 s from mount. Wait well past it, then let the late resource arrive, then wait again.
  await waitFor(page, () => performance.now() > 10000, null, 60000)
  const before = await probe(page)
  const insertsBefore = await page.evaluate(() => window.__qaWelcomeInserts)
  report.check(`${id}.deadline-no-welcome`, `${label}: past the 5 s deadline no welcome has been forced`, before.welcome === 0 && insertsBefore === 0, { welcome: before.welcome, inserts: insertsBefore, progress: before.progress?.status ?? 'none' })
  return before
}

async function expectGuideStillWorks(page, id) {
  // The owl is available and offers the manual start; the intro works; the guide opens from the menu.
  await openMenu(page)
  const items = await menuTexts(page)
  report.check(`${id}.menu-start`, 'the owl menu offers "Bắt đầu hướng dẫn"', items.some((text) => text.startsWith('Bắt đầu hướng dẫn')), items.map((text) => text.slice(0, 32)))
  await report.shot(page, `${id}-menu`)
  await clickMenu(page, 'Bắt đầu hướng dẫn')
  await page.waitForSelector('.mach-guide-welcome', { timeout: 30000 })
  const welcome = await probe(page)
  report.check(`${id}.welcome-on-demand`, 'choosing it shows the welcome on demand', welcome.welcome === 1, { welcome: welcome.welcome })
  await page.click('.mach-guide-welcome [data-action="full"]')
  await waitSettled(page)
  const running = await probe(page)
  report.check(`${id}.guide-opens`, 'the guide runs after the late start (I02 practice cue, progress in-progress)', running.progress?.stepId === 'I02' && running.progress?.status === 'in-progress' && running.cueKind === 'practice', { step: running.progress?.stepId, cue: running.cueKind, title: running.title })
  await report.shot(page, `${id}-guide-running`)
  return running
}

// ---- A: intro thread not ready within 5 s -----------------------------------------------------------------------
{
  const { browser, page, errors } = await openPage({ timeoutScale: 1, waitHandle: false, before: holdThread })
  await guarded(report, browser, async () => {
    await page.waitForSelector('.thread-handle', { timeout: 120000 })
    await lateWelcomeAbsent(page, '2.1', 'thread hidden')
    await page.evaluate(() => window.__qaRelease())
    // The thread became ready late: still nothing may pop up on its own.
    await page.waitForFunction(() => { const h = document.querySelector('.thread-handle'); return h && getComputedStyle(h).visibility === 'visible' }, { polling: 200 })
    const t0 = Date.now()
    while (Date.now() - t0 < 8000) { await wait(1000); if ((await probe(page)).welcome) break }
    const late = await probe(page)
    report.check('2.2.late-ready-no-welcome', 'when the thread finally becomes ready (8 s observed) the welcome still does not appear', late.welcome === 0 && late.popovers === 0, { welcome: late.welcome })
    report.check('2.3.intro-still-works', 'the intro still works: the thread handle is interactive before any guide choice', await page.evaluate(() => { const h = document.querySelector('.thread-handle'); return !h.disabled && getComputedStyle(h).pointerEvents !== 'none' }), 'handle enabled + pointer-events')
    await expectGuideStillWorks(page, '2.4')
    // Unlocking the intro through its own control still completes the guide's practice step.
    await page.focus('.thread-handle')
    await page.keyboard.press('Enter')
    await waitFor(page, () => !!document.querySelector('.mach-guide-cue__hint[data-signaled]'), null, 120000)
    const done = await probe(page)
    report.check('2.5.practice-signalled', 'unlocking the intro through the real control signals the practice step', done.cueKind === 'practice', { cue: done.cueKind })
    report.check('2.6.console-clean', 'no console errors / page errors', unexpectedErrors(errors, ABORTED).length === 0, unexpectedErrors(errors, ABORTED).slice(0, 4))
  })
}

// ---- B: fonts not ready within 5 s -----------------------------------------------------------------------------
{
  const { browser, page, errors } = await openPage({ timeoutScale: 1, before: holdFonts })
  await guarded(report, browser, async () => {
    const status = await page.evaluate(() => document.fonts.status)
    const fontsHeld = await page.evaluate(() => Array.from(document.fonts).filter((face) => face.status !== 'loaded').length)
    report.note('2.7.font-state', `fonts held: document.fonts.status=${status}, not-yet-loaded faces=${fontsHeld}`)
    await lateWelcomeAbsent(page, '2.8', 'fonts held')
    page.__releaseFonts()
    await page.evaluate(() => document.fonts.ready)
    const t0 = Date.now()
    while (Date.now() - t0 < 8000) { await wait(1000); if ((await probe(page)).welcome) break }
    const late = await probe(page)
    report.check('2.9.late-fonts-no-welcome', 'when the fonts finally arrive (8 s observed) the welcome still does not appear', late.welcome === 0, { welcome: late.welcome })
    report.check('2.10.intro-interactive', 'the intro stays interactive while fonts were late (handle enabled)', await page.evaluate(() => { const h = document.querySelector('.thread-handle'); return !!h && !h.disabled }), 'handle enabled')
    await expectGuideStillWorks(page, '2.11')
    report.check('2.12.console-clean', 'no console errors / page errors', unexpectedErrors(errors, ABORTED).length === 0, unexpectedErrors(errors, ABORTED).slice(0, 4))
  })
}

report.done()
