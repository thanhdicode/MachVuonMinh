// Shared helpers for the lifecycle / persistence / failure-mode scenarios of the Cú Mạch guide.
// Every scenario prints PASS/FAIL lines with evidence, saves screenshots and a result.json under
// .studio/qa/owl-guide/lifecycle/<scenario>/ and exits non-zero when something failed.
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { launch } from '../browser.mjs'

export const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
export const LIFE = `${ROOT}.studio/qa/owl-guide/lifecycle`
export const KEY = 'mach-vuon-minh:guide:v2'
export const LEGACY = 'mach-vuon-minh:guide:v1'
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const seedProgress = (patch = {}) => JSON.stringify({
  schemaVersion: 2, status: 'new', route: null, moduleId: null, stepId: null, completedStepIds: [], completedModules: [],
  skippedStepIds: [], skippedModuleIds: [], lastExit: null, ...patch,
})

export function createReport(name) {
  const dir = `${LIFE}/${name}`
  mkdirSync(dir, { recursive: true })
  const results = []
  const check = (id, label, ok, evidence = null) => {
    results.push({ id, label, ok: !!ok, evidence })
    const text = evidence === null ? '' : ` :: ${typeof evidence === 'string' ? evidence : JSON.stringify(evidence)}`.slice(0, 700)
    console.log(`${ok ? 'PASS' : 'FAIL'} [${name}] ${id} ${label}${text}`)
    return !!ok
  }
  const note = (id, text) => { results.push({ id, label: text, ok: null, evidence: 'note' }); console.log(`NOTE [${name}] ${id} ${text}`) }
  const shot = async (page, file) => { try { await page.screenshot({ path: `${dir}/${file}.png` }) } catch (error) { console.log(`shot ${file} failed: ${error.message}`) } }
  const done = () => {
    const failed = results.filter((entry) => entry.ok === false)
    const passed = results.filter((entry) => entry.ok === true)
    writeFileSync(`${dir}/result.json`, JSON.stringify({ name, at: new Date().toISOString(), passed: passed.length, failed: failed.length, results }, null, 1))
    console.log(`SUMMARY [${name}] pass=${passed.length} fail=${failed.length}${failed.length ? ' FAILED: ' + failed.map((entry) => entry.id).join(',') : ''}`)
    if (failed.length) process.exitCode = 1
    return failed.length
  }
  return { dir, results, check, note, shot, done }
}

// Like app.mjs openApp, but exposes a `before(page)` hook that runs before navigation (request interception, init scripts).
export async function openPage({
  width = 1440, height = 900, touch = false, reduced = false, scale = 1, timeoutScale = 8, url = process.env.QA_URL || 'http://127.0.0.1:5173/',
  storage = {}, clear = true, before, textScale = 1, waitHandle = true, args = [],
} = {}) {
  const session = await launch({ width, height, touch, scale, args })
  const { page } = session
  page.setDefaultTimeout(60000)
  if (reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.evaluateOnNewDocument((ts, seed, doClear) => {
    window.__machGuideTimeoutScale = ts
    try {
      if (doClear && !sessionStorage.getItem('qa-seeded')) {
        localStorage.clear()
        for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v)
        sessionStorage.setItem('qa-seeded', '1')
      }
    } catch { /* storage may be blocked on purpose */ }
  }, timeoutScale, storage, clear)
  if (before) await before(page)
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  if (waitHandle) await page.waitForSelector('.thread-handle', { timeout: 120000 })
  if (textScale !== 1) await page.addStyleTag({ content: `html{font-size:${16 * textScale}px !important}` })
  return session
}

export const unlockIntro = async (page) => {
  await page.focus('.thread-handle')
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => document.querySelector('.experience')?.classList.contains('unlocked'), { timeout: 120000, polling: 250 })
}

