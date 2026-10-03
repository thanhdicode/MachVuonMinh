// Usage: node scripts/owl-guide-qa/matrix-walk.mjs --module lab --width 1440 --height 900 [--touch] [--reduced] [--zoom 2] [--textonly 2] [--tag name] [--max N]
// Responsive/visual variant of walk.mjs: same walk, plus layout metrics per step and an `issues` list (see CLASSES).
// --zoom N     browser zoom emulation: viewport (W/N x H/N CSS px) at devicePixelRatio N. This is what Ctrl/Cmd + does.
// --textonly N text-only scaling of the guide layer (Firefox "zoom text only", Android font scale): viewport unchanged.
// Output: .studio/qa/owl-guide/responsive/<tag>/result.json + one screenshot per step.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { openApp, wait, OUT, ROOT, unlockIntro } from './app.mjs'
import { sampleLayer, classify as classifyLayer, overlapOf } from './layout-probe.mjs'
const arg = (name, def) => { const i = process.argv.indexOf(`--${name}`); return i < 0 ? def : (process.argv[i + 1]?.startsWith('--') || i + 1 >= process.argv.length ? true : process.argv[i + 1]) }
const moduleId = arg('module', 'intro'), width = Number(arg('width', 1440)), height = Number(arg('height', 900)), touch = arg('touch', false) === true
const reduced = arg('reduced', false) === true, zoom = Number(arg('zoom', 1)), textOnly = Number(arg('textonly', 1)), maxSteps = Number(arg('max', 40))
const tag = arg('tag', `${moduleId}-${width}x${height}${touch ? '-touch' : ''}${reduced ? '-reduced' : ''}${zoom !== 1 ? '-zoom' + zoom * 100 : ''}${textOnly !== 1 ? '-text' + textOnly * 100 : ''}`)
const dir = `${OUT}/responsive/${tag}`; mkdirSync(dir, { recursive: true })
const copy = JSON.parse(readFileSync(`${ROOT}src/onboarding/guideCopy.json`, 'utf8')).steps
const copyOf = Object.fromEntries(copy.map((s) => [s.id, s]))
const TITLES = { intro: 'Mở đầu và điều hướng', history: 'Atlas lịch sử', production: 'Công cụ, máy móc và dữ liệu', lab: 'Phòng biện chứng', vietnam: 'Việt Nam và bằng chứng', policy: 'Buồng chính sách', finale: 'Kết thúc triển lãm', game: 'Minigame' }
const { browser, page, errors } = await openApp({ width: Math.round(width / zoom), height: Math.round(height / zoom), scale: zoom, touch, reduced, storage: { 'mach-vuon-minh:guide:v2': JSON.stringify({ schemaVersion: 2, status: 'dismissed', route: null, moduleId: null, stepId: null, completedStepIds: [], completedModules: [], skippedStepIds: [], skippedModuleIds: [], lastExit: null }) } })
await page.evaluate(() => { window.__qaMarker = true })
const wiring = Object.fromEntries([...readFileSync(`${ROOT}src/onboarding/guideCatalog.ts`, 'utf8').matchAll(/^\s{2}(\w+): w\(([^,]+), '([a-z0-9-]+)'/gm)].map((m) => [m[1], m[3]]))

if (textOnly !== 1) {
  await page.evaluate((factor) => {
    const scaled = new WeakSet()
    const roots = ['.mach-guide-root', '.driver-popover', '.mach-guide-cue', '.mach-guide-welcome', '.mach-guide-menu']
    const scale = () => {
      const nodes = [...document.querySelectorAll(roots.flatMap((s) => [s, `${s} *`]).join(','))].filter((n) => !scaled.has(n))
      const sizes = nodes.map((n) => parseFloat(getComputedStyle(n).fontSize))
      nodes.forEach((n, i) => { scaled.add(n); n.style.setProperty('font-size', `${sizes[i] * factor}px`, 'important') })
    }
    new MutationObserver(scale).observe(document.documentElement, { childList: true, subtree: true })
    scale()
  }, textOnly)
}

const probeTarget = (name) => page.evaluate((name) => [...document.querySelectorAll(`[data-guide~="${name}"]`)].map((e) => { const b = e.getBoundingClientRect(); return { tag: e.tagName, cls: String(e.className).slice(0, 40), x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), cv: e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }), disp: getComputedStyle(e).display, vis: getComputedStyle(e).visibility, op: getComputedStyle(e).opacity, era: e.dataset.railEra ?? e.dataset.labelEra ?? null } }), name)
const results = []
const progress = () => page.evaluate(() => JSON.parse(localStorage.getItem('mach-vuon-minh:guide:v2') || 'null'))
const shot = (name) => page.screenshot({ path: `${dir}/${name}.png` }).catch(() => {})

