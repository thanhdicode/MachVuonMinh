// Usage: node scripts/owl-guide-qa/resize.mjs [--height 800]
// Starts the Atlas module, shows H02 / H03, then crosses the 899<->900 breakpoint WHILE the step is shown.
// Asserts per crossing: same step id, the visible target re-resolved (rail vs era section), copy variant matches the layout,
// popover inside the viewport and not on its target, no leftover Driver overlay/popover, no console error.
// Writes .studio/qa/owl-guide/responsive/resize/result.json and before/after screenshots; exit code 1 on any failed check.
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { openApp, wait, OUT, ROOT, unlockIntro } from './app.mjs'
const arg = (name, def) => { const i = process.argv.indexOf(`--${name}`); return i < 0 ? def : process.argv[i + 1] }
const height = Number(arg('height', 800))
const dir = `${OUT}/responsive/resize`; mkdirSync(dir, { recursive: true })
const copy = Object.fromEntries(JSON.parse(readFileSync(`${ROOT}src/onboarding/guideCopy.json`, 'utf8')).steps.map((s) => [s.id, s]))
const seed = { 'mach-vuon-minh:guide:v2': JSON.stringify({ schemaVersion: 2, status: 'dismissed', route: null, moduleId: null, stepId: null, completedStepIds: [], completedModules: [], skippedStepIds: [], skippedModuleIds: [], lastExit: null }) }
const checks = []

const snap = (page) => page.evaluate(() => {
  const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } }
  const pop = document.querySelector('.driver-popover.mach-guide'), cue = document.querySelector('.mach-guide-cue'), target = document.querySelector('.driver-active-element')
  const history = document.querySelector('.history-bridge'), p = JSON.parse(localStorage.getItem('mach-vuon-minh:guide:v2') || 'null')
  const eraSection = target?.closest('[data-label-era]')
  return {
    stepId: p?.stepId ?? null, status: p?.status ?? null, presenter: pop ? 'driver' : cue ? 'cue' : null, cueKind: cue?.dataset.kind ?? null,
    title: pop?.querySelector('.driver-popover-title')?.textContent ?? cue?.querySelector('.mach-guide-cue__title')?.textContent ?? null,
    text: pop?.querySelector('.driver-popover-description')?.textContent ?? cue?.querySelector('.mach-guide-cue__text')?.textContent ?? null,
    counter: pop?.querySelector('.driver-popover-progress-text')?.textContent ?? null,
    pop: r(pop), cue: r(cue), target: r(target),
    targetInfo: target ? { tag: target.tagName.toLowerCase(), cls: String(target.className).split(' ')[0], guide: target.getAttribute('data-guide'), shown: target.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }), era: target.dataset.railEra ?? target.dataset.labelEra ?? eraSection?.dataset.labelEra ?? null } : null,
    popovers: document.querySelectorAll('.driver-popover').length, overlays: document.querySelectorAll('.driver-overlay').length, stages: document.querySelectorAll('.driver-active-element').length,
    vw: innerWidth, vh: innerHeight, scrollY: Math.round(scrollY), layout: history?.dataset.layout ?? null, activeEra: history?.dataset.activeEra ?? null,
    bridge: r(history), body: document.body.className,
  }
})
const key = (s) => JSON.stringify([s.stepId, s.presenter, s.pop, s.target, s.title, s.text])
async function settled(page, stepId, timeout = 90000) {
  const t0 = Date.now(); let last = '', stable = 0, s
  while (Date.now() - t0 < timeout) {
    s = await snap(page).catch(() => null)
    if (s && s.stepId === stepId && s.presenter === 'driver' && s.pop && s.target) { stable = key(s) === last ? stable + 1 : 0; last = key(s); if (stable >= 4) return s } else { stable = 0; last = '' }
    await wait(350)
  }
  return s ? { ...s, notSettled: true } : null
}
const overlap = (a, b, pad = 8) => { if (!a || !b) return 0; const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w + pad) - Math.max(a.x, b.x - pad)), y = Math.max(0, Math.min(a.y + a.h, b.y + b.h + pad) - Math.max(a.y, b.y - pad)); return x * y }

