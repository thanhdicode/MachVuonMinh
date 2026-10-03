// Usage: node scripts/owl-guide-qa/states.mjs --width 360 --height 640 [--touch] [--reduced] [--zoom 2] [--textonly 2] [--tag name]
// Captures the guide layers a module walk cannot reach: first-run welcome, I02 practice cue (thread + eyelet), paused notice,
// owl menu (and its last item), skipped notice. Same issue classes as matrix-walk. Output: .studio/qa/owl-guide/responsive/states-<tag>/
import { mkdirSync, writeFileSync } from 'node:fs'
import { openApp, wait, OUT } from './app.mjs'
import { sampleLayer, classify, overlapOf } from './layout-probe.mjs'
const arg = (name, def) => { const i = process.argv.indexOf(`--${name}`); return i < 0 ? def : (process.argv[i + 1]?.startsWith('--') || i + 1 >= process.argv.length ? true : process.argv[i + 1]) }
const width = Number(arg('width', 1440)), height = Number(arg('height', 900)), touch = arg('touch', false) === true, reduced = arg('reduced', false) === true
const zoom = Number(arg('zoom', 1)), textOnly = Number(arg('textonly', 1))
const tag = arg('tag', `${width}x${height}${touch ? '-touch' : ''}${reduced ? '-reduced' : ''}${zoom !== 1 ? '-zoom' + zoom * 100 : ''}${textOnly !== 1 ? '-text' + textOnly * 100 : ''}`)
const dir = `${OUT}/responsive/states-${tag}`; mkdirSync(dir, { recursive: true })
const { browser, page, errors } = await openApp({ width: Math.round(width / zoom), height: Math.round(height / zoom), scale: zoom, touch, reduced, storage: {} })
await page.evaluate(() => { window.__qaMarker = true })
if (textOnly !== 1) {
  await page.evaluate((factor) => {
    const scaled = new WeakSet(); const roots = ['.mach-guide-root', '.driver-popover', '.mach-guide-cue', '.mach-guide-welcome', '.mach-guide-menu']
    const scale = () => { const nodes = [...document.querySelectorAll(roots.flatMap((s) => [s, `${s} *`]).join(','))].filter((n) => !scaled.has(n)); const sizes = nodes.map((n) => parseFloat(getComputedStyle(n).fontSize)); nodes.forEach((n, i) => { scaled.add(n); n.style.setProperty('font-size', `${sizes[i] * factor}px`, 'important') }) }
    new MutationObserver(scale).observe(document.documentElement, { childList: true, subtree: true }); scale()
  }, textOnly)
}
const results = []
const shot = (name) => page.screenshot({ path: `${dir}/${name}.png` }).catch(() => {})
const wanted = async (fn, timeout = 60000) => { try { await page.waitForFunction(fn, { timeout, polling: 250 }); return true } catch { return false } }
const stable = async (read) => { let last = '', n = 0; for (let i = 0; i < 30 && n < 3; i++) { const k = JSON.stringify(await read()); n = k === last ? n + 1 : 0; last = k; await wait(300) } }
const record = async (id, target, extra = {}) => {
  await stable(() => page.evaluate(() => { const l = document.querySelector('.mach-guide-welcome,.driver-popover.mach-guide,.mach-guide-cue,.mach-guide-menu'); return l?.getBoundingClientRect().toJSON() }))
  await wait(700)
  const s = await sampleLayer(page, target)
  const rec = { id, presenter: s.presenter, kind: s.kind, title: s.title, titleOk: true, textOk: true, ...extra }
  rec.issues = classify(rec, s, { baseDocW: 0, touch })
  if (target === 'intro-thread') {
    const extraBoxes = await page.evaluate(() => ['.thread-handle', '.eyelet-target'].map((sel) => { const e = document.querySelector(sel); const b = e?.getBoundingClientRect(); return b ? { sel, x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } : null }))
    rec.thread = extraBoxes
    for (const b of extraBoxes.filter(Boolean)) { const o = overlapOf(s.cue, b, 0); if (o > 0) rec.issues.push(`2:cue-covers-${b.sel}(${o}px2)`) }
  }
  rec.layer = s.layer; rec.box = s.layer?.box; rec.vp = { w: s.vw, h: s.vh }
  await shot(id)
  results.push(rec)
  console.log(id, rec.presenter, rec.kind ?? '', rec.issues.length ? `ISSUES ${rec.issues.map((i) => i.slice(0, 100)).join(' | ')}` : 'ok')
  return s
}
try {
  // 1. Welcome (new visitor).
  const welcome = await wanted(() => !!document.querySelector('.mach-guide-welcome'))
  if (!welcome) results.push({ id: 'welcome', failure: 'welcome did not appear' })
  else {
    await record('welcome', 'welcome')
    // 2. I02 practice cue after choosing the full tour.
    await page.click('.mach-guide-welcome [data-action="full"]')
    const cueUp = await wanted(() => !!document.querySelector('.mach-guide-cue[data-kind="practice"]') || !!document.querySelector('.driver-popover.mach-guide'))
    if (!cueUp) results.push({ id: 'I02', failure: 'no I02 presenter' })
    else {
      await record('I02', 'intro-thread')
      // 3. Paused notice.
      const options = await page.$('.mach-guide-cue [data-action="options"], .driver-popover [data-action="options"]')
      if (options && await options.evaluate(node => node.checkVisibility({ checkVisibilityCSS: true }))) await options.click()
      await page.click('.mach-guide-cue [data-action="pause"], .driver-popover [data-action="pause"]')
      await wanted(() => document.querySelector('.mach-guide-cue')?.dataset.kind === 'paused', 20000)
      await record('paused', null)
      await page.click('.mach-guide-cue [data-action="resume"]').catch(() => {})
      await wanted(() => document.querySelector('.mach-guide-cue')?.dataset.kind === 'practice', 30000)
      // 4. Skip from the practice cue: skipped notice.
      await page.click('.mach-guide-cue .mach-guide__btn--skip, .driver-popover .mach-guide__btn--skip')
      await wanted(() => document.querySelector('.mach-guide-cue')?.dataset.kind === 'skipped', 20000)
      await record('skipped', null)
    }
  }
  // 5. Owl menu (works without unlocking the intro).
  await page.evaluate(() => document.querySelector('.mach-guide-cue [data-action="dismiss"]')?.click())
  await page.click('.mach-guide-dock__button')
  await page.waitForSelector('.mach-guide-menu', { timeout: 20000 })
  await wait(600)
  const menu = await page.evaluate(() => {
    const m = document.querySelector('.mach-guide-menu'); const b = m.getBoundingClientRect(); const items = [...m.querySelectorAll('button')]
    const last = items[items.length - 1]; m.scrollTop = m.scrollHeight; const lr = last.getBoundingClientRect()
    const top = document.elementFromPoint(lr.x + lr.width / 2, lr.y + lr.height / 2)
    const fonts = [...m.querySelectorAll('button,small,p')].map((e) => parseFloat(getComputedStyle(e).fontSize))
    return { box: { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }, scrollH: m.scrollHeight, clientH: m.clientHeight, overflowY: getComputedStyle(m).overflowY, lastLabel: last.textContent.trim().slice(0, 30), lastReachable: (top === last || last.contains(top)) && lr.bottom <= innerHeight + 1 && lr.top >= -1, minHeight: Math.min(...items.map((e) => Math.round(e.getBoundingClientRect().height))), minFont: Math.min(...fonts), insideViewport: b.x >= -1 && b.y >= -1 && b.right <= innerWidth + 1 && b.bottom <= innerHeight + 1, vw: innerWidth, vh: innerHeight }
  })
  const issues = []
  if (!menu.lastReachable) issues.push(`3:last-menu-item-unreachable(${menu.lastLabel})`)
  if (!menu.insideViewport) issues.push('3:menu-outside-viewport')
  if (touch && menu.minHeight < 44) issues.push(`4:menu-item-height ${menu.minHeight}<44`)
  if (touch && menu.minFont < 16) issues.push(`4:menu-font ${menu.minFont}<16`)
  results.push({ id: 'menu', presenter: 'menu', ...menu, issues })
  await page.evaluate(() => { document.querySelector('.mach-guide-menu').scrollTop = 0 })
  await shot('menu')
  console.log('menu', issues.length ? `ISSUES ${issues.join(' | ')}` : 'ok', JSON.stringify(menu.box), `scroll ${menu.scrollH}/${menu.clientH}`)
} catch (error) { console.log('STATES FAILED', error.message); await shot('zz-failure'); results.push({ id: 'states', failure: error.message }) }
const reloaded = !(await page.evaluate(() => window.__qaMarker === true).catch(() => false))
writeFileSync(`${dir}/result.json`, JSON.stringify({ tag, reloaded, width, height, touch, reduced, zoom, textOnly, viewport: { w: Math.round(width / zoom), h: Math.round(height / zoom), dpr: zoom }, errors, summary: { states: results.length, withIssues: results.filter((r) => r.issues?.length).length, failures: results.filter((r) => r.failure).length }, results }, null, 1))
console.log('done', tag, 'errors', JSON.stringify(errors.slice(0, 4)), reloaded ? 'RELOADED' : '')
await browser.close()
if (reloaded) process.exit(3)
if (errors.length || results.some(r => r.failure || r.issues?.length)) process.exitCode = 1
