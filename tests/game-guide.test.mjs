import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import {
  CHILD_MESSAGE_TYPES, PARENT_MESSAGE_TYPES, buildChildConfig, createNonce, isNonce, parseChildMessage, parseParentMessage, scriptSafeJson,
} from '../src/onboarding/gameGuideProtocol.ts'
import { createGameGuideSession } from '../src/minigame/gameGuideSession.ts'
import { createGuideCatalog } from '../src/onboarding/guideCatalog.ts'

const catalog = createGuideCatalog()
const gameSteps = catalog.route('game')
const first = gameSteps[0].id
const second = gameSteps[1].id

// ---------------------------------------------------------------- protocol
const frame = { name: 'iframe window' }
const stranger = { name: 'another window' }
const origin = 'http://localhost:5173'
const nonce = createNonce()
const stepIds = new Set(gameSteps.map((step) => step.id))
const ctx = { frame, origin, nonce, stepIds }
const fromChild = (data, over = {}) => ({ source: frame, origin, data: { nonce, ...data }, ...over })

test('nonce is 128 random bits of hex and differs per call', () => {
  assert.ok(isNonce(nonce))
  assert.notEqual(createNonce(), createNonce())
  assert.equal(createNonce((bytes) => bytes.fill(255)), 'ff'.repeat(16))
  assert.equal(isNonce('abc'), false)
})

test('every child message type is accepted only in its exact shape and returned as a clean copy', () => {
  const good = [
    { type: 'guide:ready' }, { type: 'guide:step', stepId: first }, { type: 'guide:step-done', stepId: first },
    { type: 'guide:step-skipped', stepId: second }, { type: 'guide:done' }, { type: 'guide:skipped', scope: 'guide' },
    { type: 'guide:skipped', scope: 'module' }, { type: 'guide:closed', mode: 'guide-only' }, { type: 'guide:failed', reason: 'timeout' },
    { type: 'guide:failed', reason: 'load' }, { type: 'guide:exit' },
  ]
  assert.deepEqual(new Set(good.map((message) => message.type)), new Set(CHILD_MESSAGE_TYPES))
  for (const message of good) assert.deepEqual(parseChildMessage(fromChild(message), ctx), message)
})

test('child messages from the wrong frame, origin or nonce are dropped', () => {
  const ready = { type: 'guide:ready' }
  assert.equal(parseChildMessage(fromChild(ready, { source: stranger }), ctx), null)
  assert.equal(parseChildMessage(fromChild(ready, { source: null }), ctx), null)
  assert.equal(parseChildMessage(fromChild(ready), { ...ctx, frame: null }), null)
  // The srcdoc child reports window.origin (the parent origin); a 'null' origin or any other site is refused.
  assert.equal(parseChildMessage(fromChild(ready, { origin: 'null' }), ctx), null)
  assert.equal(parseChildMessage(fromChild(ready, { origin: 'https://evil.example' }), ctx), null)
  assert.equal(parseChildMessage(fromChild(ready, { origin: `${origin}.evil.example` }), ctx), null)
  assert.equal(parseChildMessage({ source: frame, origin, data: { type: 'guide:ready' } }, ctx), null)
  assert.equal(parseChildMessage({ source: frame, origin, data: { type: 'guide:ready', nonce: createNonce() } }, ctx), null)
  assert.equal(parseChildMessage({ source: frame, origin, data: { type: 'guide:ready', nonce: nonce.slice(1) } }, ctx), null)
  assert.equal(parseChildMessage({ source: frame, origin, data: { type: 'guide:ready', nonce: 7 } }, ctx), null)
})

test('unknown types, extra or missing fields and non-catalog step ids never reach the guide', () => {
  for (const data of [
    { type: 'guide:eval', code: 'alert(1)' }, { type: 'mach-minigame-close' }, { type: 'guide:start', stepId: first }, { type: 'guide:cancel', mode: 'guide-only', resumable: true },
    { type: 'guide:ready', selector: '#startButton' }, { type: 'guide:step' }, { type: 'guide:step', stepId: 'not-a-step' },
    { type: 'guide:step', stepId: '#startButton' }, { type: 'guide:step', stepId: 'G01; drop' }, { type: 'guide:step', stepId: first, extra: 1 },
    { type: 'guide:skipped', scope: 'everything' }, { type: 'guide:skipped' }, { type: 'guide:closed', mode: 'dialog-closed' },
    { type: 'guide:failed', reason: 'because' }, { type: 'guide:done', win: true },
  ]) assert.equal(parseChildMessage(fromChild(data), ctx), null, JSON.stringify(data))
  for (const data of ['guide:ready', 42, null, undefined, ['guide:ready']]) assert.equal(parseChildMessage({ source: frame, origin, data }, ctx), null)
})