function verify(name, stepId, width, before, after, errorsBefore, errors) {
  const staticLayout = width < 900
  const c = copy[stepId]
  const expectedText = (staticLayout ? c.variants?.find((v) => v.when === 'history-static')?.say : null) ?? c.say
  const expectEra = stepId === 'H02' ? '1' : null
  const add = (what, ok, detail) => checks.push({ case: name, step: stepId, width, check: what, ok: !!ok, detail })
  add('settled after resize', after && !after.notSettled, after ? (after.notSettled ? 'timed out waiting for a stable popover' : 'stable') : 'no snapshot')
  if (!after) return
  add('same step id kept', after.stepId === before.stepId && after.title === before.title, `${before.stepId} -> ${after.stepId}; title ${JSON.stringify(after.title)}`)
  add('layout flag matches width', staticLayout ? after.layout !== 'horizontal' : after.layout === 'horizontal', `data-layout=${after.layout} at ${after.vw}px`)
  add('target is the visible node of this layout', after.targetInfo?.shown && (stepId === 'H02' ? (staticLayout ? after.targetInfo.cls === 'history-mobile-copy' : after.targetInfo.cls === 'history-progress-rail') : true), JSON.stringify(after.targetInfo))
  if (staticLayout && after.targetInfo?.cls === 'history-mobile-copy' && expectEra) add('static target belongs to the right era section', String(after.targetInfo.era) === expectEra, `era ${after.targetInfo.era}`)
  if (stepId === 'H03') add('target is arrows (wide) / era copy (narrow)', after.targetInfo?.shown && (staticLayout ? after.targetInfo.cls === 'history-mobile-copy' : after.targetInfo.cls !== 'history-mobile-copy'), JSON.stringify(after.targetInfo))
  add('copy variant matches layout', (after.text ?? '').startsWith(expectedText), `${staticLayout ? 'static' : 'base'} variant ${(after.text ?? '').slice(0, 50)}…`)
  add('popover inside viewport', after.pop && after.pop.x >= 0 && after.pop.y >= 0 && after.pop.x + after.pop.w <= after.vw && after.pop.y + after.pop.h <= after.vh, JSON.stringify(after.pop))
  const o = overlap(after.pop, after.target)
  add('popover not on its target', o === 0 || (after.target && after.target.w * after.target.h > after.vw * after.vh * 0.5), `overlap ${o}px2 target ${JSON.stringify(after.target)}`)
  add('single popover/overlay (no leftovers)', after.popovers === 1 && after.overlays <= 1 && after.stages <= 1, `popovers ${after.popovers} overlays ${after.overlays} stages ${after.stages}`)
  add('history still on screen', after.bridge && after.bridge.y < after.vh && after.bridge.y + after.bridge.h > 0, `bridge ${JSON.stringify(after.bridge)} scrollY ${before.scrollY} -> ${after.scrollY}`)
  add('no new console errors', errors.length === errorsBefore, errors.slice(errorsBefore).join(' | ') || 'none')
}

async function openHistory(page) {
  await unlockIntro(page); await wait(1500)
  await page.click('.mach-guide-dock__button')
  await page.waitForSelector('.mach-guide-menu', { timeout: 20000 })
  await page.evaluate(() => { [...document.querySelectorAll('.mach-guide-menu__modules button')].find((b) => b.textContent.includes('Atlas lịch sử')).click() })
}
async function advance(page, from, to) {
  const s = await settled(page, from)
  if (!s || s.notSettled) throw new Error(`step ${from} did not settle`)
  await (await page.$('.driver-popover-next-btn')).click()
  const t = await settled(page, to)
  if (!t || t.notSettled) throw new Error(`step ${to} did not settle`)
  return t
}
async function cross(page, errors, name, stepId, toWidth) {
  const before = await settled(page, stepId)
  const errorsBefore = errors.length
  await page.screenshot({ path: `${dir}/${name}-before.png` }).catch(() => {})
  await page.setViewport({ width: toWidth, height, deviceScaleFactor: 1 })
  await wait(400)
  const after = await settled(page, stepId)
  await page.screenshot({ path: `${dir}/${name}-after.png` }).catch(() => {})
  verify(name, stepId, toWidth, before, after, errorsBefore, errors)
  console.log(name, stepId, `${before?.vw}->${after?.vw}`, 'checks', checks.filter((c) => c.case === name).map((c) => (c.ok ? '+' : `-${c.check}`)).join(' '))
  return after
}

for (const [startWidth, other] of [[900, 899], [899, 900]]) {
  const { browser, page, errors } = await openApp({ width: startWidth, height, storage: seed })
  try {
    await openHistory(page)
    await advance(page, 'H01', 'H02')
    await cross(page, errors, `${startWidth}to${other}-H02`, 'H02', other)
    await advance(page, 'H02', 'H03')
    await cross(page, errors, `${other}to${startWidth}-H03`, 'H03', startWidth)
    // And once more in the opposite direction on the same step, then walk Back/Next to prove the guide is still driveable.
    await cross(page, errors, `${startWidth}to${other}-H03-again`, 'H03', other)
    const next = await advance(page, 'H03', 'H04')
    checks.push({ case: `${startWidth}-flow`, step: 'H04', width: other, check: 'Next still works after crossings', ok: next.stepId === 'H04', detail: next.title })
  } catch (error) {
    checks.push({ case: `${startWidth}-flow`, step: '-', width: startWidth, check: 'scenario ran', ok: false, detail: error.message })
    await page.screenshot({ path: `${dir}/failure-${startWidth}.png` }).catch(() => {})
  }
  const leftovers = await page.evaluate(() => ({ overlays: document.querySelectorAll('.driver-overlay').length, popovers: document.querySelectorAll('.driver-popover').length })).catch(() => null)
  checks.push({ case: `${startWidth}-flow`, step: '-', width: other, check: 'console clean for the whole session', ok: errors.length === 0, detail: errors.slice(0, 3).join(' | ') || 'none' })
  console.log(`session ${startWidth}`, 'errors', errors.length, JSON.stringify(leftovers))
  await browser.close()
}
const failed = checks.filter((c) => !c.ok)
writeFileSync(`${dir}/result.json`, JSON.stringify({ height, total: checks.length, failed: failed.length, checks }, null, 1))
console.log('done', `${checks.length - failed.length}/${checks.length} checks passed`)
for (const f of failed) console.log('FAIL', f.case, f.step, f.check, '-', String(f.detail).slice(0, 200))
process.exit(failed.length ? 1 : 0)
