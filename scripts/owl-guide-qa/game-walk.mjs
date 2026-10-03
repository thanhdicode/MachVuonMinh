// Usage: node scripts/owl-guide-qa/game-walk.mjs [--via module|f04] [--width 1440] [--height 900] [--touch] [--reduced] [--tag name]
// Walks the ten game-guide steps inside the real game iframe, performs the jump/duck practice for real, and records
// per-step evidence in the same shape as walk.mjs (walk/<tag>/result.json + one screenshot per step).
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { openApp, wait, OUT, ROOT, unlockIntro } from './app.mjs'
import { MODULE_STEP_IDS } from '../../src/onboarding/guideIds.ts'

const arg = (name, def) => { const i = process.argv.indexOf(`--${name}`); return i < 0 ? def : (process.argv[i + 1]?.startsWith('--') || i + 1 >= process.argv.length ? true : process.argv[i + 1]) }
const via = arg('via', 'module'), width = Number(arg('width', 1440)), height = Number(arg('height', 900))
const touch = arg('touch', false) === true, reduced = arg('reduced', false) === true
const tag = arg('tag', `game-${via === 'f04' ? 'via-f04-' : ''}${width}x${height}${touch ? '-touch' : ''}${reduced ? '-reduced' : ''}`)
const dir = `${OUT}/walk/${tag}`; mkdirSync(dir, { recursive: true })
const copy = JSON.parse(readFileSync(`${ROOT}src/onboarding/guideCopy.json`, 'utf8')).steps
const copyOf = Object.fromEntries(copy.map((s) => [s.id, s]))
const IDS = MODULE_STEP_IDS.game
const WIRING = { [IDS[0]]: 'game-start', G02: 'game-jump', G03: 'game-duck', G04: 'game-pause', G05: 'game-hud', G06: 'game-hearts', G07: 'game-quiz-help', G08: 'game-boss-help', G09: 'game-next-retry-help', G10: 'game-guide-replay' }

const seed = via === 'f04' || via === 'finale'
  ? { schemaVersion: 2, status: 'in-progress', route: via === 'finale' ? 'finale' : 'full', moduleId: 'finale', stepId: 'F04', completedStepIds: ['F01', 'F02', 'F03'], completedModules: [], skippedStepIds: [], skippedModuleIds: [], lastExit: 'close' }
  : { schemaVersion: 2, status: 'dismissed', route: null, moduleId: null, stepId: null, completedStepIds: [], completedModules: [], skippedStepIds: [], skippedModuleIds: [], lastExit: null }
const { browser, page, errors } = await openApp({ width, height, touch, reduced, storage: { 'mach-vuon-minh:guide:v2': JSON.stringify(seed) } })
const progress = () => page.evaluate(() => JSON.parse(localStorage.getItem('mach-vuon-minh:guide:v2') || 'null'))
const shot = (name) => page.screenshot({ path: `${dir}/${name}.png` }).catch(() => {})
const frame = async () => { for (let i = 0; i < 120; i += 1) { const f = page.frames().find((fr) => fr !== page.mainFrame() && fr.url() === 'about:srcdoc'); if (f) return f; await wait(500) } return null }
const parentState = () => page.evaluate(() => ({ dialogOpen: !!document.querySelector('dialog.mini-game-dialog[open]'), scrollY: Math.round(scrollY), body: document.body.className, parentSkip: [...document.querySelectorAll('.mini-game-skip')].map((b) => b.textContent.trim()), focus: document.activeElement?.className || document.activeElement?.tagName || null }))