test('the exhibit-to-iframe validator mirrors the same fail-closed rules', () => {
  const pctx = { parent: stranger, origin, nonce, stepIds }
  const fromParent = (data, over = {}) => ({ source: stranger, origin, data: { nonce, ...data }, ...over })
  assert.deepEqual(parseParentMessage(fromParent({ type: 'guide:start', stepId: first }), pctx), { type: 'guide:start', stepId: first })
  assert.deepEqual(parseParentMessage(fromParent({ type: 'guide:start', stepId: null }), pctx), { type: 'guide:start', stepId: null })
  assert.deepEqual(parseParentMessage(fromParent({ type: 'guide:cancel', mode: 'dialog-closed', resumable: false }), pctx), { type: 'guide:cancel', mode: 'dialog-closed', resumable: false })
  assert.deepEqual(parseParentMessage(fromParent({ type: 'guide:motion', reduced: true }), pctx), { type: 'guide:motion', reduced: true })
  assert.deepEqual(new Set(['guide:start', 'guide:cancel', 'guide:motion']), new Set(PARENT_MESSAGE_TYPES))
  for (const [data, over] of [
    [{ type: 'guide:start', stepId: first }, { source: frame }], [{ type: 'guide:start', stepId: first }, { origin: 'null' }],
    [{ type: 'guide:start', stepId: 'nope' }, {}], [{ type: 'guide:start', stepId: first, selector: 'body' }, {}], [{ type: 'guide:cancel', mode: 'guide-only' }, {}],
    [{ type: 'guide:cancel', mode: 'reload', resumable: true }, {}], [{ type: 'guide:motion', reduced: 'yes' }, {}], [{ type: 'guide:ready' }, {}],
  ]) assert.equal(parseParentMessage(fromParent(data, over), pctx), null, JSON.stringify(data))
})

test('child config carries catalog copy but none of the development-only fields, and stays inert inside a script tag', () => {
  const link = {
    startStepId: first, steps: gameSteps, buttons: catalog.buttons, systemCopy: catalog.systemCopy, motionTokens: catalog.motionTokens,
    assetBase: '/guide/', vendorBase: '/vendor/driver/1.8.0/', reduced: false, report() {}, attach: () => () => {},
  }
  const config = buildChildConfig({ nonce, origin, link })
  assert.equal(config.guide.steps.length, 10)
  assert.equal(config.guide.steps[0].say, gameSteps[0].say)
  assert.equal(config.guide.buttons.skipGuide, catalog.buttons.skipGuide)
  for (const step of config.guide.steps) for (const dev of ['action', 'observe', 'completion', 'scene', 'scrollFree', 'moduleId']) assert.equal(dev in step, false)
  assert.equal(buildChildConfig({ nonce, origin, link: null }).guide, null)
  const json = scriptSafeJson({ say: '</script><!-- \u2028 \u2029 -->' })
  assert.ok(!json.includes('<') && !json.includes('>') && !json.includes('\u2028') && !json.includes('\u2029'))
  assert.equal(JSON.parse(json).say, '</script><!-- \u2028 \u2029 -->')
})

// ---------------------------------------------------------------- parent session
function fakeTimers() {
  let now = 0
  let nextId = 1
  const tasks = new Map()
  return {
    api: { set: (fn, ms) => { const id = nextId++; tasks.set(id, { at: now + ms, fn }); return id }, clear: (id) => { tasks.delete(id) } },
    advance(ms) {
      const until = now + ms
      for (;;) {
        const due = [...tasks.entries()].filter(([, task]) => task.at <= until).sort((a, b) => a[1].at - b[1].at)[0]
        if (!due) break
        tasks.delete(due[0])
        now = Math.max(now, due[1].at)
        due[1].fn()
      }
      now = until
    },
    pending: () => tasks.size,
  }
}

function makeSession(over = {}) {
  const log = { posts: [], reports: [], acquired: 0, released: 0, restored: 0, closeRequests: 0, changes: [] }
  const timers = fakeTimers()
  const win = { postMessage: (message, target) => log.posts.push({ message, target }) }
  const session = createGameGuideSession({
    nonce, origin, stepIds, startStepId: first, hasGuide: true,
    frameWindow: () => win,
    report: (event) => log.reports.push(event),
    acquireLease: () => { log.acquired += 1; let done = false; return () => { if (!done) { done = true; log.released += 1 } } },
    onDialogClosed: () => { log.restored += 1 },
    requestClose: () => { log.closeRequests += 1 },
    onChange: (snapshot) => log.changes.push(snapshot),
    timers: timers.api,
    ...over,
  })
  const child = (data) => session.receive({ source: win, origin, data: { nonce, ...data } })
  const types = (list) => list.map((entry) => (entry.message ? entry.message.type : entry.type))
  return { session, log, timers, win, child, types }
}

test('start takes the game lease and a ready child is told where to begin, once', () => {
  const { session, log, timers, child, types } = makeSession()
  session.start()
  assert.equal(log.acquired, 1)
  assert.equal(session.snapshot().guide, 'pending')
  assert.equal(session.snapshot().skipVisible, true)
  session.frameLoaded()
  timers.advance(1000)
  child({ type: 'guide:ready' })
  child({ type: 'guide:ready' })
  assert.deepEqual(types(log.posts), ['guide:start'])
  assert.deepEqual(log.posts[0].message, { type: 'guide:start', stepId: first, nonce })
  assert.equal(log.posts[0].target, origin)
  assert.deepEqual(types(log.reports), ['ready'])
  child({ type: 'guide:step', stepId: first })
  child({ type: 'guide:step-done', stepId: first })
  child({ type: 'guide:step', stepId: second })
  assert.equal(session.snapshot().guide, 'active')
  assert.deepEqual(log.reports.slice(1), [{ type: 'step', stepId: first }, { type: 'step-done', stepId: first }, { type: 'step', stepId: second }])
})

