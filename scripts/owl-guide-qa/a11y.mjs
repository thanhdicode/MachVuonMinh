// Usage: node scripts/owl-guide-qa/a11y.mjs [--width 1440 --height 900] [--touch] [--tag name]
// Accessibility audit of the Cú Mạch layers in a real browser: roles/names, focus, Tab cycle, Esc layering, focus return,
// computed contrast (>= 4.5:1), touch targets (>= 44px when --touch), reduced-motion (no running animations on the guide layer).
// Writes .studio/qa/owl-guide/responsive/a11y-<tag>/result.json (+ screenshots); exit code 1 when any check fails.
import { mkdirSync, writeFileSync } from 'node:fs'
import { openApp, wait, OUT, unlockIntro } from './app.mjs'
const arg = (name, def) => { const i = process.argv.indexOf(`--${name}`); return i < 0 ? def : (process.argv[i + 1]?.startsWith('--') || i + 1 >= process.argv.length ? true : process.argv[i + 1]) }
const width = Number(arg('width', 1440)), height = Number(arg('height', 900)), touch = arg('touch', false) === true
const tag = arg('tag', `${width}x${height}${touch ? '-touch' : ''}`)
const dir = `${OUT}/responsive/a11y-${tag}`; mkdirSync(dir, { recursive: true })
const STORE = 'mach-vuon-minh:guide:v2'
const dismissed = { [STORE]: JSON.stringify({ schemaVersion: 2, status: 'dismissed', route: null, moduleId: null, stepId: null, completedStepIds: [], completedModules: [], skippedStepIds: [], skippedModuleIds: [], lastExit: null }) }
const results = []
const check = (group, name, ok, detail = '') => { results.push({ group, name, ok: !!ok, detail: String(detail).slice(0, 400) }); console.log(ok ? 'PASS' : 'FAIL', group, '|', name, ok ? '' : `| ${String(detail).slice(0, 220)}`) }
const store = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), STORE)
const shot = (page, name) => page.screenshot({ path: `${dir}/${name}.png` }).catch(() => {})
const until = async (page, fn, arg0, timeout = 60000, label = 'condition') => { try { await page.waitForFunction(fn, { timeout, polling: 250 }, arg0) ; return true } catch { console.log('  (timeout waiting for', label, ')'); return false } }

