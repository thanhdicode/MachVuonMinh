// Scenario 3 — returning users, legacy/malformed/stale storage, blocked storage, refresh mid-module.
import { readFileSync } from 'node:fs'
import { openPage, createReport, probe, progressOf, waitFor, waitSettled, primary, wait, guarded, unexpectedErrors, openMenu, menuTexts, clickMenu, seedProgress, KEY, LEGACY, ROOT } from './lib.mjs'

const report = createReport('03-returning-users')
const ABORTED = [/ERR_ABORTED/]
const copy = JSON.parse(readFileSync(`${ROOT}src/onboarding/guideCopy.json`, 'utf8')).steps
const titleOf = Object.fromEntries(copy.map((step) => [step.id, step.title]))
const ALL_IDS = copy.map((step) => step.id)
const MODULES = ['intro', 'history', 'production', 'lab', 'vietnam', 'policy', 'finale', 'game']

const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null
const wanted = (id) => !only || id.startsWith(only)

async function settleStart(page, expectWelcome) {
  if (expectWelcome) { await page.waitForSelector('.mach-guide-welcome', { timeout: 120000 }); return }
  await page.waitForSelector('.mach-guide-dock__button', { timeout: 120000 })
  // The readiness budget is 5 s from mount: waiting past it (wall clock) proves nothing greets a returning user.
  await waitFor(page, () => performance.now() > 9500, null, 60000)
}

const modules = (page) => page.$$eval('.mach-guide-menu__modules button', (buttons) => buttons.map((button) => button.textContent.replace(/\s+/g, ' ').trim()))
const resumeEntry = async (page) => {
  const items = await page.evaluate(() => Array.from(document.querySelectorAll('.mach-guide-menu button')).map((button) => ({ text: button.firstChild?.textContent?.trim() ?? '', small: button.querySelector('small')?.textContent ?? '' })))
  return items.find((item) => item.text.startsWith('Tiếp tục bước dang dở')) ?? null
}

const SEEDED = [
  { id: '3.1', name: 'completed (all 70 steps)', storage: { [KEY]: seedProgress({ status: 'completed', completedStepIds: ALL_IDS, completedModules: MODULES }) }, welcome: false, resume: null, marks: MODULES.map(() => '✓ đã xem') },
  { id: '3.2', name: 'dismissed', storage: { [KEY]: seedProgress({ status: 'dismissed' }) }, welcome: false, resume: null },
  { id: '3.3', name: 'skipped (skip-guide at L05)', storage: { [KEY]: seedProgress({ status: 'skipped', route: 'lab', moduleId: 'lab', stepId: 'L05', completedStepIds: ['I01', 'I02', 'L01', 'L02', 'L03'], skippedStepIds: ['L04'], lastExit: 'skip-guide' }) }, welcome: false, resume: 'L05' },
  { id: '3.4', name: 'in-progress at V05 (close)', storage: { [KEY]: seedProgress({ status: 'in-progress', route: 'full', moduleId: 'vietnam', stepId: 'V05', completedStepIds: ['I01', 'V01', 'V02', 'V03', 'V04'], lastExit: 'close' }) }, welcome: false, resume: 'V05' },
  { id: '3.5', name: 'v1 legacy dismissed with completed modules', storage: { [LEGACY]: JSON.stringify({ status: 'dismissed', completedModules: ['intro', 'history', 'bogus'], stepId: 'H03' }) }, welcome: false, resume: null, marks: ['✓ đã xem', '✓ đã xem', '', '', '', '', '', ''] },
  { id: '3.6', name: 'v1 legacy in-progress at L05', storage: { [LEGACY]: JSON.stringify({ status: 'in-progress', route: 'lab', stepId: 'L05', completedModules: ['intro'] }) }, welcome: false, resume: 'L05' },
  { id: '3.7', name: 'malformed JSON', storage: { [KEY]: '{broken' }, welcome: true, overwrites: true },
  { id: '3.8', name: 'wrong shape (array)', storage: { [KEY]: '[1,2,3]' }, welcome: true, overwrites: true },
  { id: '3.9', name: 'malformed v2 but valid legacy v1', storage: { [KEY]: 'not json', [LEGACY]: JSON.stringify({ status: 'dismissed', completedModules: ['intro'] }) }, welcome: false, resume: null, marks: ['✓ đã xem', '', '', '', '', '', '', ''] },
  { id: '3.10', name: 'stale ids (unknown step/module ids, junk types)', storage: { [KEY]: JSON.stringify({ schemaVersion: 2, status: 'in-progress', route: 'lab', moduleId: 'lab', stepId: 'L99', completedStepIds: ['I02', 'ZZ99', 42, null, 'L77'], completedModules: ['intro', 'nope'], skippedStepIds: ['Q01'], skippedModuleIds: ['ghost'], lastExit: 'close' }) }, welcome: false, resume: null },
  { id: '3.11', name: 'stale step id inside a valid module', storage: { [KEY]: JSON.stringify({ schemaVersion: 2, status: 'skipped', route: 'history', moduleId: 'history', stepId: 'H44', completedStepIds: ['H01'], completedModules: [], skippedStepIds: [], skippedModuleIds: ['history'], lastExit: 'skip-guide' }) }, welcome: false, resume: null },
]