test('handshake timeout reports failed, shows the written fallback and never closes the game', () => {
  const { session, log, timers, child } = makeSession()
  session.start()
  session.frameLoaded()
  timers.advance(5999)
  assert.equal(log.reports.length, 0)
  timers.advance(2)
  assert.deepEqual(log.reports, [{ type: 'failed', reason: 'timeout' }])
  assert.equal(session.snapshot().fallback, true)
  assert.equal(session.snapshot().guide, 'none')
  assert.equal(session.snapshot().skipVisible, false)
  assert.equal(log.closeRequests, 0)
  assert.equal(log.released, 0, 'the game lease stays: the game is still playable')
  child({ type: 'guide:ready' })
  assert.equal(log.posts.length, 0, 'a ready that arrives after the deadline does not start the guide')
})

test('a frame that never loads hits the same deadline through the load watchdog', () => {
  const { session, log, timers } = makeSession()
  session.start()
  timers.advance(19999)
  assert.equal(log.reports.length, 0)
  timers.advance(2)
  assert.deepEqual(log.reports, [{ type: 'failed', reason: 'timeout' }])
})

test('Skip while the child is still loading ends the wait: a late ready and the deadline are both ignored', () => {
  const { session, log, timers, child } = makeSession()
  session.start()
  session.frameLoaded()
  session.skipGuide()
  assert.deepEqual(log.reports, [{ type: 'skipped' }])
  assert.equal(session.snapshot().guide, 'none')
  child({ type: 'guide:ready' })
  timers.advance(60000)
  assert.deepEqual(log.posts, [], 'nothing is sent to a child that arrives after the skip')
  assert.deepEqual(log.reports, [{ type: 'skipped' }], 'no ready, no failed')
  assert.equal(log.released, 0)
})

test('Skip while the guide runs cancels the child (guide-only), keeps lease and dialog, and drops in-flight steps', () => {
  const { session, log, timers, child, types } = makeSession()
  session.start()
  session.frameLoaded()
  child({ type: 'guide:ready' })
  child({ type: 'guide:step', stepId: first })
  log.posts.length = 0
  log.reports.length = 0
  session.skipGuide()
  assert.deepEqual(log.posts.map((entry) => entry.message), [{ type: 'guide:cancel', mode: 'guide-only', resumable: false, nonce }])
  assert.deepEqual(log.reports, [{ type: 'skipped' }])
  assert.equal(session.snapshot().guide, 'cancelling')
  assert.equal(session.snapshot().skipVisible, false)
  child({ type: 'guide:step', stepId: second })
  assert.deepEqual(types(log.reports), ['skipped'], 'a step that was already in flight must not bring the guide back')
  child({ type: 'guide:closed', mode: 'guide-only' })
  assert.equal(session.snapshot().guide, 'none')
  assert.deepEqual(types(log.reports), ['skipped'], 'the acknowledgement is not reported twice')
  child({ type: 'guide:step', stepId: second })
  assert.equal(session.snapshot().guide, 'active', 'a run the user starts later from the launcher is accepted again')
  assert.equal(log.released, 0)
  assert.equal(log.restored, 0)
  assert.equal(log.closeRequests, 0)
  timers.advance(5000)
})

test('an unacknowledged cancel falls back to idle after a short wait', () => {
  const { session, timers, child } = makeSession()
  session.start()
  session.frameLoaded()
  child({ type: 'guide:ready' })
  child({ type: 'guide:step', stepId: first })
  session.skipGuide()
  assert.equal(session.snapshot().guide, 'cancelling')
  timers.advance(1300)
  assert.equal(session.snapshot().guide, 'none')
})

test('guide-only teardown never releases the lease; dialog-closed releases it exactly once however often it runs', () => {
  const { session, log, win } = makeSession()
  session.start()
  session.frameLoaded()
  session.receive({ source: win, origin, data: { nonce, type: 'guide:ready' } })
  session.cancel('guide-only')
  session.cancel('guide-only')
  session.skipGuide()
  assert.equal(log.released, 0)
  assert.equal(log.restored, 0)
  session.cancel('dialog-closed')
  session.cancel('dialog-closed')
  session.dispose()
  session.dispose()
  assert.equal(log.acquired, 1)
  assert.equal(log.released, 1)
  assert.equal(log.restored, 1, 'focus and scroll go back to the exhibit once')
  assert.equal(log.reports.filter((event) => event.type === 'closed' && event.mode === 'dialog-closed').length, 1)
  assert.ok(log.posts.some((entry) => entry.message.type === 'guide:cancel' && entry.message.mode === 'dialog-closed'))
  assert.equal(session.snapshot().closed, true)
  const before = log.reports.length
  session.receive({ source: win, origin, data: { nonce, type: 'guide:step', stepId: first } })
  assert.equal(log.reports.length, before, 'a closed dialog accepts nothing')
})

