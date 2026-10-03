// Scenario 1 — first visit with clean storage: one greeting, no timer-driven tour, dismissed persistence, quick route.
import { openPage, createReport, probe, progressOf, waitFor, waitSettled, primary, wait, KEY, guarded, unexpectedErrors, openMenu, menuTexts, clickMenu, listenerCounts } from './lib.mjs'

const report = createReport('01-first-visit')
const ABORTED = [/ERR_ABORTED/]

// Records the moment the welcome node is inserted: font + intro readiness at that instant, and how many times it was inserted.
const instrumentWelcome = (page) => page.evaluateOnNewDocument(() => {
  window.__qaWelcomeInserts = 0
  window.__qaWelcome = null
  const visible = (element) => !!element && element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
  new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType !== 1) continue
        if (node.matches?.('.mach-guide-welcome') || node.querySelector?.('.mach-guide-welcome')) {
          window.__qaWelcomeInserts += 1
          if (!window.__qaWelcome) {
            const handle = document.querySelector('[data-guide~="intro-thread"]')
            window.__qaWelcome = { t: Math.round(performance.now()), fonts: document.fonts.status, handleVisible: visible(handle), unlocked: document.querySelector('.experience')?.classList.contains('unlocked') ?? null }
          }
        }
      }
    }
  }).observe(document, { childList: true, subtree: true })
})

const welcomeFacts = (page) => page.evaluate(() => {
  const root = document.querySelector('.mach-guide-welcome')
  if (!root) return null
  const buttons = Array.from(root.querySelectorAll('button')).map((button) => {
    const box = button.getBoundingClientRect()
    return { action: button.dataset.action, text: button.textContent.trim(), disabled: button.disabled, inViewport: box.left >= 0 && box.top >= 0 && box.right <= innerWidth && box.bottom <= innerHeight, w: Math.round(box.width), h: Math.round(box.height) }
  })
  return { buttons, role: root.getAttribute('role'), labelled: root.getAttribute('aria-labelledby'), text: root.textContent.replace(/\s+/g, ' ').trim().slice(0, 240) }
})

async function freshSession(tag, body) {
  const { browser, page, errors } = await openPage({ before: instrumentWelcome })
  await guarded(report, browser, async () => { await body(page, errors) })
}

async function waitWelcome(page) {
  await page.waitForSelector('.mach-guide-welcome', { timeout: 120000 })
}

async function assertNoWelcomeAfterReload(page, id) {
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.thread-handle', { timeout: 120000 })
  await page.evaluate(() => document.fonts.ready)
  // Readiness has a 5 s overall deadline; wait past it on the wall clock, then assert nothing greeted the user.
  await waitFor(page, () => performance.now() > 9000, null, 60000)
  const after = await probe(page)
  const inserts = await page.evaluate(() => window.__qaWelcomeInserts)
  report.check(`${id}.no-greeting`, 'after reload there is no welcome (never greets twice)', after.welcome === 0 && inserts === 0, { welcome: after.welcome, inserts, progress: after.progress?.status })
  report.check(`${id}.dock`, 'the owl button is still on screen after reload', after.dock === 1, { dock: after.dock })
  return after
}