const sample = (targetName) => sampleLayer(page, targetName)
let lastSeen = null, reloaded = false
async function settle(targetName, timeout = 90000) {
  const t0 = Date.now(); let last = '', stable = 0
  while (Date.now() - t0 < timeout) {
    const s = await sample(targetName).catch(() => null)
    if (s && !s.marker) { reloaded = true; return null }
    if (s) lastSeen = { presenter: s.presenter, kind: s.kind, title: s.title, scrollY: s.scrollY, body: s.body, popovers: s.popovers, overlays: s.overlays, progress: undefined }
    if (s && (s.presenter === 'driver' || (s.presenter === 'cue' && s.kind !== 'preparing'))) { const key = JSON.stringify([s.pop, s.cue, s.target, s.title]); stable = key === last ? stable + 1 : 0; last = key; if (stable >= 3) return s } else { stable = 0; last = '' }
    await wait(350)
  }
  return null
}
const classify = (rec, s) => classifyLayer(rec, s, { baseDocW, touch })
const act = {
  I02: async () => { const h = await (await page.$('.thread-handle'))?.boundingBox(), e = await (await page.$('.eyelet-target'))?.boundingBox(); if (!h || !e) return; await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2); await page.mouse.down(); await page.mouse.move(e.x + e.width / 2, e.y + e.height / 2, { steps: 15 }); await page.mouse.up() },
  T03: async () => { await page.focus('#automation'); await page.keyboard.press('ArrowRight') },
  H02: async () => { await page.click('[data-rail-era="1"]').catch(() => {}) },
  H03: async () => { await page.click('button[aria-label="Thời kỳ tiếp theo"]').catch(() => {}) },
  H05: async () => { await page.click('.history-sound').catch(() => {}) },
  L12: async () => { await page.click('[data-guide="lab-preset-fit"]').catch(() => {}) },
  L13: async () => { await page.click('[data-guide="lab-preset-ahead"]').catch(() => {}) },
  L14: async () => { await page.click('[data-guide="lab-preset-rigid"]').catch(() => {}) },
  L15: async () => { await page.click('[data-guide="lab-preset-adapt"]').catch(() => {}) },
  V02: async () => { await page.click('[data-guide="farm-before"]').catch(() => {}) },
  V03: async () => { await page.click('[data-guide="farm-after"]').catch(() => {}) },
  V04: async () => { await page.click('[data-guide="farm-cooperation"]').catch(() => {}) },
  V06: async () => { await page.click('[data-guide="relation-ownership"]').catch(() => {}) },
  V07: async () => { await page.click('[data-guide="relation-organization"]').catch(() => {}) },
  V08: async () => { await page.click('[data-guide="relation-distribution"]').catch(() => {}) },
  P01: async () => { await page.click('[data-guide="policy-skills"]').catch(() => {}) },
  P09: async () => { await page.click('[data-guide="policy-data-rights"]').catch(() => {}); await page.click('[data-guide="policy-sandbox"]').catch(() => {}) },
  P11: async () => { await page.click('.policy-socket.filled').catch(() => {}) },
}
for (const id of ['L02', 'L03', 'L04', 'L05', 'L06', 'L08', 'L09', 'L10']) { const name = { L02: 'technology', L03: 'data', L04: 'skills', L05: 'infrastructure', L06: 'automation', L08: 'ownership', L09: 'organization', L10: 'distribution' }[id]; act[id] = async () => { await page.focus(`[data-guide="lab-${name}"] input`).catch(() => {}); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight') } }

let baseDocW = 0
try {
  await unlockIntro(page)
  await wait(1500)
  baseDocW = await page.evaluate(() => document.documentElement.scrollWidth)
  await page.click('.mach-guide-dock__button')
  await page.waitForSelector('.mach-guide-menu', { timeout: 20000 })
  await page.evaluate((title) => { [...document.querySelectorAll('.mach-guide-menu__modules button')].find((b) => b.textContent.includes(title)).click() }, TITLES[moduleId])
  let n = 0
  while (n < maxSteps) {
    const peek = (await progress())?.stepId
    let s = await settle(wiring[peek] ?? null)
    if (s) { await wait(700); s = (await sample(wiring[peek] ?? null).catch(() => null)) ?? s }
    const p = await progress()
    const id = p?.stepId
    if (!s || !id) { await shot(`zz-${n}-nostate`); results.push({ n, id, failure: 'no settled state', lastSeen, progress: p }); break }
    const c = copyOf[id]
    const variants = [{ key: 'base', say: c.say }, ...(c.variants ?? []).map((v) => ({ key: v.when, say: v.say }))]
    const matched = variants.find((v) => (s.text ?? '').startsWith(v.say))
    const rec = { n, id, presenter: s.presenter, kind: s.kind, host: s.host, anchor: s.anchor, title: s.title, counter: s.counter, owl: s.owl, next: s.next, scrollY: s.scrollY,
      titleOk: s.title === c.title, textOk: !!matched, variant: matched?.key ?? null, skipVisible: s.skip, skipCovered: s.skipCovered,
      popoverInViewport: s.pop ? s.pop.x >= 0 && s.pop.y >= 0 && s.pop.x + s.pop.w <= s.vw && s.pop.y + s.pop.h <= s.vh : null,
      overlapArea: s.presenter === 'driver' ? overlapOf(s.pop, s.target) : null, targetBox: s.target, targetInfo: s.targetInfo, popBox: s.pop, cueBox: s.cue, layer: s.layer,
      historyLayout: s.historyLayout, activeEra: s.activeEra, covered: s.covered, targets: s.presenter === 'cue' ? s.targets : undefined, vp: { w: s.vw, h: s.vh }, leftovers: s.overlays > 1 || s.popovers > 1, errors: errors.length }
    rec.issues = classify(rec, s)
    await shot(`${String(n).padStart(2, '0')}-${id}`)
    if (act[id]) { await act[id](); await wait(1800); const after = await sample(null); rec.signaledAfterAction = after.signaled; rec.afterBody = after.body }
    if (s.kind === 'missing-target') rec.probe = await probeTarget(wiring[id] ?? '')
    results.push(rec)
    console.log(rec.n, id, rec.presenter, rec.kind ?? '', rec.counter, rec.variant, rec.issues.length ? `ISSUES ${rec.issues.map((i) => i.slice(0, 90)).join(' | ')}` : 'ok')
    const before = (await progress())?.stepId
    // This walker covers the exhibit route; game-walk separately verifies the F04 handoff and all ten iframe steps.
    const btn = (id === 'F04' ? await page.$('[data-action="skip-game"]') : null) ?? (await page.$('.driver-popover-next-btn')) ?? (await page.$('.mach-guide-cue [data-action="practice-done"]')) ?? (await page.$('.mach-guide-cue [data-action="next"]'))
    if (!btn) { results.push({ n, id, failure: 'no primary button' }); break }
    await btn.click()
    const t0 = Date.now()
    while (Date.now() - t0 < 90000) { await wait(400); const q = await progress(); const view = await sample(null).catch(() => ({})); if ((q?.stepId !== before) || q?.status === 'completed' || ['module-complete', 'route-complete', 'game-skipped', 'keep-or-restore'].includes(view.kind)) break }
    const after = await sample(null)
    if (after.kind === 'keep-or-restore') { await shot(`${String(n).padStart(2, '0')}-keep-or-restore`); const issues = classify({ titleOk: true, textOk: true }, after); results.push({ n, id: `${id}:keep-or-restore`, presenter: 'cue', kind: after.kind, skipVisible: after.skip, layer: after.layer, issues }); console.log(n, `${id}:keep-or-restore`, issues.length ? `ISSUES ${issues.map((i) => i.slice(0, 90)).join(' | ')}` : 'ok'); await page.click('.mach-guide-cue [data-action="restore"]'); await wait(1500) }
    n += 1
    const end = await sample(null)
    if (end.kind === 'module-complete' || end.kind === 'route-complete' || end.kind === 'game-skipped' || (await progress())?.status === 'completed') {
      await wait(800); await shot('zz-end')
      const issues = classify({ titleOk: true, textOk: true }, end)
      results.push({ n, id: 'END', presenter: end.presenter, kind: end.kind, text: end.text, layer: end.layer, leftovers: end.overlays + end.popovers, body: end.body, issues })
      console.log(n, 'END', end.kind, issues.length ? `ISSUES ${issues.map((i) => i.slice(0, 90)).join(' | ')}` : 'ok')
      break
    }
  }
} catch (error) { results.push({ failure: error.message }); console.log('WALK FAILED', error.message); await shot('zz-failure') }
const walked = results.filter((x) => !x.failure && x.id !== 'END' && !String(x.id).includes(':'))
const summary = { steps: walked.length, withIssues: results.filter((x) => x.issues?.length).length, failures: results.filter((x) => x.failure).length }
writeFileSync(`${dir}/result.json`, JSON.stringify({ tag, reloaded, moduleId, width, height, touch, reduced, zoom, textOnly, viewport: { w: Math.round(width / zoom), h: Math.round(height / zoom), dpr: zoom }, baseDocW, errors, summary, results }, null, 1))
console.log('done', tag, JSON.stringify(summary), 'errors', JSON.stringify(errors.slice(0, 5)))
await browser.close()
if (reloaded) { console.log('RELOADED: the page was reloaded during the walk (Vite HMR full reload after a source edit); results are not trustworthy'); process.exit(3) }
if (summary.failures || summary.withIssues || errors.length) process.exitCode = 1