test('a failing cleanup step cannot stop the lease release, the focus restore or the closed report', () => {
  const { session, log } = makeSession({
    onDialogClosed: () => { throw new Error('focus restore failed') },
    acquireLease: () => () => { throw new Error('release failed') },
  })
  const warn = console.warn
  console.warn = () => {}
  try {
    session.start()
    assert.throws(() => session.dispose(), /release failed|focus restore failed/)
  } finally { console.warn = warn }
  assert.deepEqual(log.reports, [{ type: 'closed', mode: 'dialog-closed' }])
  assert.equal(session.snapshot().closed, true)
  assert.doesNotThrow(() => session.dispose())
})

test('Escape closes the guide first (pending or active) and only then leaves the presentation', () => {
  for (const mode of ['pending', 'active']) {
    const { session, log, child } = makeSession()
    session.start()
    session.frameLoaded()
    if (mode === 'active') { child({ type: 'guide:ready' }); child({ type: 'guide:step', stepId: first }) }
    assert.equal(session.escape(), 'closed-guide', mode)
    assert.deepEqual(log.reports.filter((event) => event.type === 'closed'), [{ type: 'closed', mode: 'guide-only' }])
    assert.equal(log.released, 0)
    assert.equal(log.closeRequests, 0)
    if (mode === 'active') assert.equal(session.escape(), 'closed-guide', 'a second Esc while the child is still closing is swallowed')
  }
  const { session, child } = makeSession()
  session.start()
  session.frameLoaded()
  child({ type: 'guide:ready' })
  child({ type: 'guide:step', stepId: first })
  session.escape()
  child({ type: 'guide:closed', mode: 'guide-only' })
  assert.equal(session.escape(), 'close-dialog')
})

test('a child Esc with no guide open asks the host to close; with a guide open it only closes the guide', () => {
  const idle = makeSession({ hasGuide: false, startStepId: null })
  idle.session.start()
  idle.child({ type: 'guide:exit' })
  assert.equal(idle.log.closeRequests, 1)
  const live = makeSession()
  live.session.start()
  live.session.frameLoaded()
  live.child({ type: 'guide:ready' })
  live.child({ type: 'guide:step', stepId: first })
  live.child({ type: 'guide:exit' })
  assert.equal(live.log.closeRequests, 0)
  assert.equal(live.session.snapshot().guide, 'cancelling')
})

test('messages from another window, origin or nonce change nothing', () => {
  const { session, log, win } = makeSession()
  session.start()
  session.frameLoaded()
  session.receive({ source: stranger, origin, data: { nonce, type: 'guide:ready' } })
  session.receive({ source: win, origin: 'null', data: { nonce, type: 'guide:ready' } })
  session.receive({ source: win, origin, data: { nonce: createNonce(), type: 'guide:ready' } })
  session.receive({ source: win, origin, data: { nonce, type: 'guide:exit', extra: true } })
  assert.deepEqual(log.posts, [])
  assert.deepEqual(log.reports, [])
  assert.equal(log.closeRequests, 0)
})

test('an in-place iframe reload ends what the old child was doing and never auto-starts the new one', () => {
  const { session, log, child, types } = makeSession()
  session.start()
  session.frameLoaded()
  child({ type: 'guide:ready' })
  child({ type: 'guide:step', stepId: first })
  log.posts.length = 0
  session.frameLoaded()
  assert.deepEqual(log.reports.filter((event) => event.type === 'closed'), [{ type: 'closed', mode: 'guide-only' }])
  child({ type: 'guide:ready' })
  assert.deepEqual(types(log.posts), [], 'the reloaded child waits for the user')
  assert.equal(log.released, 0)
})

test('launcher-only sessions never report a handshake failure and wait for the user', () => {
  const { session, log, timers, child } = makeSession({ startStepId: null })
  session.start()
  assert.equal(session.snapshot().guide, 'none')
  session.frameLoaded()
  child({ type: 'guide:ready' })
  assert.deepEqual(log.posts, [])
  child({ type: 'guide:step', stepId: first })
  assert.equal(session.snapshot().skipVisible, true)
  child({ type: 'guide:done' })
  assert.deepEqual(log.reports.map((event) => event.type), ['ready', 'step', 'finished'])
  timers.advance(60000)
  const silent = makeSession({ startStepId: null })
  silent.session.start()
  silent.session.frameLoaded()
  silent.timers.advance(60000)
  assert.deepEqual(silent.log.reports, [])
})

test('the exhibit controller can end the child guide or the whole dialog through the attached handle without an echo', () => {
  const { session, log, child } = makeSession()
  session.start()
  session.frameLoaded()
  child({ type: 'guide:ready' })
  child({ type: 'guide:step', stepId: first })
  log.reports.length = 0
  session.cancel('guide-only', { silent: true })
  assert.deepEqual(log.reports, [])
  assert.equal(log.released, 0)
  session.cancel('dialog-closed', { silent: true })
  assert.deepEqual(log.reports, [])
  assert.equal(log.released, 1)
})