// In-page audit of one layer: role/name/description, focusables, contrast, sizes. Runs inside the page, returns plain data.
const auditNow = (page, selector) => page.evaluate((selector) => {
  const root = document.querySelector(selector)
  if (!root) return null
  const parse = (c) => { const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[\s,/]+/).filter(Boolean).map((v) => (v.endsWith('%') ? parseFloat(v) / 100 : Number(v))); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 } }
  const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 })
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05) }
  const background = (el) => {
    const stack = []
    for (let n = el; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c.a > 0) stack.push(c); if (c && c.a === 1) break }
    let base = { r: 255, g: 255, b: 255, a: 1 }
    for (const c of stack.reverse()) base = over(c, base)
    return base
  }
  const opacity = (el) => { let o = 1; for (let n = el; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity); return o }
  const text = (ids) => (ids || '').split(/\s+/).filter(Boolean).map((id) => document.getElementById(id)?.textContent?.trim() ?? '').join(' ').trim()
  const shown = (e) => e.checkVisibility?.({ checkOpacity: false, checkVisibilityCSS: true }) ?? true
  const withText = [root, ...root.querySelectorAll('*')].filter((e) => shown(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
  const contrast = withText.map((e) => {
    const cs = getComputedStyle(e), fg = parse(cs.color), bg = background(e)
    if (!fg || (e.matches('button') && e.disabled)) return null
    const eff = over({ ...fg, a: fg.a * opacity(e) }, bg)
    return { el: `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]}`, text: e.textContent.trim().slice(0, 24), ratio: Math.round(ratio(eff, bg) * 100) / 100, size: parseFloat(cs.fontSize) }
  }).filter(Boolean)
  const buttons = [...root.querySelectorAll('button,a[href]')].filter(shown).map((b) => { const r = b.getBoundingClientRect(); return { name: (b.getAttribute('aria-label') || b.textContent || '').trim(), w: Math.round(r.width), h: Math.round(r.height), font: parseFloat(getComputedStyle(b).fontSize) } })
  const focusables = [...root.querySelectorAll('button:not([disabled]),a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(shown)
  return {
    role: root.getAttribute('role'), ariaModal: root.getAttribute('aria-modal'), ariaLabel: root.getAttribute('aria-label'),
    labelledby: root.getAttribute('aria-labelledby'), name: root.getAttribute('aria-label') || text(root.getAttribute('aria-labelledby')),
    describedby: root.getAttribute('aria-describedby'), description: text(root.getAttribute('aria-describedby')),
    contrast, buttons, focusable: focusables.length, anyModal: !!document.querySelector('.mach-guide-root [aria-modal="true"], .driver-popover[aria-modal="true"], [data-guide-cue][aria-modal="true"]'),
  }
}, selector)
// Contrast is only meaningful once the layer's own fade-in is over (opacity is part of the effective colour).
const audit = async (page, selector) => {
  await page.evaluate(() => Promise.allSettled(document.getAnimations().filter((a) => a.effect?.getComputedTiming?.().iterations !== Infinity).map((a) => a.finished)))
  await wait(300)
  return auditNow(page, selector)
}
const active = (page) => page.evaluate(() => { const a = document.activeElement; return a ? { tag: a.tagName.toLowerCase(), cls: String(a.className).split(' ')[0], name: (a.getAttribute('aria-label') || a.textContent || '').trim().slice(0, 40), inPopover: !!a.closest('.driver-popover'), isTarget: !!a.closest('.driver-active-element'), inCue: !!a.closest('[data-guide-cue]'), inWelcome: !!a.closest('.mach-guide-welcome'), inMenu: !!a.closest('.mach-guide-menu'), isLauncher: a.classList.contains('mach-guide-dock__button'), inDialog: !!a.closest('dialog') } : null })
const auditChecks = (group, a, { needsName = true, touchCheck = touch } = {}) => {
  if (!a) { check(group, 'layer present', false, 'selector not found'); return }
  const bad = a.contrast.filter((c) => c.ratio < 4.5)
  check(group, 'contrast >= 4.5:1 for every text element (computed)', bad.length === 0, bad.map((c) => `${c.el} "${c.text}" ${c.ratio}:1 @${c.size}px`).join(' ; '))
  if (needsName) check(group, 'accessible name resolves to non-empty text', a.name.length > 0, `labelledby=${a.labelledby} label=${a.ariaLabel} -> "${a.name}"`)
  check(group, 'not aria-modal (non-modal layer)', a.ariaModal !== 'true' && !a.anyModal, `aria-modal=${a.ariaModal}`)
  if (touchCheck) { const small = a.buttons.filter((b) => Math.min(b.w, b.h) < 44); check(group, 'touch targets >= 44x44', small.length === 0, small.map((b) => `${b.name}:${b.w}x${b.h}`).join(' ; ')) }
}

async function openMenu(page) { await page.click('.mach-guide-dock__button'); await page.waitForSelector('.mach-guide-menu', { timeout: 20000 }) }
async function startModule(page, title) {
  await openMenu(page)
  await page.evaluate((t) => { [...document.querySelectorAll('.mach-guide-menu__modules button')].find((b) => b.textContent.includes(t)).click() }, title)
}
const driverShown = (page, timeout = 90000) => until(page, () => !!document.querySelector('.driver-popover.mach-guide .driver-popover-title') && !document.querySelector('.mach-guide-cue[data-kind="preparing"]'), null, timeout, 'driver popover')
const popoverStable = async (page) => { let last = '', n = 0; for (let i = 0; i < 40 && n < 4; i++) { const k = await page.evaluate(() => JSON.stringify(document.querySelector('.driver-popover.mach-guide')?.getBoundingClientRect())); n = k === last ? n + 1 : 0; last = k; await wait(300) } }

// ---- Session 1: first visit (status new): welcome ----
{
  const { browser, page, errors } = await openApp({ width, height, touch, storage: {} })
  const ok = await until(page, () => !!document.querySelector('.mach-guide-welcome'), null, 60000, 'welcome')
  check('welcome', 'welcome appears for a new visitor', ok)
  if (ok) {
    await wait(500)
    const a = await audit(page, '.mach-guide-welcome')
    check('welcome', 'role=region with aria-labelledby', a?.role === 'region' && !!a.labelledby, `role=${a?.role}`)
    auditChecks('welcome', a)
    const f = await active(page)
    check('welcome', 'focus starts on the primary choice inside the welcome', f?.inWelcome, JSON.stringify(f))
    const skipBox = await page.evaluate(() => { const b = document.querySelector('.mach-guide-welcome .mach-guide__btn--skip'); const r = b?.getBoundingClientRect(); const top = r && document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return r ? { text: b.textContent, ok: top === b || b.contains(top), bottom: Math.round(r.bottom), vh: innerHeight, disabled: b.disabled } : null })
    check('welcome', 'text button "Bỏ qua hướng dẫn" visible, enabled and clickable', skipBox?.ok && !skipBox.disabled && skipBox.text === 'Bỏ qua hướng dẫn', JSON.stringify(skipBox))
    await shot(page, 'welcome')
    await page.keyboard.press('Escape')
    const gone = await until(page, () => !document.querySelector('.mach-guide-welcome'), null, 10000, 'welcome to close')
    const st = await store(page)
    check('esc', 'Esc on the welcome dismisses it (status dismissed, no tour started)', gone && st?.status === 'dismissed' && !(await page.$('.driver-popover')), `status=${st?.status} gone=${gone}`)
    await wait(300)
    const f2 = await active(page)
    check('focus-return', 'focus after dismissing the welcome is on the owl button or the page (not lost in a removed node)', !!f2 && f2.tag !== 'body' ? f2.isLauncher || f2.tag !== 'body' : false, JSON.stringify(f2))
  }
  check('console', 'no console/page errors in the welcome session', errors.length === 0, errors.slice(0, 3).join(' | '))
  await browser.close()
}

// ---- Session 2: dismissed visitor, menu + Driver steps + modal cue ----
{
  const { browser, page, errors } = await openApp({ width, height, touch, storage: dismissed })
  await unlockIntro(page); await wait(1500)
  const dock = await page.evaluate(() => { const b = document.querySelector('.mach-guide-dock__button'); const r = b?.getBoundingClientRect(); return b ? { name: b.getAttribute('aria-label'), w: Math.round(r.width), h: Math.round(r.height), expanded: b.getAttribute('aria-expanded'), controls: b.getAttribute('aria-controls') } : null })
  check('dock', 'launcher name is "Mở hướng dẫn của Cú Mạch"', dock?.name === 'Mở hướng dẫn của Cú Mạch', JSON.stringify(dock))
  check('dock', 'launcher is at least 44x44', dock && dock.w >= 44 && dock.h >= 44, JSON.stringify(dock))
  await openMenu(page); await wait(400)
  const menu = await audit(page, '.mach-guide-menu')
  const menuLinked = await page.evaluate(() => { const b = document.querySelector('.mach-guide-dock__button'); return { expanded: b.getAttribute('aria-expanded'), controlsResolves: !!document.getElementById(b.getAttribute('aria-controls')) } })
  check('menu', 'launcher aria-expanded=true and aria-controls resolves while open', menuLinked.expanded === 'true' && menuLinked.controlsResolves, JSON.stringify(menuLinked))
  auditChecks('menu', menu)
  const menuFocus = await active(page)
  check('menu', 'focus moves into the menu when it opens', menuFocus?.inMenu, JSON.stringify(menuFocus))
  await shot(page, 'menu')
  const reach = await page.evaluate(() => { const m = document.querySelector('.mach-guide-menu'); const last = [...m.querySelectorAll('button')].pop(); last.scrollIntoView({ block: 'nearest' }); const r = last.getBoundingClientRect(); const mr = m.getBoundingClientRect(); return { last: last.textContent.trim().slice(0, 30), inside: r.top >= mr.top - 1 && r.bottom <= mr.bottom + 1 && r.bottom <= innerHeight, scrollable: m.scrollHeight > m.clientHeight } })
  check('menu', 'last menu item reachable (scrolls inside the menu)', reach.inside, JSON.stringify(reach))
  await page.keyboard.press('Escape'); await wait(400)
  const afterEsc = await page.evaluate(() => ({ menu: !!document.querySelector('.mach-guide-menu'), popover: !!document.querySelector('.driver-popover'), active: document.activeElement?.className?.toString().split(' ')[0] }))
  const stMenu = await store(page)
  check('esc', 'Esc with the owl menu open closes the menu only (no tour, status unchanged)', !afterEsc.menu && !afterEsc.popover && stMenu.status === 'dismissed', JSON.stringify(afterEsc))
  check('focus-return', 'focus returns to the owl button after the menu closes', afterEsc.active === 'mach-guide-dock__button', `active=${afterEsc.active}`)

  // Driver step (intro I03).
  await startModule(page, 'Mở đầu và điều hướng')
  await driverShown(page); await popoverStable(page)
  const pop = await audit(page, '.driver-popover.mach-guide')
  check('driver', 'popover has role=dialog', pop?.role === 'dialog', `role=${pop?.role}`)
  check('driver', 'popover aria-labelledby resolves to non-empty text', !!pop?.labelledby && pop.name.length > 0, `labelledby=${pop?.labelledby} -> "${pop?.name}"`)
  check('driver', 'popover aria-describedby resolves to non-empty text', !!pop?.describedby && pop.description.length > 0, `describedby=${pop?.describedby} -> "${pop?.description?.slice(0, 40)}"`)
  auditChecks('driver', pop, { needsName: false })
  const closeBtn = pop?.buttons.find((b) => /^(Close|×|Đóng)/.test(b.name) || b.name === '×')
  check('driver', 'close (x) button has a Vietnamese accessible name', !!closeBtn && /Đóng|Tạm dừng/.test(closeBtn.name), `name=${JSON.stringify(closeBtn?.name)} (Driver default is "Close")`)
  const fd = await active(page)
  check('driver', 'focus is inside the popover on a Driver step', fd?.inPopover, JSON.stringify(fd))
  const cycle = []
  for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); const a = await active(page); cycle.push(`${a?.tag}:${a?.name || a?.cls}${a?.inPopover || a?.isTarget ? '' : '[OUT]'}`) }
  const outside = cycle.filter((c) => c.includes('[OUT]'))
  const distinct = new Set(cycle)
  check('driver', 'Tab cycles inside the popover and its highlighted target (never reaches the page behind)', outside.length === 0 && distinct.size >= 3 && distinct.size < cycle.length, `cycle=${cycle.join(' > ')}`)
  const back = []
  for (let i = 0; i < 3; i++) { await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift'); const a = await active(page); back.push(a?.inPopover || a?.isTarget) }
  check('driver', 'Shift+Tab also stays inside the popover', back.every(Boolean), JSON.stringify(back))
  await shot(page, 'driver-step')
  // Esc on a Driver step => pause (resumable), not skip.
  await page.keyboard.press('Escape'); await wait(600)
  const paused = await page.evaluate(() => ({ popover: !!document.querySelector('.driver-popover'), overlay: !!document.querySelector('.driver-overlay'), cue: document.querySelector('.mach-guide-cue')?.dataset.kind ?? null, body: document.body.className }))
  const stPaused = await store(page)
  check('esc', 'Esc on a Driver step closes the popover and keeps the tour resumable (paused/in-progress)', !paused.popover && !paused.overlay && stPaused.status === 'in-progress', JSON.stringify({ ...paused, status: stPaused.status, step: stPaused.stepId }))
  const fp = await active(page)
  check('focus-return', 'focus after Esc pause is on a guide control (resume button or owl button), not lost on <body>', !!fp && (fp.inCue || fp.isLauncher), JSON.stringify(fp))
  await shot(page, 'paused')
  // Esc closed the guide and kept the exact step; the owl menu resumes it, and the pause button leaves the paused notice.
  await openMenu(page); await wait(300)
  await page.evaluate(() => [...document.querySelectorAll('.mach-guide-menu button')].find((b) => b.textContent.trim().startsWith('Tiếp tục')).click())
  await driverShown(page); await popoverStable(page)
  await page.click('.driver-popover [data-action="pause"]'); await wait(900)
  await shot(page, 'paused')
  const pausedAudit = await audit(page, '.mach-guide-cue')
  auditChecks('cue-paused', pausedAudit)
  check('cue-paused', 'cue is role=region with aria-labelledby', pausedAudit?.role === 'region' && !!pausedAudit.labelledby, `role=${pausedAudit?.role}`)
  // Resume, then Skip via the text button: focus must return to the owl button.
  const resume = await page.$('.mach-guide-cue [data-action="resume"]')
  if (resume) { await resume.click(); await driverShown(page); await popoverStable(page) }
  const skipBtn = await page.$('.driver-popover .mach-guide__btn--skip')
  check('skip', 'text button "Bỏ qua hướng dẫn" is on the Driver popover after resume', !!skipBtn)
  if (skipBtn) {
    await skipBtn.click(); await wait(800)
    const st = await store(page)
    const fs = await active(page)
    check('skip', 'Skip ends the guide at once (status skipped, no popover/overlay)', st.status === 'skipped' && !(await page.$('.driver-popover')) && !(await page.$('.driver-overlay')), `status=${st.status}`)
    check('focus-return', 'focus returns to the owl button after Skip', fs?.isLauncher, JSON.stringify(fs))
    await shot(page, 'after-skip')
  }
  // Modal cue inside a native dialog: I05 (menu settings). Start intro again and advance to I05.
  await startModule(page, 'Mở đầu và điều hướng')
  let reachedModal = false
  for (let i = 0; i < 4 && !reachedModal; i++) {
    await until(page, () => !!document.querySelector('.driver-popover.mach-guide .driver-popover-title') || !!document.querySelector('.mach-guide-cue[data-kind="modal"]'), null, 90000, 'step presenter')
    reachedModal = !!(await page.$('.mach-guide-cue[data-kind="modal"]'))
    if (!reachedModal) { await popoverStable(page); const next = await page.$('.driver-popover-next-btn'); if (!next) break; await next.click(); await wait(800) }
  }
  if (reachedModal) {
    await wait(800)
    const cue = await audit(page, '.mach-guide-cue[data-kind="modal"]')
    const host = await page.evaluate(() => ({ inDialog: !!document.querySelector('dialog[open] .mach-guide-cue'), dialogOpen: !!document.querySelector('dialog[open]'), focusIn: !!document.activeElement?.closest('dialog') }))
    check('modal-cue', 'cue lives inside the open native dialog', host.inDialog && host.dialogOpen, JSON.stringify(host))
    check('modal-cue', 'cue is role=region with aria-labelledby and not aria-modal', cue?.role === 'region' && !!cue.labelledby && cue.ariaModal !== 'true', `role=${cue?.role} modal=${cue?.ariaModal}`)
    auditChecks('modal-cue', cue)
    check('modal-cue', 'focus stays inside the dialog (native dialog manages it)', host.focusIn, JSON.stringify(host))
    await shot(page, 'modal-cue')
    await page.keyboard.press('Escape'); await wait(1200)
    const after = await page.evaluate(() => ({ dialogOpen: !!document.querySelector('dialog[open]'), cueInDialog: !!document.querySelector('dialog .mach-guide-cue'), drawerLock: document.body.classList.contains('drawer-open'), presenter: document.querySelector('.driver-popover') ? 'driver' : document.querySelector('.mach-guide-cue')?.dataset.kind ?? null }))
    check('esc', 'Esc inside a guide-opened native dialog closes that dialog (its own Esc), without leaving the page locked', !after.dialogOpen && !after.cueInDialog && !after.drawerLock, JSON.stringify(after))
    await shot(page, 'modal-after-esc')
  } else check('modal-cue', 'reached the I05 modal cue', false, 'did not reach a modal cue within 4 Next presses')
  check('console', 'no console/page errors in the tour session', errors.length === 0, errors.slice(0, 3).join(' | '))
  await browser.close()
}

// ---- Session 3: practice cue (policy P01) ----
{
  const { browser, page, errors } = await openApp({ width, height, touch, storage: dismissed })
  await unlockIntro(page); await wait(1500)
  await startModule(page, 'Buồng chính sách')
  const ok = await until(page, () => !!document.querySelector('.mach-guide-cue[data-kind="practice"]'), null, 120000, 'practice cue')
  check('practice-cue', 'practice cue appears (P01)', ok)
  if (ok) {
    await wait(1000)
    const cue = await audit(page, '.mach-guide-cue[data-kind="practice"]')
    check('practice-cue', 'cue is role=region with aria-labelledby', cue?.role === 'region' && !!cue.labelledby, `role=${cue?.role} labelledby=${cue?.labelledby}`)
    auditChecks('practice-cue', cue)
    const fc = await active(page)
    await shot(page, 'practice-cue')
    // Esc while focus is on the page (not in the cue) must not cancel the practice; inside the cue it pauses.
    await page.evaluate(() => document.querySelector('[data-guide~="policy-skills"] input, [data-guide~="policy-skills"] button, [data-guide~="policy-skills"]')?.focus?.())
    await page.keyboard.press('Escape'); await wait(500)
    const stillThere = !!(await page.$('.mach-guide-cue[data-kind="practice"]'))
    check('esc', 'Esc with focus on the practised control does not cancel the practice (Esc stays with the control)', stillThere, `focus before=${JSON.stringify(fc)} practiceCueStillShown=${stillThere}`)
    await page.focus('.mach-guide-cue [data-action="practice-done"]'); await page.keyboard.press('Escape'); await wait(800)
    const st = await store(page)
    check('esc', 'Esc with focus inside the practice cue pauses the tour (resumable)', !(await page.$('.mach-guide-cue[data-kind="practice"]')) && st.status === 'in-progress', `status=${st.status}`)
    await openMenu(page); await wait(300)
    const resumeItem = await page.evaluate(() => [...document.querySelectorAll('.mach-guide-menu button')].some((b) => b.textContent.trim().startsWith('Tiếp tục')))
    check('esc', 'the owl menu offers to resume the exact step after Esc', resumeItem)
  }
  check('console', 'no console/page errors in the practice session', errors.length === 0, errors.slice(0, 3).join(' | '))
  await browser.close()
}

// ---- Session 4: reduced motion => nothing animates on the guide layer ----
{
  const { browser, page, errors } = await openApp({ width, height, touch, reduced: true, storage: {} })
  const guideAnimations = () => page.evaluate(() => {
    const inGuide = (el) => !!el?.closest?.('.mach-guide-root,.driver-popover,.driver-overlay,.driver-stage-svg,[data-guide-cue]')
    const running = document.getAnimations().filter((a) => a.playState === 'running' && inGuide(a.effect?.target)).map((a) => `${a.animationName || a.transitionProperty || 'anim'}@${a.effect.target.className?.toString().split(' ')[0]}`)
    const css = [...document.querySelectorAll('.mach-guide-root *,.driver-popover,.driver-popover *')].filter((e) => { const s = getComputedStyle(e); return (s.animationName !== 'none' && parseFloat(s.animationDuration) > 0.001) || parseFloat(s.transitionDuration) > 0.001 }).slice(0, 5).map((e) => `${e.className?.toString().split(' ')[0]}:${getComputedStyle(e).animationName}/${getComputedStyle(e).transitionDuration}`)
    const owl = [...document.querySelectorAll('.mach-owl__inner')].map((e) => getComputedStyle(e).transform + '|' + getComputedStyle(e).opacity)
    return { running, css, owl }
  })
  const settle = async () => { let last = '', n = 0; for (let i = 0; i < 40 && n < 4; i++) { const g = await guideAnimations(); const k = JSON.stringify(g.owl); n = k === last ? n + 1 : 0; last = k; await wait(300) } }
  const ok = await until(page, () => !!document.querySelector('.mach-guide-welcome'), null, 60000, 'welcome (reduced)')
  if (ok) {
    await settle(); await wait(500)
    const g = await guideAnimations(); const g2 = await guideAnimations()
    check('reduced-motion', 'welcome: no running animations/transitions on the guide layer', g.running.length === 0 && g.css.length === 0 && JSON.stringify(g.owl) === JSON.stringify(g2.owl), JSON.stringify(g))
    await page.keyboard.press('Escape'); await wait(500)
  } else check('reduced-motion', 'welcome appears (reduced)', false)
  await unlockIntro(page); await wait(1500)
  await startModule(page, 'Mở đầu và điều hướng')
  await driverShown(page); await popoverStable(page); await settle()
  const g = await guideAnimations(); const g2 = await guideAnimations()
  check('reduced-motion', 'Driver step: no running animations/transitions on the guide layer', g.running.length === 0 && g.css.length === 0 && JSON.stringify(g.owl) === JSON.stringify(g2.owl), JSON.stringify(g))
  const driverClass = await page.evaluate(() => ({ body: document.body.className, popoverAnimation: getComputedStyle(document.querySelector('.driver-popover')).animationName }))
  check('reduced-motion', 'Driver runs without its fade (animate:false): body has no driver-fade class', !driverClass.body.includes('driver-fade'), JSON.stringify(driverClass))
  await shot(page, 'reduced-driver')
  await page.click('.driver-popover .mach-guide__btn--skip'); await wait(600)
  check('console', 'no console/page errors in the reduced-motion session', errors.length === 0, errors.slice(0, 3).join(' | '))
  await browser.close()
}

const failed = results.filter((r) => !r.ok)
writeFileSync(`${dir}/result.json`, JSON.stringify({ tag, width, height, touch, total: results.length, failed: failed.length, results }, null, 1))
console.log(`done a11y-${tag}: ${results.length - failed.length}/${results.length} checks passed`)
for (const f of failed) console.log('FAIL', f.group, '|', f.name, '|', f.detail.slice(0, 200))
process.exit(failed.length ? 1 : 0)
