import { launch } from './browser.mjs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
export const wait = (ms) => new Promise((r) => setTimeout(r, ms))
export const ROOT = fileURLToPath(new URL('../..', import.meta.url))
export const OUT = join(ROOT, '.studio', 'qa', 'owl-guide')
export async function openApp({ width = 1440, height = 900, touch = false, reduced = false, scale = 1, timeoutScale = 8, url = process.env.QA_URL || 'http://127.0.0.1:5173/', storage = {}, textScale = 1, blockVendor = false, fresh = true } = {}) {
  const session = await launch({ width, height, touch, scale })
  const { page } = session
  if (reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.evaluateOnNewDocument((ts, seed, clear) => {
    window.__machGuideTimeoutScale = ts
    try { if (clear && !sessionStorage.getItem('qa-seeded')) { localStorage.clear(); for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v); sessionStorage.setItem('qa-seeded', '1') } } catch {}
  }, timeoutScale, storage, fresh)
  if (blockVendor) { await page.setRequestInterception(true); page.on('request', (r) => (r.url().includes('/vendor/driver/') || r.url().includes('guideDriver') ? r.abort() : r.continue())) }
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.thread-handle', { timeout: 60000 })
  if (textScale !== 1) await page.addStyleTag({ content: `html{font-size:${16 * textScale}px !important}` })
  return session
}
export const unlockIntro = async (page) => { await page.focus('.thread-handle'); await page.keyboard.press('Enter'); await page.waitForFunction(() => document.querySelector('.experience')?.classList.contains('unlocked'), { timeout: 60000 }) }
export const state = (page) => page.evaluate(() => ({ cls: document.querySelector('.experience')?.className, scrollY: Math.round(scrollY), popover: !!document.querySelector('.driver-popover'), overlay: !!document.querySelector('.driver-overlay'), cue: document.querySelector('.mach-guide-cue')?.dataset.kind ?? null, welcome: !!document.querySelector('.mach-guide-welcome'), title: document.querySelector('.driver-popover-title')?.textContent ?? document.querySelector('.mach-guide-cue__title')?.textContent ?? null, progress: document.querySelector('.driver-popover-progress-text')?.textContent ?? null, bodyActive: document.body.className }))
export const progressOf = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('mach-vuon-minh:guide:v2') || 'null'))
export const clickText = async (page, selector, text) => { const handle = await page.evaluateHandle((s, t) => [...document.querySelectorAll(s)].find((e) => e.textContent.trim().startsWith(t) && getComputedStyle(e).display !== 'none'), selector, text); const el = handle.asElement(); if (!el) throw new Error(`no ${selector} with text ${text}`); await el.click(); }