test('motion changes reach the child only once it is ready', () => {
  const { session, log, child } = makeSession()
  session.start()
  session.motion(true)
  assert.deepEqual(log.posts, [])
  session.frameLoaded()
  child({ type: 'guide:ready' })
  log.posts.length = 0
  session.motion(true)
  assert.deepEqual(log.posts.map((entry) => entry.message), [{ type: 'guide:motion', reduced: true, nonce }])
})

test('without a guide link the dialog still owns and releases exactly one lease and reports nothing', () => {
  const { session, log } = makeSession({ hasGuide: false, startStepId: null })
  session.start()
  session.frameLoaded()
  session.dispose()
  session.dispose()
  assert.equal(log.acquired, 1)
  assert.equal(log.released, 1)
  assert.deepEqual(log.reports, [])
})

// ---------------------------------------------------------------- the real game.js inside a vm
// A permissive DOM stand-in is enough: the game only needs elements that store listeners and class names.
async function loadGame() {
  const source = await readFile('src/minigame/assets/game.js', 'utf8')
  const clock = { now: 1000 }
  const winHandlers = new Map()
  const docHandlers = new Map()
  const els = new Map()
  const fills = []
  const parentPosts = []
  let raf = null
  const add = (map, type, fn) => { if (!map.has(type)) map.set(type, []); map.get(type).push(fn) }
  class El {
    constructor(name) {
      this.name = name
      this.children = []
      this.dataset = {}
      this.style = {}
      this.attrs = {}
      this.listeners = {}
      this.cls = new Set(name === 'startOverlay' || name === 'bossHud' ? [] : ['hidden'])
      this.textContent = ''
      this.innerHTML = ''
      this.firstChild = { textContent: '' }
      this.disabled = false
      this.inert = false
      this.offsetWidth = 1
      const cls = this.cls
      this.classList = {
        add: (...names) => names.forEach((n) => cls.add(n)),
        remove: (...names) => names.forEach((n) => cls.delete(n)),
        toggle: (n, force) => { const on = force === undefined ? !cls.has(n) : force; if (on) cls.add(n); else cls.delete(n); return on },
        contains: (n) => cls.has(n),
      }
    }
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn) }
    setAttribute(key, value) { this.attrs[key] = value }
    append(...nodes) { this.children.push(...nodes) }
    replaceChildren() { this.children = [] }
    querySelector() { return new El('query') }
    querySelectorAll() { return [] }
    closest() { return panel }
    focus() {}
    getBoundingClientRect() { return { x: 0, y: 0, left: 0, top: 0, right: 1000, bottom: 430, width: 1000, height: 430 } }
  }
  const panel = new El('panel')
  const ctx2d = new Proxy({}, {
    get: (target, key) => {
      if (key === 'measureText') return (text) => ({ width: String(text).length * 8 })
      if (typeof key === 'string' && key.startsWith('create')) return () => ({ addColorStop() {} })
      if (key === 'fillText') return (text) => fills.push(String(text))
      return typeof key === 'symbol' ? undefined : () => {}
    },
    set: () => true,
  })
  const make = (id) => {
    const element = new El(id)
    if (id === 'gameCanvas') { element.getContext = () => ctx2d; element.width = 1000; element.height = 430 }
    if (id === 'canvasWrap') element.closest = () => panel
    if (id === 'bossHealthBar') element.children = [new El('seg'), new El('seg'), new El('seg')]
    return element
  }
  const el = (id) => { if (!els.has(id)) els.set(id, make(id)); return els.get(id) }
  class FakeImage { set src(value) { this.url = value; queueMicrotask(() => this.onload && this.onload()) } get width() { return 64 } get height() { return 64 } }
  const sandbox = {
    console, queueMicrotask, setTimeout, clearTimeout,
    performance: { now: () => clock.now },
    requestAnimationFrame: (fn) => { raf = fn; return 1 },
    ResizeObserver: class { observe() {} },
    Image: FakeImage,
    matchMedia: () => ({ matches: false }),
    innerWidth: 1000, devicePixelRatio: 1,
    document: {
      hidden: false,
      getElementById: el,
      createElement: (tag) => (tag === 'canvas' ? Object.assign(new El('canvas'), { getContext: () => ctx2d }) : new El(tag)),
      querySelector: () => new El('query'),
      addEventListener: (type, fn) => add(docHandlers, type, fn),
    },
    addEventListener: (type, fn) => add(winHandlers, type, fn),
    GAME_SPRITES: {},
    MACH_GAME_CONFIG: { version: 1, nonce, origin, guide: null },
    parent: { postMessage: (message, target) => parentPosts.push({ message, target }) },
  }
  sandbox.window = sandbox
  vm.createContext(sandbox)
  vm.runInContext('Math.random=(()=>{let s=20260310;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}})()', sandbox)
  for (const file of ['questions.js', 'document-questions.js']) vm.runInContext(await readFile(`src/minigame/assets/${file}`, 'utf8'), sandbox)
  // Test-only tail: hands the closure's own state and entry points to the test; the shipped file is untouched.
  const tail = 'globalThis.__t={state,guideHold,collision,startBoss,reset};\n})();'
  const instrumented = source.replace(/\}\)\(\);\s*$/, tail)
  assert.notEqual(instrumented, source, 'game.js still ends with its closing IIFE')
  vm.runInContext(instrumented, sandbox)
  await new Promise((resolve) => setImmediate(resolve))
  const t = sandbox.__t
  const game = {
    t, el, fills, parentPosts, bridge: sandbox.__machGameBridge,
    step(ms = 16) { clock.now += ms; const fn = raf; raf = null; fn(clock.now) },
    run(frames, ms = 16) { for (let i = 0; i < frames; i += 1) game.step(ms) },
    advance(ms) { clock.now += ms },
    fire(type, event = {}) { for (const fn of winHandlers.get(type) || []) fn({ preventDefault() {}, target: { closest: () => null }, repeat: false, ...event }) },
    fireDoc(type) { for (const fn of docHandlers.get(type) || []) fn({}) },
    key: (code, down = true) => game.fire(down ? 'keydown' : 'keyup', { code }),
    click(id) { for (const fn of el(id).listeners.click || []) fn({ type: 'click', preventDefault() {} }) },
    pointer(id, type) { for (const fn of el(id).listeners[type] || []) fn({ type, preventDefault() {} }) },
    // Everything the campaign owns; lastTime is just the frame clock.
    campaign() { const copy = structuredClone(t.state); delete copy.lastTime; return copy },
    visible: (id) => !el(id).cls.has('hidden'),
  }
  return game
}

