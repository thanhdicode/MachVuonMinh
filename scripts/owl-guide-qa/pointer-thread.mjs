// Usage: node scripts/owl-guide-qa/pointer-thread.mjs [--width 1440] [--height 900] [--touch]
// First visit -> quick route -> I02: the reader drags the red thread through the eyelet with a real pointer (mouse or touch).
// Asserts the exhibit unlocks, manual practice confirmation advances to I03, no cue is left behind, and the handle stays clear.
import { mkdirSync, writeFileSync } from 'node:fs'
import { openApp, wait, OUT } from './app.mjs'

const arg = (name, def) => { const i = process.argv.indexOf(`--${name}`); return i < 0 ? def : (process.argv[i + 1]?.startsWith('--') || i + 1 >= process.argv.length ? true : process.argv[i + 1]) }
const width = Number(arg('width', 1440)), height = Number(arg('height', 900)), touch = arg('touch', false) === true
const tag = `pointer-thread-${width}x${height}${touch ? '-touch' : ''}`
const dir = `${OUT}/lifecycle/${tag}`; mkdirSync(dir, { recursive: true })
const { browser, page, errors } = await openApp({ width, height, touch })
const checks = []
const check = (name, ok, detail) => { checks.push({ name, ok: !!ok, detail }); console.log(ok ? 'PASS' : 'FAIL', name, detail ?? '') }
const progress = () => page.evaluate(() => JSON.parse(localStorage.getItem('mach-vuon-minh:guide:v2') || 'null'))
const waitFor = async (predicate, ms = 60000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await predicate()) return true; await wait(400) } return false }

try {
  check('welcome shows', await waitFor(() => page.$('.mach-guide-welcome').then(Boolean), 30000))
  await page.evaluate(() => document.querySelector('.mach-guide-welcome [data-action="quick"]').click())
  check('I02 cue shows', await waitFor(async () => (await progress())?.stepId === 'I02' && !!(await page.$('.mach-guide-cue[data-kind="practice"]'))))
  await wait(1200)
  const handle = await page.$eval('.thread-handle', (e) => { const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 } })
  const cue = await page.$eval('.mach-guide-cue', (e) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height } })
  const covers = handle.x >= cue.x && handle.x <= cue.x + cue.w && handle.y >= cue.y && handle.y <= cue.y + cue.h
  check('cue does not sit on the thread handle', !covers, JSON.stringify({ handle, cue }))
  await page.screenshot({ path: `${dir}/01-i02-cue.png` })
  const hit = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('.thread-handle') !== null, handle)
  check('the handle is the element under the pointer (nothing overlays it)', hit)

  const end = { x: width * 0.55, y: height * 0.45 }
  if (touch) {
    await page.touchscreen.touchStart(handle.x, handle.y)
    for (let i = 1; i <= 12; i += 1) { await page.touchscreen.touchMove(handle.x + (end.x - handle.x) * i / 12, handle.y + (end.y - handle.y) * i / 12); await wait(40) }
    await page.screenshot({ path: `${dir}/02-dragging.png` })
    await page.touchscreen.touchEnd()
  } else {
    await page.mouse.move(handle.x, handle.y); await page.mouse.down()
    for (let i = 1; i <= 12; i += 1) { await page.mouse.move(handle.x + (end.x - handle.x) * i / 12, handle.y + (end.y - handle.y) * i / 12); await wait(40) }
    await page.screenshot({ path: `${dir}/02-dragging.png` })
    await page.mouse.up()
  }
  check('the exhibit unlocks after the drag', await waitFor(() => page.evaluate(() => document.querySelector('.experience')?.classList.contains('unlocked')), 30000))
  await page.click('.mach-guide-cue [data-action="practice-done"]')
  check('manual practice confirmation advances to I03', await waitFor(async () => (await progress())?.stepId === 'I03', 30000), JSON.stringify((await progress())?.stepId))
  const state = await progress()
  check('I02 is recorded as completed, not skipped', state?.completedStepIds?.includes('I02') && !state?.skippedStepIds?.includes('I02'), JSON.stringify({ done: state?.completedStepIds, skipped: state?.skippedStepIds }))
  await wait(2500)
  await page.screenshot({ path: `${dir}/03-after.png` })
  check('no leftover practice cue', (await page.$$('.mach-guide-cue[data-kind="practice"]')).length === 0)
  check('no console or page errors', errors.length === 0, JSON.stringify(errors.slice(0, 3)))
} catch (error) { check('script ran to the end', false, error.message) }
const failed = checks.filter((c) => !c.ok).length
writeFileSync(`${dir}/result.json`, JSON.stringify({ name: tag, passed: checks.length - failed, failed, results: checks }, null, 1))
console.log(`SUMMARY [${tag}] pass=${checks.length - failed} fail=${failed}`)
await browser.close()
process.exit(failed ? 1 : 0)