// ---- A: Tự khám phá -------------------------------------------------------------------------------------------
await freshSession('explore', async (page, errors) => {
  const started = Date.now()
  await waitWelcome(page)
  const shownAfterMs = Date.now() - started
  const at = await page.evaluate(() => window.__qaWelcome)
  report.check('1.1.ready-gate', 'welcome appears only after fonts are loaded and the intro thread is visible (state captured on insertion)', at && at.fonts === 'loaded' && at.handleVisible === true && at.unlocked === false, { ...at, shownAfterMs })
  const facts = await welcomeFacts(page)
  const labels = facts.buttons.map((button) => button.text)
  report.check('1.2.choices', 'welcome offers the three journeys plus the text button Bỏ qua hướng dẫn', ['Dẫn tôi khám phá', 'Hướng dẫn nhanh', 'Tự khám phá', 'Bỏ qua hướng dẫn'].every((label) => labels.includes(label)), labels)
  report.check('1.3.buttons-usable', 'every welcome button is enabled and inside the viewport', facts.buttons.every((button) => !button.disabled && button.inViewport && button.h >= 32), facts.buttons.map((button) => `${button.action}:${button.w}x${button.h}`))
  await report.shot(page, 'welcome')
  // No timer may start the tour: observe a window longer than any plausible auto-start delay.
  const t0 = Date.now()
  let leaked = null
  while (Date.now() - t0 < 14000) {
    const now = await probe(page)
    if (now.popovers || now.overlays || (now.progress && now.progress.status === 'in-progress')) { leaked = now; break }
    await wait(1000)
  }
  const idle = await probe(page)
  report.check('1.4.no-timer-start', 'no timer starts the tour while the welcome waits (14 s observed)', !leaked && idle.welcome === 1 && idle.popovers === 0 && idle.overlays === 0, { leaked: !!leaked, welcome: idle.welcome, progress: idle.progress?.status ?? 'none' })
  await page.click('.mach-guide-welcome [data-action="explore"]')
  await waitFor(page, () => !document.querySelector('.mach-guide-welcome'), null, 20000)
  const saved = await progressOf(page)
  const mid = await probe(page)
  report.check('1.5.explore-persists-dismissed', 'Tự khám phá persists status dismissed, no tour, no overlay', saved?.status === 'dismissed' && saved.stepId === null && !mid.popovers && !mid.overlays && !/guide-scroll-locked/.test(mid.body), { status: saved?.status, step: saved?.stepId, body: mid.body })
  const after = await assertNoWelcomeAfterReload(page, '1.6')
  report.check('1.6.status-kept', 'dismissed survives the reload', after.progress?.status === 'dismissed', after.progress?.status)
  await openMenu(page)
  const items = await menuTexts(page)
  const modules = await page.$$eval('.mach-guide-menu__modules button', (buttons) => buttons.length)
  report.check('1.7.owl-menu', 'after reload the owl button opens the menu (replay entries, 8 modules, hide)', items.some((text) => text.startsWith('Hướng dẫn phần đang xem')) && items.some((text) => text.startsWith('Xem lại từ đầu')) && modules === 8 && items.some((text) => text.startsWith('Ẩn cú trong phiên này')) && !items.some((text) => text.startsWith('Bắt đầu hướng dẫn')), { modules, items: items.map((text) => text.slice(0, 40)) })
  await report.shot(page, 'owl-menu-after-dismiss')
  await clickMenu(page, 'Xem lại từ đầu')
  await waitSettled(page)
  const running = await probe(page)
  report.check('1.8.owl-starts-tour', 'the owl menu starts the guide after dismissal (first real step I02)', running.progress?.stepId === 'I02' && running.progress?.status === 'in-progress', { step: running.progress?.stepId, title: running.title, cue: running.cueKind })
  report.check('1.9.console-clean', 'no console errors / page errors (aborted navigations excluded)', unexpectedErrors(errors, ABORTED).length === 0, unexpectedErrors(errors, ABORTED).slice(0, 4))
})

// ---- B: Bỏ qua hướng dẫn at the welcome ---------------------------------------------------------------------
await freshSession('skip', async (page, errors) => {
  await waitWelcome(page)
  const skip = await page.$('.mach-guide-welcome [data-action="skip-guide"]')
  const text = await skip.evaluate((button) => button.textContent.trim())
  report.check('1.10.skip-text-button', 'the welcome has a visible text button Bỏ qua hướng dẫn', text === 'Bỏ qua hướng dẫn', text)
  await skip.click()
  await waitFor(page, () => !document.querySelector('.mach-guide-welcome'), null, 20000)
  const saved = await progressOf(page)
  const mid = await probe(page)
  report.check('1.11.skip-persists-dismissed', 'Bỏ qua hướng dẫn at the welcome persists status dismissed (not skipped, nothing completed)', saved?.status === 'dismissed' && saved.completedStepIds.length === 0 && saved.lastExit === null && !mid.popovers && !mid.overlays, { status: saved?.status, lastExit: saved?.lastExit, done: saved?.completedStepIds })
  const after = await assertNoWelcomeAfterReload(page, '1.12')
  await openMenu(page)
  const ok = (await menuTexts(page)).length > 5
  report.check('1.13.owl-after-skip', 'the owl menu opens after Bỏ qua + reload', ok && after.progress?.status === 'dismissed', after.progress?.status)
  report.check('1.14.console-clean', 'no console errors / page errors', unexpectedErrors(errors, ABORTED).length === 0, unexpectedErrors(errors, ABORTED).slice(0, 4))
})

