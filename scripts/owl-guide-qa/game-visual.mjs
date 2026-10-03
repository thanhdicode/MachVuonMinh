import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { openApp, OUT, unlockIntro, wait } from './app.mjs'

const dir = join(OUT, 'walk', 'release-game-visual')
mkdirSync(dir, { recursive: true })

const findGameFrame = async (page) => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const found = page.frames().find((frame) => frame !== page.mainFrame() && frame.url() === 'about:srcdoc')
    if (found) return found
    await wait(250)
  }
  throw new Error('game iframe did not open')
}

const openGame = async (page) => {
  await unlockIntro(page)
  await wait(800)
  await page.click('.mach-guide-dock__button')
  await page.waitForSelector('.mach-guide-menu', { timeout: 20000 })
  await page.evaluate(() => [...document.querySelectorAll('.mach-guide-menu__modules button')]
    .find((button) => button.textContent.includes('Minigame'))?.click())
  const frame = await findGameFrame(page)
  await frame.waitForSelector('#gameCanvas', { timeout: 20000 })
  await page.waitForSelector('.mini-game-skip', { timeout: 20000 })
  await page.click('.mini-game-skip')
  await frame.waitForFunction(() => !document.querySelector('#startButton')?.disabled, { timeout: 20000 })
  return frame
}

const canvasHash = (frame) => frame.evaluate(() => {
  const canvas = document.querySelector('#gameCanvas')
  const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
  let hash = 2166136261
  for (let i = 0; i < data.length; i += 400) hash = Math.imul(hash ^ data[i], 16777619)
  return hash >>> 0
})

const capture = async ({ name, width, height, touch }) => {
  const seed = JSON.stringify({ schemaVersion: 2, status: 'dismissed', route: null, moduleId: null, stepId: null, completedStepIds: [], completedModules: [], skippedStepIds: [], skippedModuleIds: [], lastExit: null })
  const { browser, page, errors } = await openApp({ width, height, touch, storage: { 'mach-vuon-minh:guide:v2': seed } })
  try {
    const frame = await openGame(page)
    await page.screenshot({ path: join(dir, `${name}-start.png`) })
    await frame.click('#startButton')
    await wait(1200)
    await page.screenshot({ path: join(dir, `${name}-running.png`) })
    const metrics = await frame.evaluate(() => {
      const canvas = document.querySelector('#gameCanvas')
      const panel = document.querySelector('.game-panel')
      const rect = canvas.getBoundingClientRect()
      const panelRect = panel.getBoundingClientRect()
      const identity = document.querySelector('.stage-identity').getBoundingClientRect()
      const stats = document.querySelector('.game-stats').getBoundingClientRect()
      const title = document.querySelector('.stage-name').getBoundingClientRect()
      const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
      let opaque = true
      for (let i = 3; i < pixels.length; i += 16000) if (pixels[i] !== 255) { opaque = false; break }
      return {
        mode: panel.dataset.mode,
        viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
        canvas: { width: canvas.width, height: canvas.height, cssWidth: Math.round(rect.width), cssHeight: Math.round(rect.height), opaque },
        panel: { left: Math.round(panelRect.left), top: Math.round(panelRect.top), right: Math.round(panelRect.right), bottom: Math.round(panelRect.bottom) },
        contained: panelRect.left >= -1 && panelRect.top >= -1 && panelRect.right <= innerWidth + 1 && panelRect.bottom <= innerHeight + 1,
        backgroundApi: typeof window.MACH_GAME_BACKGROUND?.create === 'function',
        hudClear: (identity.right <= stats.left + 1 || identity.bottom <= stats.top + 1) && title.width > 20,
      }
    })
    await frame.click('#pauseButton')
    await wait(350)
    const first = await canvasHash(frame)
    await wait(500)
    const second = await canvasHash(frame)
    metrics.pause = { mode: await frame.$eval('.game-panel', (panel) => panel.dataset.mode), stablePixels: first === second }

    if (name === 'desktop') {
      const gallery = await frame.evaluate(async () => {
        const images = {}
        await Promise.all(Object.entries(window.MACH_RUNNER_ASSETS.sprites).map(([key, url]) => new Promise((resolve) => { const image = new Image(); image.onload = () => { images[key] = image; resolve() }; image.src = url })))
        return Array.from({ length: 5 }, (_, stage) => {
        const canvas = document.createElement('canvas')
        canvas.width = 1000
        canvas.height = 430
        const renderer = window.MACH_GAME_BACKGROUND.create(undefined, { images })
        renderer.draw(canvas.getContext('2d'), { stage, width: 1000, height: 430, groundY: 333, world: stage * 217, reduced: false })
        return canvas.toDataURL('image/png')
      })})
      gallery.forEach((data, stage) => writeFileSync(join(dir, `stage-${stage + 1}.png`), data.split(',')[1], 'base64'))
    }
    return { name, metrics, errors: [...errors], screenshots: [`${name}-start.png`, `${name}-running.png`] }
  } finally {
    await browser.close()
  }
}

const results = []
for (const viewport of [
  { name: 'desktop', width: 1440, height: 900, touch: false },
  { name: 'mobile', width: 390, height: 844, touch: true },
]) results.push(await capture(viewport))

const report = {
  url: process.env.QA_URL || 'http://127.0.0.1:5173/',
  createdAt: new Date().toISOString(),
  results,
  gallery: Array.from({ length: 5 }, (_, index) => `stage-${index + 1}.png`),
  pass: results.every(({ metrics, errors }) => metrics.mode === 'running' && metrics.contained && metrics.hudClear && metrics.canvas.opaque && metrics.backgroundApi && metrics.pause.mode === 'paused' && metrics.pause.stablePixels && errors.length === 0),
}
writeFileSync(join(dir, 'result.json'), `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify(report, null, 2))
if (!report.pass) process.exitCode = 1