// One-shot snapshot of everything a lifecycle assertion needs.
export const probe = (page) => page.evaluate((key) => {
  const count = (selector) => document.querySelectorAll(selector).length
  let progress = null
  try { progress = JSON.parse(localStorage.getItem(key)) } catch { progress = 'unreadable' }
  const active = document.activeElement
  const cue = document.querySelector('.mach-guide-cue')
  const popover = document.querySelector('.driver-popover')
  return {
    roots: count('.mach-guide-root'), overlays: count('.driver-overlay'), popovers: count('.driver-popover'), cues: count('.mach-guide-cue'),
    welcome: count('.mach-guide-welcome'), menu: count('.mach-guide-menu'), dock: count('.mach-guide-dock__button'),
    body: document.body.className, scrollY: Math.round(window.scrollY),
    focus: active && active !== document.body ? `${active.tagName.toLowerCase()}.${String(active.className).split(' ')[0]}${active.getAttribute('aria-label') ? `[${active.getAttribute('aria-label')}]` : ''}` : 'body',
    cueKind: cue?.dataset.kind ?? null, cueHost: cue?.dataset.host ?? null,
    title: popover?.querySelector('.driver-popover-title')?.textContent ?? cue?.querySelector('.mach-guide-cue__title')?.textContent ?? null,
    counter: popover?.querySelector('.driver-popover-progress-text')?.textContent ?? cue?.querySelector('.mach-guide-cue__counter')?.textContent ?? null,
    openDialogs: Array.from(document.querySelectorAll('dialog[open]')).map((dialog) => dialog.className),
    activeScene: document.querySelector('.experience')?.className ?? null,
    progress,
  }
}, KEY)

export const progressOf = (page) => page.evaluate((key) => { try { return JSON.parse(localStorage.getItem(key)) } catch { return 'unreadable' } }, KEY)

// Polls real DOM state; never a blind sleep.
export const waitFor = (page, fn, arg, timeout = 120000) => page.waitForFunction(fn, { timeout, polling: 200 }, arg)

export const waitSettled = (page, timeout = 120000) => waitFor(page, () => {
  const popover = document.querySelector('.driver-popover')
  const cue = document.querySelector('.mach-guide-cue')
  if (popover) return document.querySelectorAll('.driver-popover').length >= 1
  return !!cue && cue.dataset.kind !== 'preparing'
}, null, timeout)

export const stepOf = async (page) => (await progressOf(page))?.stepId ?? null

// Click the primary forward control of whichever presenter is on screen.
export async function primary(page) {
  const handle = await page.evaluateHandle(() => document.querySelector('.driver-popover-next-btn')
    ?? document.querySelector('.mach-guide-cue [data-action="practice-done"]')
    ?? document.querySelector('.mach-guide-cue [data-action="next"]'))
  const element = handle.asElement()
  if (!element) return false
  await element.click()
  return true
}

export const clickSkipGuide = (page) => page.evaluate(() => {
  const button = document.querySelector('.mach-guide__btn--skip,[data-action="skip-guide"]')
  if (!button || button.disabled) return false
  button.click()
  return true
})

export const openMenu = async (page) => {
  await page.click('.mach-guide-dock__button')
  await page.waitForSelector('.mach-guide-menu', { timeout: 30000 })
}

export const menuTexts = (page) => page.evaluate(() => Array.from(document.querySelectorAll('.mach-guide-menu button')).map((button) => button.textContent.trim().replace(/\s+/g, ' ')))

export async function clickMenu(page, text) {
  const ok = await page.evaluate((wanted) => {
    const buttons = Array.from(document.querySelectorAll('.mach-guide-menu button'))
    const button = buttons.find((candidate) => candidate.textContent.trim().startsWith(wanted)) ?? buttons.find((candidate) => candidate.textContent.includes(wanted))
    if (!button) return false
    button.click()
    return true
  }, text)
  if (!ok) throw new Error(`menu entry not found: ${text}`)
}

// Errors that are expected because a scenario blocks a request on purpose are filtered by regex.
export const unexpectedErrors = (errors, allow = []) => errors.filter((message) => !allow.some((pattern) => pattern.test(message)))

export const sleepFrames = (page, frames = 2) => page.evaluate((n) => new Promise((resolve) => { let left = n; const tick = () => { left -= 1; left <= 0 ? resolve() : requestAnimationFrame(tick) }; requestAnimationFrame(tick) }), frames)

// Ensures a scenario can never hang the machine: close the browser on any exit path.
export async function guarded(report, browser, body) {
  try { await body() } catch (error) { report.check('SCRIPT', 'scenario ran to completion', false, String(error?.stack ?? error).slice(0, 500)) } finally { try { await browser.close() } catch { /* already gone */ } }
}

// Exact listener count on window/document straight from DevTools (no page instrumentation).
export async function listenerCounts(page) {
  const client = await page.createCDPSession()
  try {
    const out = {}
    for (const [name, expression] of [['window', 'window'], ['document', 'document'], ['body', 'document.body']]) {
      const { result } = await client.send('Runtime.evaluate', { expression })
      const { listeners } = await client.send('DOMDebugger.getEventListeners', { objectId: result.objectId })
      out[name] = listeners.length
      const byType = {}
      for (const listener of listeners) byType[listener.type] = (byType[listener.type] ?? 0) + 1
      out[`${name}Types`] = byType
    }
    return out
  } finally { await client.detach().catch(() => {}) }
}
