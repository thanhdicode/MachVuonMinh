// Scenario 9 — game guide in the iframe: the F04 offer, declining it, Skip/Esc/close inside the game dialog, late readiness.
// Parts (run one with --part A|B|C|D|E): A decline at F04, B child Skip keeps the game open, C Esc order, D close mid-guide,
//   E toolbar Skip before the child is ready, then wait out the handshake window.
import { openPage, createReport, probe, progressOf, waitFor, wait, guarded, unexpectedErrors, openMenu, clickMenu, seedProgress, unlockIntro, KEY } from './lib.mjs'

const part = (() => { const i = process.argv.indexOf('--part'); return i < 0 ? 'all' : process.argv[i + 1] })()
const want = (id) => part === 'all' || part === id
const report = createReport(part === 'all' ? '09-game' : `09-game-${part}`)
const { check, shot } = report
const atF04 = seedProgress({ status: 'in-progress', route: 'full', moduleId: 'finale', stepId: 'F04', completedStepIds: ['F01', 'F02', 'F03'], lastExit: 'close' })
const gameFrame = async (page, timeout = 120000) => { const t0 = Date.now(); while (Date.now() - t0 < timeout) { const f = page.frames().find((frame) => frame !== page.mainFrame() && frame.url() === 'about:srcdoc'); if (f) return f; await wait(400) } return null }
const inFrame = (frame, fn, arg) => frame.evaluate(fn, arg).catch(() => null)
const childTitle = (frame) => inFrame(frame, () => document.querySelector('.mach-title')?.textContent ?? null)
const lockState = (page) => page.evaluate(() => ({ body: document.body.className, dialog: !!document.querySelector('dialog.mini-game-dialog[open]'), focus: document.activeElement?.className?.toString().split(' ')[0] || document.activeElement?.tagName }))
const waitChild = async (frame, expected, ms = 120000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if ((await childTitle(frame)) === expected) return true; await wait(500) } return false }
const allowed = [/ERR_ABORTED/]
const openMini = async (page, startFromMenu) => { await openMenu(page); await clickMenu(page, startFromMenu) }

async function start(options) {
  const session = await openPage({ storage: { [KEY]: seedProgress({ status: 'dismissed' }) }, ...options })
  await unlockIntro(session.page)
  await wait(1500)
  return session
}

const { default: copy } = await import('../../../src/onboarding/guideCopy.json', { with: { type: 'json' } })
const firstGame = copy.steps.find((step) => step.id === 'G01')

if (want('A')) {
  const { browser, page, errors } = await start({ storage: { [KEY]: atF04 } })
  await guarded(report, browser, async () => {
    await openMenu(page); await clickMenu(page, 'Tiếp tục')
    await waitFor(page, () => document.querySelector('.driver-popover-title')?.textContent && !!document.querySelector('[data-action="skip-game"]'), null)
    check('9A.1', 'F04 offers the game and the written decline', true, await page.evaluate(() => ({ next: document.querySelector('.driver-popover-next-btn')?.textContent, skip: document.querySelector('[data-action="skip-game"]')?.textContent })))
    await shot(page, 'A1-f04-offer')
    await page.click('[data-action="skip-game"]')
    await waitFor(page, () => !!document.querySelector('.mach-guide-cue[data-kind="game-skipped"]'), null)
    const saved = await progressOf(page)
    check('9A.2', 'declining never opens the game', !(await lockState(page)).dialog && !(await gameFrame(page, 1500)), await lockState(page))
    check('9A.3', 'persistence follows the agreed decision', saved.status === 'skipped' && saved.route === 'full' && saved.lastExit === 'skip-module' && saved.moduleId === 'game' && saved.stepId === 'G01' && saved.completedStepIds.includes('F04') && saved.skippedModuleIds.includes('game'), saved)
    check('9A.4', 'every game step is skipped, none completed', ['G01', 'G02', 'G03', 'G10'].every((id) => saved.skippedStepIds.includes(id)) && !saved.completedStepIds.some((id) => /^G/.test(id)), saved.skippedStepIds)
    check('9A.5', 'no scroll lock is left behind', !(await lockState(page)).body.includes('guide-scroll-locked'), await lockState(page))
    await shot(page, 'A2-declined')
    await page.click('.mach-guide-cue [data-action="game-guide"]')
    const frame = await gameFrame(page)
    check('9A.6', 'the offered "show me how to play" opens the game and starts the guide at its first step', !!frame && await waitChild(frame, firstGame.title), await childTitle(frame))
    await shot(page, 'A3-game-guide-opened')
    check('9A.7', 'no console or page errors', unexpectedErrors(errors, allowed).length === 0, unexpectedErrors(errors, allowed))
  })
}