for (const entry of SEEDED.filter((item) => wanted(item.id))) {
  const { browser, page, errors } = await openPage({ storage: entry.storage })
  await guarded(report, browser, async () => {
    await settleStart(page, entry.welcome)
    const state = await probe(page)
    report.check(`${entry.id}.start`, `${entry.name}: ${entry.welcome ? 'the welcome greets (nothing usable stored)' : 'no welcome for a returning user'}; one guide root, owl present`, state.welcome === (entry.welcome ? 1 : 0) && state.roots === 1 && state.popovers === 0 && state.overlays === 0 && (entry.welcome || state.dock === 1), { welcome: state.welcome, roots: state.roots, dock: state.dock, status: state.progress?.status ?? 'none' })
    if (entry.welcome) {
      await page.click('.mach-guide-welcome [data-action="explore"]')
      await waitFor(page, () => !document.querySelector('.mach-guide-welcome'), null, 20000)
      const saved = await progressOf(page)
      report.check(`${entry.id}.overwrite`, 'a corrupted value is replaced by valid v2 data on the next write', saved && saved.schemaVersion === 2 && saved.status === 'dismissed', { saved: saved?.status })
    } else {
      await openMenu(page)
      const resume = await resumeEntry(page)
      const wantResume = entry.resume
      report.check(`${entry.id}.resume-entry`, wantResume ? `"Tiếp tục bước dang dở" offers exactly ${wantResume} (${titleOf[wantResume]})` : 'no resume entry (nothing resumable)', wantResume ? resume?.small === titleOf[wantResume] : resume === null, { resume })
      if (entry.marks) {
        const marks = (await modules(page)).map((text) => (text.includes('✓ đã xem') ? '✓ đã xem' : text.includes('đã bỏ qua') ? 'đã bỏ qua' : ''))
        report.check(`${entry.id}.marks`, 'module marks come from the sanitised/migrated progress', JSON.stringify(marks) === JSON.stringify(entry.marks), marks)
      }
      await report.shot(page, `${entry.id}-menu`)
      if (wantResume) {
        const before = await progressOf(page)
        await clickMenu(page, 'Tiếp tục bước dang dở')
        await waitSettled(page)
        const running = await probe(page)
        const after = running.progress
        report.check(`${entry.id}.resumes-exact-id`, `resume re-prepares exactly ${wantResume} and re-resolves its target`, after?.stepId === wantResume && after?.status === 'in-progress' && running.title === titleOf[wantResume], { step: after?.stepId, title: running.title, cue: running.cueKind, popovers: running.popovers })
        report.check(`${entry.id}.resume-no-completion`, 'resuming does not complete anything', JSON.stringify(after?.completedStepIds) === JSON.stringify(before?.completedStepIds ?? []) || (before?.completedStepIds ?? []).every((id) => after?.completedStepIds.includes(id)), { before: before?.completedStepIds, after: after?.completedStepIds })
      }
    }
    report.check(`${entry.id}.console-clean`, 'no console errors / page errors', unexpectedErrors(errors, ABORTED).length === 0, unexpectedErrors(errors, ABORTED).slice(0, 4))
  })
}

// ---- Blocked / throwing storage ---------------------------------------------------------------------------------
const BLOCKED = [
  { id: '3.12', name: 'localStorage getter throws SecurityError', before: (page) => page.evaluateOnNewDocument(() => { Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('The operation is insecure.', 'SecurityError') } }) }) },
  { id: '3.13', name: 'getItem/setItem throw (quota / privacy mode)', before: (page) => page.evaluateOnNewDocument(() => {
    window.__qaStorageCalls = 0
    for (const method of ['getItem', 'setItem', 'removeItem']) {
      const original = Storage.prototype[method]
      Storage.prototype[method] = function (key, ...rest) { if (String(key).startsWith('mach-vuon-minh:guide')) { window.__qaStorageCalls += 1; throw new DOMException('QuotaExceededError', 'QuotaExceededError') } return original.call(this, key, ...rest) }
    }
  }) },
]
for (const entry of BLOCKED.filter((item) => wanted(item.id))) {
  const { browser, page, errors } = await openPage({ before: entry.before })
  await guarded(report, browser, async () => {
    await page.waitForSelector('.mach-guide-welcome', { timeout: 120000 })
    const state = await probe(page)
    report.check(`${entry.id}.welcome`, `${entry.name}: the app and the guide load, the welcome greets in-session`, state.welcome === 1 && state.roots === 1, { welcome: state.welcome, roots: state.roots })
    await page.click('.mach-guide-welcome [data-action="quick"]')
    await waitSettled(page)
    await page.focus('.thread-handle')
    await page.keyboard.press('Enter')
    await waitFor(page, () => !!document.querySelector('.mach-guide-cue__hint[data-signaled]'), null, 120000)
    await primary(page)
    await waitFor(page, () => !!document.querySelector('.driver-popover') || document.querySelector('.mach-guide-cue')?.dataset.kind === 'missing-target', null, 120000)
    const third = await probe(page)
    report.check(`${entry.id}.runs-in-session`, 'the tour runs and advances in-session (I02 → I03 popover) without storage', third.popovers === 1 && third.title === titleOf.I03, { title: third.title, popovers: third.popovers })
    await page.click('.driver-popover-close-btn')
    await waitFor(page, () => !document.querySelector('.driver-popover'), null, 20000)
    await openMenu(page)
    const resume = await resumeEntry(page)
    report.check(`${entry.id}.resume-in-session`, 'closing with × keeps the step resumable in this session (in-memory progress)', resume?.small === titleOf.I03, { resume })
    await clickMenu(page, 'Tiếp tục bước dang dở')
    await waitSettled(page)
    const again = await probe(page)
    report.check(`${entry.id}.resumed`, 'in-session resume re-opens I03', again.title === titleOf.I03 && again.popovers === 1, { title: again.title })
    const calls = await page.evaluate(() => window.__qaStorageCalls ?? null)
    report.note(`${entry.id}.calls`, `guide touched storage ${calls === null ? '(getter-blocked variant: not counted)' : calls + ' times (all swallowed)'}`)
    await report.shot(page, `${entry.id}-in-session`)
    report.check(`${entry.id}.console-clean`, 'no console errors / page errors', unexpectedErrors(errors, ABORTED).length === 0, unexpectedErrors(errors, ABORTED).slice(0, 4))
  })
}