const sampleFrame = (f, target) => f.evaluate((targetName) => {
  const box = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } }
  const visible = (e) => { const b = e.getBoundingClientRect(); const s = getComputedStyle(e); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
  const title = document.querySelector('.mach-title')
  const inner = title?.closest('.mach-inner') ?? null
  const skip = inner?.querySelector('.mach-btn.is-skip') ?? null
  let skipCovered = null, skipOk = false
  if (skip) {
    const b = skip.getBoundingClientRect(), top = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2)
    skipOk = !skip.disabled && b.width > 0 && b.height > 0 && b.bottom <= innerHeight + 1 && b.top >= -1 && b.left >= -1 && b.right <= innerWidth + 1
    skipCovered = top && !(top === skip || skip.contains(top)) ? String(top.className || top.tagName) : null
  }
  const target = [...document.querySelectorAll(`[data-guide~="${targetName}"]`)].find(visible) ?? null
  const primary = inner?.querySelector('.mach-btn.is-primary, .driver-popover-next-btn') ?? null
  return {
    title: title?.textContent ?? null, counter: inner?.querySelector('.mach-eyebrow')?.textContent ?? null, text: inner?.querySelector('.mach-say')?.textContent ?? null,
    note: inner?.querySelector('.mach-note')?.textContent ?? null, next: primary?.textContent ?? null, skip: skipOk, skipCovered, inner: box(inner), target: box(target),
    owl: inner?.querySelector('.mach-art img')?.getAttribute('src')?.split('/').pop() ?? null, vw: innerWidth, vh: innerHeight,
    presenter: document.querySelector('.driver-popover') ? 'driver' : inner ? 'cue' : null,
    leftovers: document.querySelectorAll('.driver-overlay').length > 1 || document.querySelectorAll('.driver-popover').length > 1,
    mode: document.querySelector('.game-panel')?.dataset.mode ?? null,
  }
}, target).catch(() => null)

const overlap = (a, b) => { if (!a || !b) return null; const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y); return w > 0 && h > 0 ? w * h : 0 }
const results = []
const log = (...a) => console.log(...a)