if (want('B')) {
  const { browser, page, errors } = await start({})
  await guarded(report, browser, async () => {
    await openMini(page, 'Minigame')
    const frame = await gameFrame(page)
    check('9B.1', 'the game guide starts at its first step', !!frame && await waitChild(frame, firstGame.title))
    await shot(page, 'B1-guide')
    check('9B.2', 'the toolbar offers a text Skip while the guide runs', await page.evaluate(() => !!document.querySelector('.mini-game-skip')))
    await inFrame(frame, () => [...document.querySelectorAll('.mach-btn')].find((b) => /Bỏ qua hướng dẫn/.test(b.textContent)).click())
    await wait(2500)
    const after = await lockState(page)
    const mode = await inFrame(frame, () => document.querySelector('.game-panel')?.dataset.mode)
    check('9B.3', 'Skip inside the game ends only the guide: dialog, lock and game stay', after.dialog && after.body.includes('mini-game-open') && mode === 'ready', { after, mode })
    check('9B.4', 'the guide layers are gone from the iframe', (await inFrame(frame, () => document.querySelectorAll('.driver-overlay, .driver-popover, .mach-card, [data-mach-guide-ui]').length)) === 0)
    check('9B.5', 'the toolbar Skip is gone and focus stayed inside the game dialog', await page.evaluate(() => !document.querySelector('.mini-game-skip') && !!document.activeElement?.closest('dialog.mini-game-dialog')), await lockState(page))
    const saved = await progressOf(page)
    check('9B.6', 'progress records a skipped guide, not a completed one', saved.status === 'skipped' && saved.lastExit === 'skip-guide' && !saved.completedModules.includes('game'), saved)
    await shot(page, 'B2-after-skip')
    await page.click('.mini-game-toolbar button[aria-label^="Đóng mini game"]')
    await wait(2500)
    const closed = await lockState(page)
    check('9B.7', 'closing the game releases the lock and returns focus to the owl', !closed.dialog && closed.body === '' && closed.focus === 'mach-guide-dock__button', closed)
    check('9B.8', 'no console or page errors', unexpectedErrors(errors, allowed).length === 0, unexpectedErrors(errors, allowed))
  })
}

if (want('C')) {
  const { browser, page, errors } = await start({})
  await guarded(report, browser, async () => {
    await openMini(page, 'Minigame')
    const frame = await gameFrame(page)
    await waitChild(frame, firstGame.title)
    await wait(1000)
    await frame.focus('.mach-btn.is-primary').catch(() => {})
    await page.keyboard.press('Escape')
    await wait(2000)
    const first = await lockState(page)
    check('9C.1', 'the first Esc closes the guide only', first.dialog && (await inFrame(frame, () => document.querySelectorAll('.driver-popover, .mach-card').length)) === 0, first)
    await page.keyboard.press('Escape')
    await wait(2500)
    const second = await lockState(page)
    check('9C.2', 'the second Esc closes the game and gives the page back', !second.dialog && second.body === '', second)
    check('9C.3', 'focus returns to the owl', second.focus === 'mach-guide-dock__button', second)
    check('9C.4', 'no console or page errors', unexpectedErrors(errors, allowed).length === 0, unexpectedErrors(errors, allowed))
  })
}

if (want('D')) {
  const { browser, page, errors } = await start({})
  await guarded(report, browser, async () => {
    await openMini(page, 'Minigame')
    const frame = await gameFrame(page)
    await waitChild(frame, firstGame.title)
    await page.click('.mini-game-toolbar button[aria-label^="Đóng mini game"]')
    await wait(2500)
    const closed = await lockState(page)
    const saved = await progressOf(page)
    check('9D.1', 'closing mid-guide removes the dialog and every lock', !closed.dialog && closed.body === '', closed)
    check('9D.2', 'the exact step is kept for resuming', saved.status === 'in-progress' && saved.lastExit === 'close' && saved.stepId === 'G01', saved)
    const layers = await page.evaluate(() => document.querySelectorAll('.driver-overlay, .driver-popover, dialog[open]').length)
    check('9D.3', 'no overlay or dialog is left on the page', layers === 0, layers)
    check('9D.4', 'no console or page errors', unexpectedErrors(errors, allowed).length === 0, unexpectedErrors(errors, allowed))
  })
}

if (want('E')) {
  const { browser, page, errors } = await start({})
  await guarded(report, browser, async () => {
    await openMini(page, 'Minigame')
    await waitFor(page, () => !!document.querySelector('.mini-game-skip'), null)
    await page.click('.mini-game-skip')
    const frame = await gameFrame(page)
    await wait(9000)
    check('9E.1', 'a Skip pressed before the child is ready means the guide never starts afterwards', (await inFrame(frame, () => document.querySelectorAll('.driver-popover, .mach-card').length)) === 0, await childTitle(frame))
    const state = await lockState(page)
    check('9E.2', 'the game stays open and playable', state.dialog && (await inFrame(frame, () => !document.querySelector('#startButton')?.disabled)) === true, state)
    check('9E.3', 'no console or page errors', unexpectedErrors(errors, allowed).length === 0, unexpectedErrors(errors, allowed))
  })
}
report.done()