// ---- C: Hướng dẫn nhanh — only the six intro steps ---------------------------------------------------------
await freshSession('quick', async (page, errors) => {
  await waitWelcome(page)
  await page.click('.mach-guide-welcome [data-action="quick"]')
  const visited = []
  const seen = new Set()
  let ended = null
  for (let n = 0; n < 12 && !ended; n += 1) {
    await waitSettled(page)
    const now = await probe(page)
    const id = now.progress?.stepId
    if (now.cueKind === 'route-complete') { ended = now; break }
    if (id && !seen.has(id)) { seen.add(id); visited.push(id); await report.shot(page, `quick-${id}`) }
    if (id === 'I02') {
      // The practice step completes by really unlocking the intro (keyboard path of the thread handle).
      await page.focus('.thread-handle')
      await page.keyboard.press('Enter')
      await waitFor(page, () => !!document.querySelector('.mach-guide-cue__hint[data-signaled]'), null, 120000)
    }
    const before = id
    const clicked = await primary(page)
    if (!clicked) { report.check('1.15.quick-button', `step ${id} had a forward control`, false, now); break }
    await waitFor(page, (was) => {
      const state = (() => { try { return JSON.parse(localStorage.getItem('mach-vuon-minh:guide:v2')) } catch { return null } })()
      const kind = document.querySelector('.mach-guide-cue')?.dataset.kind
      return state?.stepId !== was || kind === 'route-complete' || state?.status === 'completed'
    }, before, 120000)
    const check = await probe(page)
    if (check.cueKind === 'route-complete' || check.progress?.status === 'completed') { ended = check; break }
  }
  report.check('1.15.quick-steps', 'Hướng dẫn nhanh visits exactly I02–I06 (I01 is the welcome) and nothing from other modules', JSON.stringify(visited) === JSON.stringify(['I02', 'I03', 'I04', 'I05', 'I06']), visited)
  await waitFor(page, () => document.querySelector('.mach-guide-cue')?.dataset.kind === 'route-complete', null, 30000).catch(() => {})
  const end = await probe(page)
  const text = await page.evaluate(() => document.querySelector('.mach-guide-cue__text')?.textContent ?? '')
  const saved = await progressOf(page)
  const expectedDone = ['I01', 'I02', 'I03', 'I04', 'I05', 'I06']
  report.check('1.16.partial-notice', 'the quick route ends with the partial notice (not the "whole module complete" copy)', end.cueKind === 'route-complete' && text.includes('Mình đã đi hết các phần bạn chọn') && !text.includes('Bạn đã xem xong phần này'), { kind: end.cueKind, text: text.slice(0, 160) })
  report.check('1.17.quick-progress', 'quick progress marks only the intro steps completed; 7 other modules untouched', saved?.status === 'completed' && JSON.stringify(saved.completedStepIds) === JSON.stringify(expectedDone) && JSON.stringify(saved.completedModules) === JSON.stringify(['intro']) && saved.skippedStepIds.length === 0, { status: saved?.status, done: saved?.completedStepIds, modules: saved?.completedModules })
  const offers = await page.evaluate(() => Array.from(document.querySelectorAll('.mach-guide-cue [data-action]')).map((button) => button.dataset.action))
  report.check('1.18.offers-more', 'the partial notice offers to continue with the whole tour', offers.includes('explore-more'), offers)
  report.check('1.19.clean-exit', 'no driver overlay/popover, no scroll lock after the quick route', end.overlays === 0 && end.popovers === 0 && !/guide-scroll-locked/.test(end.body), { overlays: end.overlays, popovers: end.popovers, body: end.body })
  await report.shot(page, 'quick-complete')
  report.check('1.20.console-clean', 'no console errors / page errors', unexpectedErrors(errors, ABORTED).length === 0, unexpectedErrors(errors, ABORTED).slice(0, 4))
  void KEY; void listenerCounts
})

report.done()
