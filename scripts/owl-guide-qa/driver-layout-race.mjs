// Laptop regression for Driver target resolution across lazy loading, resize bursts and reduced-motion layout swaps.
// Usage: QA_URL=http://127.0.0.1:5180 node scripts/owl-guide-qa/driver-layout-race.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { openApp, unlockIntro, wait, OUT } from './app.mjs'
import { sampleLayer } from './layout-probe.mjs'

const WIDTH = 1366
const HEIGHT = 768
const URL = process.env.QA_URL || 'http://127.0.0.1:5180'
const dir = join(OUT, 'responsive', 'driver-layout-race')
mkdirSync(dir, { recursive: true })

const seed = JSON.stringify({
  schemaVersion: 2,
  status: 'in-progress',
  route: 'history',
  moduleId: 'history',
  stepId: 'H02',
  completedStepIds: ['H01'],
  completedModules: [],
  skippedStepIds: [],
  skippedModuleIds: [],
  lastExit: 'close',
})

const checks = []
const screenshotResults = []
const check = (name, ok, evidence = null) => {
  checks.push({ name, ok: !!ok, evidence })
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${evidence === null ? '' : ` :: ${JSON.stringify(evidence).slice(0, 500)}`}`)
}

async function saveScreenshot(page, name) {
  let bytes
  let standardError = null
  const started = Date.now()
  try {
    bytes = await page.screenshot({ type: 'png', captureBeyondViewport: false, timeout: 8000 })
  } catch (error) {
    standardError = String(error?.message ?? error)
    console.error(`SCREENSHOT_STANDARD_FAILED ${name}: ${standardError}`)
    bytes = await page.screenshot({ type: 'png', captureBeyondViewport: false, fromSurface: false, timeout: 8000 })
  }
  const file = join(dir, `${name}.png`)
  writeFileSync(file, bytes)
  const result = { name, file, bytes: bytes.byteLength, elapsedMs: Date.now() - started, standardError, fallback: standardError !== null }
  screenshotResults.push(result)
  console.log(`SCREENSHOT_SAVED ${JSON.stringify(result)}`)
  return result
}

const progress = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('mach-vuon-minh:guide:v2') || 'null'))
const geometry = (page) => page.evaluate(() => {
  const target = document.querySelector('.driver-active-element')
  const overlay = document.querySelector('.driver-overlay')
  const path = overlay?.querySelector('path')
  if (!target || !overlay || !path) return null
  const r = target.getBoundingClientRect()
  const padding = 8
  const radius = Math.floor(Math.max(Math.min(8, (r.width + padding * 2) / 2, (r.height + padding * 2) / 2), 0))
  const x = r.x - padding + radius
  const y = r.y - padding
  const width = r.width + padding * 2 - radius * 2
  const height = r.height + padding * 2 - radius * 2
  const expected = `M${innerWidth},0L0,0L0,${innerHeight}L${innerWidth},${innerHeight}L${innerWidth},0Z
    M${x},${y} h${width} a${radius},${radius} 0 0 1 ${radius},${radius} v${height} a${radius},${radius} 0 0 1 -${radius},${radius} h-${width} a${radius},${radius} 0 0 1 -${radius},-${radius} v-${height} a${radius},${radius} 0 0 1 ${radius},-${radius} z`
  const normalize = (value) => value.replace(/\s+/g, ' ').trim()
  const actualPath = normalize(path.getAttribute('d') || '')
  const hole = /Z M(-?[\d.]+),(-?[\d.]+) h(-?[\d.]+) a[\s\S]*? v(-?[\d.]+)/.exec(actualPath)?.slice(1).map(Number)
  const expectedHole = [x, y, width, height]
  return {
    target: { x: r.x, y: r.y, width: r.width, height: r.height },
    viewBox: overlay.getAttribute('viewBox'),
    pathMatches: !!hole && hole.every((value, index) => Math.abs(value - expectedHole[index]) <= 1),
    hole,
    expectedHole,
    actualPath,
    expectedPath: normalize(expected),
  }
})

async function settled(page, stepId = 'H02', timeout = 60000) {
  const started = Date.now()
  let previous = ''
  let stable = 0
  let last = null
  while (Date.now() - started < timeout) {
    const layer = await sampleLayer(page, 'history-era-nav').catch(() => null)
    if (layer && !layer.marker) throw new Error('page reloaded during regression; rerun after source changes stop')
    const saved = await progress(page).catch(() => null)
    const spot = await geometry(page).catch(() => null)
    if (layer && saved?.stepId === stepId && layer.presenter === 'driver' && layer.target && spot?.pathMatches) {
      const key = JSON.stringify([layer.target, layer.pop, spot.actualPath])
      stable = key === previous ? stable + 1 : 0
      previous = key
      last = { layer, progress: saved, geometry: spot }
      if (stable >= 4) return last
    } else {
      stable = 0
      previous = ''
      last = { layer, progress: saved, geometry: spot }
    }
    await wait(200)
  }
  throw new Error(`step ${stepId} did not settle: ${JSON.stringify({ progress: last?.progress, presenter: last?.layer?.presenter, target: last?.layer?.targetInfo, targetBox: last?.layer?.target, layout: last?.layer?.historyLayout, activeEra: last?.layer?.activeEra, geometry: last?.geometry }).slice(0, 2400)}`)
}

let browser
let page
let errors = []
let heldRequest = null
let releaseHeld = null
let heldUrl = null
let requestHandler = null
let scenarioError = null

try {
  const session = await openApp({ width: WIDTH, height: HEIGHT, url: URL, storage: { 'mach-vuon-minh:guide:v2': seed } })
  browser = session.browser
  page = session.page
  errors = session.errors
  page.setDefaultTimeout(60000)
  await unlockIntro(page)
  await page.evaluate(() => { window.__qaMarker = true })

  await page.setRequestInterception(true)
  const intercepted = new Promise((resolve) => {
    requestHandler = (request) => {
      // Vite serves the source `.ts` URL in dev; production serves a hashed `.js` chunk.
      if (!heldRequest && request.url().includes('guideDriver')) {
        heldRequest = request
        heldUrl = request.url()
        releaseHeld = () => request.continue()
        resolve(request.url())
        return
      }
      void request.continue()
    }
    page.on('request', requestHandler)
  })

  await page.click('.mach-guide-dock__button')
  await page.waitForSelector('.mach-guide-menu', { visible: true })
  const resumed = await page.evaluate(() => {
    const button = [...document.querySelectorAll('.mach-guide-menu button')].find((candidate) => candidate.textContent.trim().startsWith('Tiếp tục'))
    button?.click()
    return !!button
  })
  check('resume control starts stored H02', resumed)

  await Promise.race([
    intercepted,
    wait(30000).then(() => { throw new Error('guideDriver request was not intercepted') }),
  ])
  check('lazy guideDriver request held', !!heldRequest, heldUrl)
  await page.setViewport({ width: 1024, height: HEIGHT, deviceScaleFactor: 1 })
  await page.setViewport({ width: 1440, height: HEIGHT, deviceScaleFactor: 1 })
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 })
  releaseHeld?.()
  releaseHeld = null
  await wait(100)
  if (requestHandler) page.off('request', requestHandler)
  await page.setRequestInterception(false)

  const before = await settled(page)
  const exactBefore = await page.evaluate(() => document.querySelector('.driver-active-element') === document.querySelector('[data-rail-era="1"]'))
  check('rapid width burst resolves exact visible era 1 button', exactBefore, before.layer.targetInfo)
  check('spotlight geometry matches settled era 1 button', before.geometry.pathMatches && before.geometry.viewBox === `0 0 ${WIDTH} ${HEIGHT}`, before.geometry)
  await saveScreenshot(page, 'h02-before')

  await page.click('[data-rail-era="1"]')
  await page.waitForFunction(() => document.querySelector('.history-bridge')?.dataset.activeEra === '1')
  const selected = await page.evaluate(() => ({ activeEra: document.querySelector('.history-bridge')?.dataset.activeEra, current: document.querySelector('[data-rail-era="1"]')?.getAttribute('aria-current') }))
  check('actual era 1 click selects era 1', selected.activeEra === '1' && selected.current === 'step', selected)
  await page.waitForFunction(() => document.querySelector('[data-rail-era="1"]')?.classList.contains('driver-active-element'))
  check('React selection keeps the highlighted node interactive', await page.$eval('[data-rail-era="1"]', node => getComputedStyle(node).pointerEvents === 'auto'))

  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.waitForFunction(() => document.querySelector('.history-bridge')?.dataset.layout !== 'horizontal')
  const reduced = await settled(page)
  const exactStatic = await page.evaluate(() => document.querySelector('.driver-active-element') === document.querySelector('[data-label-era="1"] .history-mobile-copy'))
  check('reduced motion swaps H02 to static era 1 copy', exactStatic, reduced.layer.targetInfo)
  check('static spotlight geometry settles', reduced.geometry.pathMatches, reduced.geometry)

  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
  await page.waitForFunction(() => document.querySelector('.history-bridge')?.dataset.layout === 'horizontal')
  const after = await settled(page)
  const exactAfter = await page.evaluate(() => document.querySelector('.driver-active-element') === document.querySelector('[data-rail-era="1"]'))
  check('normal motion restores exact era 1 button', exactAfter, after.layer.targetInfo)
  check('restored spotlight geometry settles', after.geometry.pathMatches, after.geometry)
  await saveScreenshot(page, 'h02-after')

  await page.click('.driver-popover-next-btn')
  const h03 = await settled(page, 'H03')
  check('Next advances from H02 to working H03', h03.progress.stepId === 'H03' && h03.layer.presenter === 'driver', { stepId: h03.progress.stepId, target: h03.layer.targetInfo })

  await page.click('.driver-popover-close-btn')
  await page.waitForFunction(() => !document.querySelector('.driver-popover') && !document.querySelector('.driver-overlay'))
  const leftovers = await page.evaluate(() => ({ overlays: document.querySelectorAll('.driver-overlay').length, popovers: document.querySelectorAll('.driver-popover').length }))
  check('dismiss leaves no Driver overlays or popovers', leftovers.overlays === 0 && leftovers.popovers === 0, leftovers)
  check('browser console stays clean', errors.length === 0, errors)
} catch (error) {
  scenarioError = String(error?.stack ?? error)
  check('scenario completes', false, scenarioError)
  if (page) {
    try { await saveScreenshot(page, 'failure') } catch (shotError) { console.error(`SCREENSHOT_FALLBACK_FAILED: ${shotError?.stack ?? shotError}`) }
  }
} finally {
  if (releaseHeld) {
    try { releaseHeld() } catch {}
  }
  if (browser) await browser.close().catch(() => {})
}

const failed = checks.filter((entry) => !entry.ok)
const resultFile = join(dir, 'result.json')
const result = {
  url: URL,
  viewport: { width: WIDTH, height: HEIGHT },
  passed: checks.length - failed.length,
  failed: failed.length,
  errors,
  scenarioError,
  screenshots: screenshotResults,
  checks,
}
writeFileSync(resultFile, JSON.stringify(result, null, 2))
console.log(`RESULT ${result.passed}/${checks.length} passed; failed=${result.failed}; errors=${errors.length}`)
console.log(`RESULT_JSON ${resultFile}`)
for (const shot of screenshotResults) console.log(`RESULT_IMAGE ${shot.file} ${shot.bytes} bytes`)
if (failed.length) process.exitCode = 1