// A run in progress: playing, with obstacles on screen and no collision for a long while.
async function runningGame() {
  const game = await loadGame()
  game.click('startButton')
  game.t.state.immunity = 1e9
  game.run(240)
  assert.equal(game.t.state.mode, 'running')
  assert.ok(game.t.state.obstacles.length > 0, 'obstacles are on screen')
  assert.ok(game.t.state.score > 0)
  return game
}

test('the guide bridge is a frozen set of fixed methods that cannot reach score, hearts, stage, boss HP or answers', async () => {
  const { bridge, t } = await loadGame()
  assert.equal(Object.isFrozen(bridge), true)
  assert.deepEqual(Object.keys(bridge).sort(), ['beginGuidePractice', 'endGuidePractice', 'pauseForGuide', 'releaseGuidePause', 'snapshot'])
  assert.throws(() => { 'use strict'; bridge.setScore = () => {} }, TypeError)
  t.collision()
  const snapshot = bridge.snapshot()
  assert.equal(JSON.stringify(snapshot).includes('correct'), false)
  assert.deepEqual(Object.keys(snapshot).sort(), ['bossHp', 'decks', 'hearts', 'holding', 'mode', 'obstacles', 'playerDuck', 'practicing', 'runTime', 'score', 'stage', 'world'])
  snapshot.hearts = 0
  assert.equal(t.state.hearts, 3, 'a snapshot is a copy')
})

test('practice is refused unless the guide already holds the game', async () => {
  const { bridge } = await loadGame()
  assert.equal(bridge.beginGuidePractice('jump', () => {}), false)
  bridge.pauseForGuide()
  assert.equal(bridge.beginGuidePractice('sprint', () => {}), false)
  assert.equal(bridge.beginGuidePractice('jump', () => {}), true)
  assert.equal(bridge.snapshot().practicing, 'jump')
})

test('holding freezes the whole campaign, and resuming continues without a time jump', async () => {
  const game = await runningGame()
  const before = game.campaign()
  game.bridge.pauseForGuide()
  game.run(300)
  assert.deepEqual(game.campaign(), before)
  game.advance(10_000) // the tab sat open for ten seconds
  game.bridge.releaseGuidePause()
  const scoreBefore = game.t.state.score
  game.step(16)
  assert.equal(game.t.state.mode, 'running')
  assert.ok(game.t.state.score > scoreBefore, 'the run goes on')
  assert.ok(game.t.state.score - scoreBefore < 0.5, 'one frame of progress, not ten seconds of it')
})

test('practising jump and duck changes nothing in the campaign over many frames', async () => {
  const game = await runningGame()
  const before = game.campaign()
  const seen = []
  game.bridge.pauseForGuide()
  assert.equal(game.bridge.beginGuidePractice('jump', (event) => seen.push(event.type)), true)
  for (let round = 0; round < 40; round += 1) {
    game.key('Space'); game.run(3); game.key('Space', false)
    game.run(45)
    game.key('ArrowUp'); game.run(8); game.key('ArrowUp', false)
    game.key('ArrowDown'); game.run(10); game.advance(150); game.key('ArrowDown', false)
    game.run(20)
    assert.deepEqual(game.campaign(), before, `round ${round}`)
  }
  assert.ok(seen.includes('jumped') && seen.includes('landed') && seen.includes('duck-start') && seen.includes('duck-end'))
  assert.ok(game.fills.includes('TẬP THAO TÁC'), 'the arena says it is a practice')
  game.fills.length = 0
  game.bridge.endGuidePractice()
  game.run(2)
  assert.equal(game.fills.includes('TẬP THAO TÁC'), false, 'and stops saying so afterwards')
  assert.deepEqual(game.campaign(), before)
})