try {
  await unlockIntro(page); await wait(1500)
  await page.click('.mach-guide-dock__button'); await page.waitForSelector('.mach-guide-menu', { timeout: 20000 })
  if (via === 'f04' || via === 'finale') {
    await page.evaluate(() => [...document.querySelectorAll('.mach-guide-menu__item--primary')].find((b) => b.textContent.includes('Tiếp tục')).click())
    await page.waitForSelector('.driver-popover-next-btn', { timeout: 60000 })
    await wait(1500); await shot('00-F04-offer')
    results.push({ n: -1, id: 'F04:offer', presenter: 'driver', next: await page.$eval('.driver-popover-next-btn', (b) => b.textContent), progress: await progress() })
    await page.click('.driver-popover-next-btn')
  } else {
    await page.evaluate(() => [...document.querySelectorAll('.mach-guide-menu__modules button')].find((b) => b.textContent.includes('Minigame')).click())
  }
  const f = await frame(); if (!f) throw new Error('no game iframe appeared')
  results.push({ n: -1, id: 'GAME:opened', progress: await progress(), parent: await parentState() })

  for (const [n, id] of IDS.entries()) {
    const c = copyOf[id]
    let s = null
    for (let i = 0; i < 150; i += 1) {
      const p = await progress(); s = await sampleFrame(f, WIRING[id])
      if (p?.stepId === id && s?.title === c.title) break
      s = null; await wait(600)
    }
    if (!s) { await shot(`zz-${n}-${id}-timeout`); results.push({ n, id, failure: 'step never settled', progress: await progress() }); break }
    await wait(1200)
    s = await sampleFrame(f, WIRING[id]) ?? s
    const variants = [c.say, ...(c.variants ?? []).map((v) => v.say)]
    const rec = {
      n, id, presenter: s.presenter, kind: copy.find((x) => x.id === id)?.kind ?? null, title: s.title, counter: s.counter, owl: s.owl, next: s.next, note: s.note,
      titleOk: s.title === c.title, textOk: variants.some((t) => (s.text ?? '').startsWith(t)), skipVisible: s.skip, skipCovered: s.skipCovered,
      popoverInViewport: s.inner ? s.inner.x >= 0 && s.inner.y >= 0 && s.inner.x + s.inner.w <= s.vw && s.inner.y + s.inner.h <= s.vh : null,
      overlapArea: overlap(s.inner, s.target), targetBox: s.target, popBox: s.inner, cueBox: null, leftovers: s.leftovers, mode: s.mode, errors: errors.length,
    }
    await shot(`${String(n).padStart(2, '0')}-${id}`)
    if (id === 'G02' || id === 'G03') {
      const jump = id === 'G02'
      if (touch) { const el = await f.$(jump ? '#jumpButton' : '#duckButton'); await el.click({ delay: jump ? 60 : 450 }) }
      else {
        await f.evaluate(() => { window.focus(); document.body.focus?.() })
        if (jump) await page.keyboard.press('ArrowUp')
        else { await page.keyboard.down('ArrowDown'); await wait(450); await page.keyboard.up('ArrowDown') }
      }
      for (let i = 0; i < 40; i += 1) { await wait(250); const v = await f.evaluate(() => document.querySelector('.mach-btn.is-primary')?.classList.contains('is-verified') ?? false).catch(() => false); if (v) { rec.practiceVerified = true; break } }
      rec.practiceVerified ??= false
      await shot(`${String(n).padStart(2, '0')}-${id}-verified`)
    }
    results.push(rec)
    log(n, id, rec.presenter, rec.counter, 'title', rec.titleOk, 'text', rec.textOk, 'skip', rec.skipVisible, rec.skipCovered ?? '', 'ovl', rec.overlapArea, 'inVP', rec.popoverInViewport, 'verified', rec.practiceVerified ?? '')
    const before = (await progress())?.stepId
    const clicked = await f.evaluate(() => { const b = document.querySelector('.mach-title')?.closest('.mach-inner')?.querySelector('.mach-btn.is-primary, .driver-popover-next-btn'); if (!b) return false; b.click(); return true })
    if (!clicked) { results.push({ n, id, failure: 'no primary button' }); break }
    if (n === IDS.length - 1) break
    for (let i = 0; i < 100; i += 1) { await wait(400); const q = await progress(); if (q?.stepId !== before) break }
  }

  await wait(2500)
  const end = { n: IDS.length, id: 'END', progress: await progress(), parent: await parentState(), leftovers: null }
  const f2 = await frame()
  end.leftovers = f2 ? await f2.evaluate(() => document.querySelectorAll('.driver-overlay, .driver-popover, .mach-card, .mach-ring, [class*="mach-cue"]').length).catch(() => null) : null
  await shot('zz-end')
  results.push(end)
  log('END', JSON.stringify({ status: end.progress?.status, modules: end.progress?.completedModules, leftovers: end.leftovers, dialog: end.parent.dialogOpen }))
  await page.click('.mini-game-toolbar button[aria-label^="Đóng mini game"]').catch(() => {})
  await wait(2500)
  const closed = { n: IDS.length + 1, id: 'CLOSED', parent: await parentState(), progress: await progress() }
  if (via === 'finale' && closed.parent.scrollY > 1) closed.failure = 'finale module caller position was overwritten on dialog close'
  results.push(closed); log('CLOSED', JSON.stringify(closed.parent))
} catch (e) { results.push({ id: 'ERROR', failure: e.message }); log('FAILED', e.message) }
writeFileSync(`${dir}/result.json`, JSON.stringify({ tag, moduleId: 'game', via, width, height, touch, reduced, textScale: 1, errors, results }, null, 1))
log('errors', errors.length, JSON.stringify(errors.slice(0, 4)))
await browser.close()
if (errors.length || results.some(r => r.failure || r.titleOk === false || r.textOk === false || r.skipVisible === false || r.skipCovered || r.popoverInViewport === false || r.practiceVerified === false || r.leftovers)) process.exitCode = 1