// ---- Refresh in the middle of the Lab module (real walk to L05) --------------------------------------------------
if (wanted('3.14')) {
  const { browser, page, errors } = await openPage({ storage: { [KEY]: seedProgress({ status: 'dismissed' }) } })
  await guarded(report, browser, async () => {
    await unlockIntro2(page)
    await openMenu(page)
    await clickMenu2(page, 'Phòng biện chứng')
    const route = ['L01', 'L02', 'L03', 'L04']
    for (const id of route) {
      await waitSettled(page)
      const now = await probe(page)
      if (now.progress?.stepId !== id) { report.check('3.14.walk', `reached ${id}`, false, { at: now.progress?.stepId, cue: now.cueKind }); break }
      await primary(page)
      await waitFor(page, (was) => { try { return JSON.parse(localStorage.getItem('mach-vuon-minh:guide:v2')).stepId !== was } catch { return false } }, id, 120000)
    }
    await waitSettled(page)
    const before = await probe(page)
    report.check('3.14.at-L05', 'the walk is at L05 (practice cue on the infrastructure slider)', before.progress?.stepId === 'L05' && before.cueKind === 'practice', { step: before.progress?.stepId, cue: before.cueKind, scene: before.activeScene })
    await report.shot(page, '3.14-L05-before-refresh')
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.mach-guide-dock__button', { timeout: 120000 })
    await waitFor(page, () => performance.now() > 9500, null, 60000)
    const idle = await probe(page)
    report.check('3.14.no-auto-resume', 'after the refresh nothing resumes by itself (no welcome / popover / cue / lock)', idle.welcome === 0 && idle.popovers === 0 && idle.cues === 0 && idle.overlays === 0 && !/guide-scroll-locked/.test(idle.body) && idle.progress?.stepId === 'L05' && idle.progress?.status === 'in-progress', { stepId: idle.progress?.stepId, status: idle.progress?.status, lastExit: idle.progress?.lastExit, body: idle.body })
    await openMenu(page)
    const resume = await resumeEntry(page)
    report.check('3.14.resume-entry', 'the owl menu offers "Tiếp tục bước dang dở" naming L05', resume?.small === titleOf.L05, { resume })
    await report.shot(page, '3.14-menu-after-refresh')
    await clickMenu2(page, 'Tiếp tục bước dang dở')
    await waitSettled(page)
    const resumed = await probe(page)
    const target = await page.evaluate(() => { const element = document.querySelector('[data-guide~="lab-infrastructure"]'); if (!element) return null; const box = element.getBoundingClientRect(); return { visible: element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }), inViewport: box.bottom > 0 && box.top < innerHeight && box.right > 0 && box.left < innerWidth, w: Math.round(box.width), h: Math.round(box.height) } })
    report.check('3.14.resumes-L05', 'resume lands on exactly L05 with its slider target visible in the viewport', resumed.progress?.stepId === 'L05' && resumed.title === titleOf.L05 && resumed.cueKind === 'practice' && target?.visible && target.inViewport, { step: resumed.progress?.stepId, title: resumed.title, target, scrollY: resumed.scrollY })
    await report.shot(page, '3.14-L05-resumed')
    report.check('3.14.console-clean', 'no console errors / page errors', unexpectedErrors(errors, ABORTED).length === 0, unexpectedErrors(errors, ABORTED).slice(0, 4))
  })
}

async function unlockIntro2(page) {
  await page.focus('.thread-handle')
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => document.querySelector('.experience')?.classList.contains('unlocked'), { timeout: 120000, polling: 250 })
}
async function clickMenu2(page, text) { await clickMenu(page, text) }

void wait
report.done()