test('the practice runner obeys the real jump rules: no double jump, a short press hops lower', async () => {
  const game = await loadGame()
  game.bridge.pauseForGuide()
  const peaks = []
  let peak = 0
  game.bridge.beginGuidePractice('jump', (event) => { if (event.type === 'landed') { peaks.push(peak); peak = 0 } })
  const height = () => -game.t.guideHold.practice.y
  game.key('Space'); game.key('Space'); game.key('Space')
  for (let i = 0; i < 80; i += 1) { game.step(); peak = Math.max(peak, height()) }
  game.key('Space', false)
  game.key('Space'); game.run(4); game.key('Space', false)
  for (let i = 0; i < 80; i += 1) { game.step(); peak = Math.max(peak, height()) }
  assert.equal(peaks.length, 2, 'two jumps, each landed once')
  assert.ok(peaks[1] < peaks[0], 'releasing early gives the lower jump')
})

test('the previous mode comes back exactly: ready stays ready, a player pause stays paused with its overlay, running keeps running', async () => {
  const ready = await loadGame()
  ready.bridge.pauseForGuide(); ready.bridge.beginGuidePractice('duck', () => {}); ready.key('Space'); ready.run(30); ready.bridge.endGuidePractice(); ready.bridge.releaseGuidePause()
  assert.equal(ready.t.state.mode, 'ready')
  assert.equal(ready.visible('startOverlay'), true)

  const paused = await runningGame()
  paused.key('KeyP')
  assert.equal(paused.t.state.mode, 'paused')
  assert.equal(paused.visible('pauseOverlay'), true)
  paused.bridge.pauseForGuide()
  assert.equal(paused.visible('pauseOverlay'), true, 'the guide neither shows nor hides the player pause overlay')
  paused.bridge.beginGuidePractice('jump', () => {}); paused.key('Space'); paused.run(60); paused.bridge.endGuidePractice()
  paused.key('KeyP')
  assert.equal(paused.t.state.mode, 'paused', 'P during the guide does not resume a game the player paused')
  paused.bridge.releaseGuidePause()
  assert.equal(paused.t.state.mode, 'paused')
  assert.equal(paused.visible('pauseOverlay'), true)
  paused.key('KeyP')
  assert.equal(paused.t.state.mode, 'running', 'afterwards the player resumes as usual')

  const running = await runningGame()
  running.bridge.pauseForGuide()
  assert.equal(running.visible('pauseOverlay'), false, 'a guide hold is not the player pause')
  running.bridge.releaseGuidePause()
  assert.equal(running.t.state.mode, 'running')
})

test('while held, no campaign input does anything: keys, buttons, answers, boss and restart', async () => {
  const quiz = await loadGame()
  quiz.t.collision()
  quiz.bridge.pauseForGuide()
  const before = quiz.campaign()
  quiz.key('Digit1'); quiz.key('Digit3'); quiz.key('Enter'); quiz.key('KeyP'); quiz.key('Space'); quiz.key('ArrowDown')
  quiz.click('continueButton'); quiz.click('pauseButton'); quiz.click('restartButton'); quiz.click('startButton')
  quiz.fireDoc('visibilitychange')
  assert.deepEqual(quiz.campaign(), before)
  assert.equal(quiz.t.state.answered, false)
  quiz.bridge.releaseGuidePause()
  quiz.key('Digit1')
  assert.equal(quiz.t.state.answered, true, 'the quiz works again the moment the guide lets go')

  const boss = await loadGame()
  boss.t.state.mode = 'running'
  boss.t.startBoss()
  boss.bridge.pauseForGuide()
  const bossBefore = boss.campaign()
  boss.click('fightButton'); boss.click('nextStageButton'); boss.click('bossContinueButton')
  assert.deepEqual(boss.campaign(), bossBefore)
  assert.equal(boss.t.state.mode, 'boss-intro')
  boss.bridge.releaseGuidePause()
  boss.click('fightButton')
  assert.equal(boss.t.state.mode, 'boss-question')
})

