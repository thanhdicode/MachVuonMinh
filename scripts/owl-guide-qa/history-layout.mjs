import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { openApp, unlockIntro, wait, OUT } from './app.mjs'

const out = process.env.QA_HISTORY_OUT || join(OUT, 'history-layout')
mkdirSync(out, { recursive: true })
const seed = JSON.stringify({ schemaVersion: 2, status: 'dismissed', route: null, moduleId: null, stepId: null, completedStepIds: [], completedModules: [], skippedStepIds: [], skippedModuleIds: [], lastExit: null })
const sizes = process.env.QA_HISTORY_REPRO ? [[1366, 660]] : [[1280, 600], [1366, 660], [1366, 768], [1440, 720], [1440, 900], [1920, 1080]]
const results = []
for (const [width, height] of sizes) {
  const { browser, page, errors } = await openApp({ width, height, storage: { 'mach-vuon-minh:guide:v2': seed } })
  try {
    await unlockIntro(page)
    await page.waitForFunction(() => !document.querySelector('.intro-label') || getComputedStyle(document.querySelector('.intro-label')).display === 'none')
    await page.evaluate(() => document.fonts.ready)
    await wait(750)
    await page.focus('.menu-trigger')
    await page.keyboard.press('Enter')
    const history = await page.evaluateHandle(() => [...document.querySelectorAll('.chapter-menu button')].find((button) => button.textContent.includes('Bản đồ lịch sử')))
    await history.asElement().press('Enter')
    await page.waitForFunction(() => document.querySelector('.history-bridge')?.dataset.layout === 'horizontal')
    await page.waitForFunction(() => Math.abs(document.querySelector('.history-bridge').getBoundingClientRect().top) < 2, { timeout: 15000 }).catch(async (error) => {
      console.log(JSON.stringify(await page.evaluate(() => ({ scrollY, atlasOffset: document.querySelector('.history-insertion').offsetTop, rootTop: document.querySelector('.history-bridge').getBoundingClientRect().top, locked: document.body.className }))))
      throw error
    })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForFunction(() => document.querySelector('.history-current .history-image img')?.naturalWidth > 0)
    await wait(700)
    const eras = []
    for (let era = 0; era < 8; era++) {
      if (era) {
        await page.click('.history-controls button[aria-label="Thời kỳ tiếp theo"]')
        await page.waitForFunction((i) => document.querySelector('.history-bridge')?.dataset.era === String(i), {}, era)
        await page.waitForFunction(() => document.querySelector('.history-current .history-image img')?.naturalWidth > 0)
        await wait(850)
      }
      const metrics = await page.evaluate(() => {
        const root = document.querySelector('.history-bridge')
        const rect = (selector) => { const r = root.querySelector(selector).getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom } }
        const overlap = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
        const boxes = Object.fromEntries(Object.entries({ heading: '.history-heading', year: '.history-curator .history-year', title: '.history-curator h3', body: '.history-curator .history-body', facts: '.history-fact-rail', controls: '.history-controls' }).map(([key, selector]) => [key, rect(selector)]))
        const nav = document.querySelector('.minimal-nav').getBoundingClientRect(), footer = document.querySelector('.exhibit-footer > span').getBoundingClientRect()
        const pairs = [['heading', 'year'], ['heading', 'title'], ['heading', 'body'], ['heading', 'controls'], ['title', 'body'], ['body', 'facts']]
        const collisions = pairs.filter(([a, b]) => overlap(boxes[a], boxes[b]))
        for (const key of ['heading', 'year', 'controls']) if (overlap(boxes[key], nav)) collisions.push([key, 'nav'])
        if (overlap(boxes.facts, footer)) collisions.push(['facts', 'footer'])
        const image = root.querySelector('.history-current .history-image img'), r = image.getBoundingClientRect(), scale = Math.min(r.width / image.naturalWidth, r.height / image.naturalHeight)
        const art = { left: r.left + (r.width - image.naturalWidth * scale) / 2, right: r.right - (r.width - image.naturalWidth * scale) / 2, top: r.bottom - image.naturalHeight * scale, bottom: r.bottom }
        // Compact artwork is clipped behind the left curator dock.
        if (innerWidth < 1440) art.left = Math.max(art.left, boxes.body.right + 18)
        return { era: root.dataset.era, boxes, collisions, artLoaded: image.naturalWidth > 0, artCollisions: ['heading', 'year', 'title', 'body'].filter((key) => overlap(boxes[key], art)), overflow: document.documentElement.scrollWidth - innerWidth }
      })
      eras.push(metrics)
      if (era === 5 || metrics.collisions.length || metrics.artCollisions.length) await page.screenshot({ path: join(out, `${width}-${height}-era-${era}.png`) })
      writeFileSync(join(out, `${width}-${height}.json`), JSON.stringify({ width, height, eras, errors }, null, 2))
      assert.deepEqual(metrics.collisions, [], `${width}x${height} era${era}: text/control overlap`)
      assert.deepEqual(metrics.artCollisions, [], `${width}x${height} era${era}: text/art overlap`)
      assert.equal(metrics.artLoaded, true)
      assert.equal(metrics.overflow, 0)
      for (const [key, box] of Object.entries(metrics.boxes)) assert.ok(box.top >= 0 && box.bottom <= height - 24 && box.left >= 0 && box.right <= width, `${key} stays inside ${width}x${height} above the footer`)
    }
    assert.deepEqual(errors, [])
    results.push({ width, height, eras: eras.length, pass: true })
  } finally { await browser.close() }
}
writeFileSync(join(out, 'result.json'), JSON.stringify({ url: process.env.QA_URL, results, pass: true }, null, 2))
console.log(JSON.stringify({ results, pass: true }))
