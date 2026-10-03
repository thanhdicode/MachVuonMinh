// Final browser regressions: game-owned replay, Escape priority, and Atlas origin after relayout.
import { openPage, createReport, guarded, unlockIntro, openMenu, clickMenu, waitFor, waitSettled, progressOf, wait, KEY, seedProgress } from './scenarios/lib.mjs'

const report = createReport('release-regressions')
const storage = { [KEY]: seedProgress({ status: 'dismissed' }) }
const { check } = report
const chapter = async (page, index) => {
  await page.click('.menu-trigger')
  await page.waitForSelector('dialog[open] .chapter-menu')
  const handle = await page.evaluateHandle((index) => [...document.querySelectorAll('.chapter-menu button')].find(button => button.querySelector('span')?.textContent === index), index)
  const button = handle.asElement()
  if (!button) throw new Error(`chapter ${index} missing`)
  await button.focus()
  await page.keyboard.press('Enter')
  await wait(1200)
}
const module = async (page, title) => { await openMenu(page); await clickMenu(page, title); await waitSettled(page) }

{
  const { browser, page, errors } = await openPage({ storage })
  await guarded(report, browser, async () => {
    await unlockIntro(page)
    await chapter(page, '08')
    await page.waitForSelector('.final-game-trigger', { visible: true })
    await page.click('.final-game-trigger')
    await page.waitForSelector('.mini-game-frame')
    const frame = await (await page.$('.mini-game-frame')).contentFrame()
    await frame.waitForSelector('#guideLauncher', { visible: true })
    await frame.click('#guideLauncher')
    await waitFor(page, () => JSON.parse(localStorage.getItem('mach-vuon-minh:guide:v2'))?.stepId === 'G01')
    let progress = await progressOf(page)
    check('game.owl-start', 'game owl starts a persisted game route', progress.status === 'in-progress' && progress.route === 'game', progress)
    await frame.waitForSelector('.mach-btn.is-primary', { visible: true })
    await frame.click('.mach-btn.is-primary')
    await waitFor(page, () => JSON.parse(localStorage.getItem('mach-vuon-minh:guide:v2'))?.stepId === 'G02')
    progress = await progressOf(page)
    check('game.completion', 'a real Next records G01 completion', progress.completedStepIds.includes('G01'), progress)
    await frame.click('.mach-btn.is-skip')
    await waitFor(page, () => JSON.parse(localStorage.getItem('mach-vuon-minh:guide:v2'))?.status === 'skipped')
    check('game.skip-keeps-dialog', 'Skip keeps the game playable', !!await page.$('dialog.mini-game-dialog[open]'))
    await frame.click('#guideLauncher')
    await waitFor(page, () => JSON.parse(localStorage.getItem('mach-vuon-minh:guide:v2'))?.status === 'in-progress')
    progress = await progressOf(page)
    check('game.replay', 'replay returns to in-progress and preserves earned completion', progress.completedStepIds.includes('G01') && progress.stepId === 'G01', progress)
    await page.click('.mini-game-toolbar button[aria-label^="Đóng mini game"]')
    await waitFor(page, () => !document.querySelector('dialog.mini-game-dialog[open]'))
    check('game.close', 'dialog closure leaves the replay resumable and releases the game lock', (await progressOf(page)).lastExit === 'close' && !(await page.evaluate(() => document.body.classList.contains('guide-scroll-locked'))))
    check('game.console', 'no game console errors', errors.length === 0, errors)
  })
}

{
  const { browser, page, errors } = await openPage({ storage, width: 360, height: 640, touch: true })
  await guarded(report, browser, async () => {
    await unlockIntro(page)
    await module(page, 'Công cụ, máy móc')
    await page.click('.driver-popover [data-action="options"]')
    await page.keyboard.press('Escape')
    check('escape.options', 'first Escape closes options while keeping the guide step', !(await page.$('.mach-guide-options[data-open]')) && !!await page.$('.driver-popover'))
    await page.keyboard.press('Escape')
    check('escape.guide', 'second Escape closes the guide', !(await page.$('.driver-popover')) && (await progressOf(page)).lastExit === 'close')
    check('escape.console', 'no options console errors', errors.length === 0, errors)
  })
}

{
  const { browser, page, errors } = await openPage({ storage, width: 1440, height: 900 })
  await guarded(report, browser, async () => {
    await unlockIntro(page)
    await chapter(page, '01.H')
    await page.waitForSelector('.history-inspect', { visible: true })
    await page.click('.history-inspect')
    await module(page, 'Atlas lịch sử')
    const pressed = () => page.$eval('.history-inspect', button => button.getAttribute('aria-pressed') === 'true')
    check('lens.active', 'lens remains active when its scene guide opens', await pressed())
    await page.keyboard.press('Escape')
    await wait(500)
    check('lens.escape-order', 'Escape closes the higher guide before the lens', !(await page.$('.driver-popover')) && await pressed())
    await page.keyboard.press('Escape')
    check('lens.escape', 'next Escape closes the lens', !(await pressed()))
    for (let i = 0; i < 3; i++) { await page.click('button[aria-label="Thời kỳ tiếp theo"]'); await wait(1000) }
    const era = await page.$eval('.history-bridge', node => node.dataset.activeEra)
    await module(page, 'Phòng biện chứng')
    await page.setViewport({ width: 899, height: 900, deviceScaleFactor: 1 })
    await waitSettled(page)
    await page.keyboard.press('Escape')
    await waitFor(page, expected => {
      const bridge = document.querySelector('.history-bridge')
      return bridge?.dataset.activeEra === expected && bridge?.dataset.layout === 'vertical'
    }, era, 5000).catch(() => {})
    const after = await page.$eval('.history-bridge', node => ({ era: node.dataset.activeEra, layout: node.dataset.layout, y: node.getBoundingClientRect().y }))
    check('origin.atlas-relayout', 'module replay restores the caller Atlas era across rail/static relayout', after.era === era && after.layout === 'vertical', { beforeEra: era, after })
    check('origin.console', 'no Atlas console errors', errors.length === 0, errors)
  })
}
report.done()