test('a duck still held when the guide opens, or when practice is cancelled, never leaves the player stuck ducking', async () => {
  const held = await runningGame()
  held.key('ArrowDown')
  assert.equal(held.t.state.player.duck, true)
  held.bridge.pauseForGuide()
  assert.equal(held.bridge.snapshot().playerDuck, false, 'holding drops a duck that was still pressed')
  held.key('ArrowDown', false)
  held.bridge.releaseGuidePause()
  held.run(30)
  assert.equal(held.t.state.player.duck, false)

  const cancelled = await runningGame()
  cancelled.bridge.pauseForGuide()
  cancelled.bridge.beginGuidePractice('duck', () => {})
  cancelled.key('ArrowDown')
  cancelled.run(5)
  cancelled.bridge.endGuidePractice() // cancelled while the key is still down
  cancelled.bridge.releaseGuidePause()
  cancelled.run(5)
  assert.equal(cancelled.t.state.player.duck, false)
  cancelled.key('ArrowDown', false)
  cancelled.run(5)
  assert.equal(cancelled.t.state.player.duck, false)
  assert.equal(cancelled.t.state.mode, 'running')

  const pointer = await runningGame()
  pointer.bridge.pauseForGuide()
  pointer.bridge.beginGuidePractice('duck', () => {})
  pointer.pointer('duckButton', 'pointerdown')
  pointer.bridge.endGuidePractice()
  pointer.bridge.releaseGuidePause()
  pointer.pointer('duckButton', 'pointercancel')
  pointer.run(5)
  assert.equal(pointer.t.state.player.duck, false)
})

test('a duck counts as practised only after a real hold and a normal release, never after a cancelled press or a tap', async () => {
  const game = await loadGame()
  game.bridge.pauseForGuide()
  const seen = []
  game.bridge.beginGuidePractice('duck', (event) => seen.push(event.type))
  game.pointer('duckButton', 'pointerdown'); game.advance(400); game.pointer('duckButton', 'pointercancel')
  game.pointer('duckButton', 'pointerdown'); game.advance(400); game.pointer('duckButton', 'pointerleave')
  game.key('ArrowDown'); game.advance(40); game.key('ArrowDown', false)
  assert.equal(seen.includes('duck-end'), false)
  assert.equal(seen.filter((type) => type === 'duck-abort').length, 3)
  game.pointer('duckButton', 'pointerdown'); game.advance(300); game.pointer('duckButton', 'pointerup')
  assert.equal(seen.filter((type) => type === 'duck-end').length, 1)
})

test('Escape asks the exhibit to close with the nonce, to the explicit origin and nothing else', async () => {
  const game = await loadGame()
  game.fire('keydown', { code: 'Escape' })
  // The message was built inside the vm realm, so compare plain JSON.
  assert.deepEqual(JSON.parse(JSON.stringify(game.parentPosts)), [{ message: { type: 'guide:exit', nonce }, target: origin }])
})

test('keys aimed at the guide\'s own buttons keep their native behaviour instead of becoming jumps', async () => {
  const game = await loadGame()
  let prevented = false
  game.fire('keydown', { code: 'Space', target: { closest: (selector) => (selector === '[data-mach-guide-ui]' ? {} : null) }, preventDefault() { prevented = true } })
  assert.equal(prevented, false)
  assert.equal(game.t.state.mode, 'ready')
})

test('while a practice runs the focused card lets the practised keys through; its buttons and every other key stay with the guide', async () => {
  const game = await loadGame()
  const inGuide = (control) => ({ closest: (selector) => (selector === '[data-mach-guide-ui]' ? {} : control && selector.startsWith('button') ? {} : null) })
  const surface = inGuide(false), button = inGuide(true)
  const seen = []
  game.bridge.pauseForGuide()
  game.bridge.beginGuidePractice('jump', (event) => seen.push(event.type))
  game.fire('keydown', { code: 'Space', target: button })
  game.fire('keydown', { code: 'KeyP', target: surface })
  game.fire('keydown', { code: 'Digit1', target: surface })
  game.run(60)
  assert.deepEqual(seen, [], 'a guide button keeps its own Space, and no other key reaches the game')
  game.fire('keydown', { code: 'ArrowUp', target: surface }); game.run(60); game.fire('keyup', { code: 'ArrowUp' })
  assert.deepEqual(seen, ['jumped', 'landed'])
  game.bridge.beginGuidePractice('duck', (event) => seen.push(event.type))
  game.fire('keydown', { code: 'ArrowDown', target: surface }); game.advance(300); game.fire('keyup', { code: 'ArrowDown' })
  assert.deepEqual(seen.slice(2), ['duck-start', 'duck-end'])
})

test('a focused guide card never starts or answers the campaign when no practice is running', async () => {
  const game = await loadGame()
  const surface = { closest: (selector) => (selector === '[data-mach-guide-ui]' ? {} : null) }
  const before = game.campaign()
  // No hold on purpose: a hint card can be focused while the game itself is waiting, and Space there must not start the run.
  for (const code of ['Space', 'ArrowUp', 'ArrowDown', 'Digit1', 'Enter', 'KeyP']) game.fire('keydown', { code, target: surface })
  game.run(30)
  assert.equal(game.t.state.mode, 'ready')
  assert.deepEqual(game.campaign(), before)
})

test('the pagehide of the iframe lets go of the hold', async () => {
  const game = await loadGame()
  game.bridge.pauseForGuide()
  game.bridge.beginGuidePractice('jump', () => {})
  game.fire('pagehide')
  assert.equal(game.bridge.snapshot().holding, false)
  assert.equal(game.bridge.snapshot().practicing, null)
})
