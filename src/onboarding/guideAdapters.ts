import { timeline, useWorld } from '../experience/WorldState'
import { goToHistory, goToHistoryEnd, goToScene } from '../experience/WorldTimeline'
import { GuideError } from './guideController.ts'
import type { GuideAdapters, GuideLostReason, PreparedStep } from './guideController.ts'
import type { GuideRegistry } from './guideControls.ts'
import { captureDemo, demoRestorePatch } from './guideSession.ts'
import { findVisibleTarget, waitForTarget, waitUntil } from './guideTargets.ts'
import type { GuideScene, GuideStepKind, ResolvedGuideStep } from './guideTypes.ts'

export type GuideAdapterEnv = {
  registry: GuideRegistry
  ui: { showOwl(): void; focusReturn(): void; keyboardModality(): boolean }
  game: { open(stepId: string): void; cancel(mode: 'guide-only' | 'dialog-closed'): void }
}

type Ctx = { signal: AbortSignal; step: ResolvedGuideStep; env: GuideAdapterEnv }
type ModalSpec = { kind: 'menu' | 'source' | 'zoom' | 'map'; dialog: string; open(c: Ctx): void; close(c: Ctx): void }
type Recipe = {
  scene?: GuideScene
  before?: (c: Ctx) => void | Promise<void>
  after?: (c: Ctx) => void | Promise<void>
  redirect?: () => string | null
  satisfied?: () => boolean
  where?: (element: HTMLElement) => boolean
  modal?: ModalSpec
  mode?: () => GuideStepKind | undefined
  scrollFree?: () => boolean | undefined
  // Scroll to the target instead of waiting for it to enter the viewport (tall static layouts).
  reveal?: () => boolean
  practice?: (c: Ctx) => Promise<void>
  acted?: () => boolean
  leaveIsAction?: boolean
}

const FOREVER = 1e9
const scale = () => Number((globalThis as { __machGuideTimeoutScale?: number }).__machGuideTimeoutScale) || 1
const world = () => useWorld.getState()
const sceneReady = (scene: GuideScene) => scene === 'game' ? true : scene === 'history' ? world().history : world().active === scene && !world().history
const calm = (frames = 3) => { let quiet = 0; return () => { quiet = Math.abs(timeline.velocity) < 0.05 ? quiet + 1 : 0; return quiet >= frames } }
const historyRoot = () => document.querySelector<HTMLElement>('.history-bridge')
const activeEra = () => Number(historyRoot()?.dataset.activeEra ?? 0)
const historyStatic = () => historyRoot()?.dataset.layout !== 'horizontal'
const eraOf = (element: HTMLElement) => Number(element.dataset.railEra ?? element.dataset.labelEra ?? element.closest<HTMLElement>('[data-label-era]')?.dataset.labelEra ?? Number.NaN)
const forEra = (index: number) => (element: HTMLElement) => eraOf(element) === index
const forActiveEra = (element: HTMLElement) => Number.isNaN(eraOf(element)) || eraOf(element) === activeEra()
const lensAvailable = () => matchMedia('(min-width:900px) and (prefers-reduced-motion:no-preference) and (hover:hover) and (pointer:fine)').matches
const slotsKey = () => JSON.stringify(world().slots)

function once(type: string, test: (event: Event) => boolean, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new GuideError('cancelled')); return }
    const cleanup = () => { document.removeEventListener(type, on, true); signal.removeEventListener('abort', abort) }
    const on = (event: Event) => { if (test(event)) { cleanup(); resolve() } }
    const abort = () => { cleanup(); reject(new GuideError('cancelled')) }
    document.addEventListener(type, on, true)
    signal.addEventListener('abort', abort, { once: true })
  })
}
const changeIn = (name: string) => (c: Ctx) => once('change', (event) => !!(event.target as HTMLElement | null)?.closest?.(`[data-guide~="${name}"]`), c.signal)
const never = (c: Ctx) => waitUntil(() => false, { signal: c.signal, timeoutMs: FOREVER })

const menuModal: ModalSpec = { kind: 'menu', dialog: 'dialog.source-drawer', open: (c) => c.env.registry.get('app')?.openMenu(), close: (c) => c.env.registry.get('app')?.closeDrawer() }
const sourceModal = (index: (c: Ctx) => number, mode: 'source' | 'history'): ModalSpec => ({ kind: 'source', dialog: 'dialog.source-drawer', open: (c) => c.env.registry.get('app')?.openSource(index(c), mode), close: (c) => c.env.registry.get('app')?.closeDrawer() })
const zoomModal: ModalSpec = { kind: 'zoom', dialog: 'dialog.history-zoom', open: (c) => c.env.registry.get('history')?.openZoom(activeEra()), close: (c) => c.env.registry.get('history')?.closeZoom() }
const mapModal: ModalSpec = { kind: 'map', dialog: 'dialog.map-dialog', open: (c) => c.env.registry.get('vietnam')?.openMap(), close: (c) => c.env.registry.get('vietnam')?.closeMap() }

const ensureCase = (index: number) => async (c: Ctx) => {
  if (world().evidenceCase !== index) world().set({ evidenceCase: index, evidenceLens: 0 })
  await waitUntil(() => !!c.env.registry.get('vietnam'), { signal: c.signal, timeoutMs: 5000 * scale() })
}
const sliderPractice = (name: string): Recipe => ({ practice: changeIn(name) })

// Phones and reduced motion keep some targets below the fold (a drawer's settings, the era 1 block of the static Atlas). Where the
// layout scrolls freely the guide goes to the target; the horizontal Atlas never does this, its off-screen captions are stale on purpose.
async function reveal(name: string, scope: ParentNode, where: ((element: HTMLElement) => boolean) | undefined, signal: AbortSignal) {
  const candidates = () => Array.from(scope.querySelectorAll<HTMLElement>(`[data-guide~="${name}"]`)).filter((element) => element.checkVisibility?.() !== false && (where?.(element) ?? true))
  await waitUntil(() => candidates().length > 0, { signal, timeoutMs: 5000 * scale() }).catch((error) => {
    throw error instanceof GuideError && error.kind === 'cancelled' ? error : new GuideError('missing-target', name)
  })
  if (findVisibleTarget({ name, where })) return
  candidates()[0]?.scrollIntoView({ block: 'center', inline: 'nearest' })
}

const RECIPES: Record<string, Recipe> = {
  I02: { satisfied: () => world().unlocked, practice: (c) => waitUntil(() => world().unlocked, { signal: c.signal, timeoutMs: FOREVER }) },
  I03: { redirect: () => (world().unlocked ? null : 'I02'), leaveIsAction: true },
  I04: { acted: () => !!document.querySelector('dialog.source-drawer[open]') },
  I05: { modal: menuModal },
  I06: { before: (c) => c.env.ui.showOwl() },
  H01: {},
  // The horizontal Atlas only shows the node of the era being read, so its rail is the target; the static layout points at the era 1 section.
  H02: { where: (element) => element.classList.contains('history-progress-rail') || (element.classList.contains('history-mobile-copy') && forEra(1)(element)), scrollFree: () => historyStatic(), reveal: historyStatic },
  H03: { where: forActiveEra, scrollFree: () => historyStatic(), reveal: historyStatic },
  H04: { where: forActiveEra, reveal: historyStatic },
  H06: {
    modal: undefined,
    mode: () => (lensAvailable() ? 'practice' : 'modal'),
    practice: async (c) => {
      const pressed = () => document.querySelector('.history-inspect')?.getAttribute('aria-pressed') === 'true'
      await waitUntil(pressed, { signal: c.signal, timeoutMs: FOREVER })
      await waitUntil(() => !pressed(), { signal: c.signal, timeoutMs: FOREVER })
    },
  },
  H07: { modal: sourceModal(() => activeEra(), 'history') },
  H08: { before: () => goToHistoryEnd(), leaveIsAction: true },
  T03: { practice: (c) => once('change', (event) => (event.target as HTMLElement | null)?.id === 'automation', c.signal) },
  L02: sliderPractice('lab-technology'),
  L03: sliderPractice('lab-data'),
  L04: sliderPractice('lab-skills'),
  L05: sliderPractice('lab-infrastructure'),
  L06: sliderPractice('lab-automation'),
  L08: sliderPractice('lab-ownership'),
  L09: sliderPractice('lab-organization'),
  L10: sliderPractice('lab-distribution'),
  L15: {
    practice: async (c) => {
      const before = world().reconfigure
      const status = () => document.querySelector('.lab-status strong')?.textContent ?? ''
      await waitUntil(() => world().reconfigure !== before, { signal: c.signal, timeoutMs: FOREVER })
      await waitUntil(() => status() !== '' && status() !== 'TÁI CẤU TRÚC', { signal: c.signal, timeoutMs: FOREVER })
    },
  },
  V01: { after: ensureCase(0) },
  V02: { after: ensureCase(0) },
  V03: { after: ensureCase(0) },
  V04: { after: ensureCase(0) },
  V05: { after: async (c) => { await waitUntil(() => !!c.env.registry.get('vietnam'), { signal: c.signal, timeoutMs: 5000 * scale() }) } },
  V06: { after: ensureCase(1) },
  V07: { after: ensureCase(1) },
  V08: { after: ensureCase(1) },
  V09: { after: async (c) => { await waitUntil(() => !!c.env.registry.get('vietnam'), { signal: c.signal, timeoutMs: 5000 * scale() }) } },
  V10: { after: async (c) => { await waitUntil(() => !!c.env.registry.get('vietnam'), { signal: c.signal, timeoutMs: 5000 * scale() }) }, modal: sourceModal((c) => c.env.registry.get('vietnam')?.sourceIndex() ?? 0, 'source') },
  V11: { after: async (c) => { await waitUntil(() => !!c.env.registry.get('vietnam'), { signal: c.signal, timeoutMs: 5000 * scale() }) }, modal: mapModal },
  P01: { practice: (c) => waitUntil(() => world().slots.some((slot) => slot !== null), { signal: c.signal, timeoutMs: FOREVER }) },
  P09: {
    practice: (c) => { const before = slotsKey(); return waitUntil(() => world().slots.every((slot) => slot !== null) && slotsKey() !== before, { signal: c.signal, timeoutMs: FOREVER }) },
  },
  P10: { redirect: () => (world().slots.every((slot) => slot !== null) ? null : 'P09') },
  P11: { practice: (c) => { const before = slotsKey(); return waitUntil(() => slotsKey() !== before, { signal: c.signal, timeoutMs: FOREVER }) } },
  F03: { modal: sourceModal(() => 0, 'source') },
  F04: { acted: () => document.body.classList.contains('mini-game-open') },
}

export function createGuideAdapters(env: GuideAdapterEnv): GuideAdapters {
  // `dialog` stays null while the guide is still waiting for the dialog it just asked the app to open.
  let owned: { spec: ModalSpec; dialog: HTMLDialogElement | null; closing: boolean } | null = null
  let hosted: { stepId: string; dialog: HTMLDialogElement } | null = null

  async function goScene(scene: GuideScene, signal: AbortSignal) {
    if (scene === 'game') return
    if (!sceneReady(scene)) { if (scene === 'history') goToHistory(); else goToScene(scene) }
    await waitUntil(() => sceneReady(scene), { signal, timeoutMs: 6000 * scale() })
    await waitUntil(calm(), { signal, timeoutMs: 4000 * scale() }).catch((error) => { if (signal.aborted) throw error })
  }

  async function closeOwned() {
    const current = owned
    if (!current) return
    current.closing = true
    try { current.spec.close({ signal: new AbortController().signal, step: undefined as never, env }) } catch { /* the dialog may already be gone */ }
    const gone = () => (current.dialog ? !current.dialog.isConnected || !current.dialog.open : !document.querySelector(`${current.spec.dialog}[open]`))
    await waitUntil(gone, { signal: new AbortController().signal, timeoutMs: 2000 }).catch(() => undefined)
    if (owned === current) owned = null
  }

  async function openModal(c: Ctx, spec: ModalSpec, where?: (el: HTMLElement) => boolean): Promise<PreparedStep> {
    let dialog = document.querySelector<HTMLDialogElement>(`${spec.dialog}[open]`)
    if (!dialog) {
      // Ownership is claimed before the dialog exists, so a Skip landing while it is still opening closes it too.
      const claim = { spec, dialog: null as HTMLDialogElement | null, closing: false }
      owned = claim
      spec.open(c)
      await waitUntil(() => !!document.querySelector(`${spec.dialog}[open]`), { signal: c.signal, timeoutMs: 4000 * scale() })
      dialog = document.querySelector<HTMLDialogElement>(`${spec.dialog}[open]`)
      claim.dialog = dialog
    }
    if (!dialog) throw new GuideError('missing-target', c.step.target)
    // The reader may have opened it (pressing the highlighted button): from here on the guide closes it when it moves on.
    if (!owned) owned = { spec, dialog, closing: false }
    const host = dialog
    const inHost = (el: HTMLElement) => host.contains(el) && (where?.(el) ?? true)
    await reveal(c.step.target, host, inHost, c.signal)
    const element = await waitForTarget({ name: c.step.target, where: inHost }, { signal: c.signal, timeoutMs: 5000 * scale() })
    // The cue sticks to the bottom of the dialog: keep the target in the upper part so the cue never covers it.
    element.scrollIntoView({ block: 'start', inline: 'nearest' })
    hosted = { stepId: c.step.id, dialog: host }
    // The drawer keeps its content in .drawer-inner: the cue joins that flow instead of covering the settings.
    return { element, cueHost: host.querySelector<HTMLElement>('.drawer-inner') ?? host, mode: 'modal' }
  }

  return {
    context: () => ({
      'history-static': historyStatic(),
      'audio-on': document.querySelector('.history-sound')?.getAttribute('aria-pressed') === 'true',
      'case-farm': world().evidenceCase === 0,
      keyboard: env.ui.keyboardModality(),
      'quiz-no-hearts': false,
      'boss-final': false,
    }),

    async prepare(step, { signal, reason }) {
      const recipe = RECIPES[step.id] ?? {}
      const c: Ctx = { signal, step, env }
      hosted = null
      // Skipping a step must move on, not bounce back to the step whose action the next one depends on.
      const target = reason === 'skip' ? null : recipe.redirect?.()
      if (target) return { element: null, redirect: target }
      if (owned && !(recipe.modal && recipe.modal.kind === owned.spec.kind)) await closeOwned()
      if (recipe.satisfied?.()) return { element: null, satisfied: true }
      await recipe.before?.(c)
      await goScene(recipe.scene ?? step.scene, signal)
      await recipe.after?.(c)
      if (recipe.modal) return openModal(c, recipe.modal, recipe.where)
      if (recipe.mode?.() === 'modal') return openModal(c, zoomModal)
      if (recipe.reveal?.()) await reveal(step.target, document, recipe.where, signal)
      const element = await waitForTarget({ name: step.target, where: recipe.where }, { signal, timeoutMs: 5000 * scale() })
      return { element, mode: recipe.mode?.(), scrollFree: recipe.scrollFree?.() }
    },

    practice(step, { signal }) {
      const recipe = RECIPES[step.id]
      return recipe?.practice ? recipe.practice({ signal, step, env }) : never({ signal, step, env })
    },

    async closeOwnedModal() { await closeOwned() },

    snapshotDemo: () => captureDemo(world(), { scrollY: window.scrollY, era: activeEra() }),
    restoreDemo: (snapshot) => world().set(demoRestorePatch(snapshot)),
    restoreFocus: () => env.ui.focusReturn(),

    watch(step, { signal, lost }) {
      const recipe = RECIPES[step.id] ?? {}
      const fire = (reason: GuideLostReason) => { if (!signal.aborted) lost(reason) }
      const ignore = () => undefined
      if (step.scene !== 'game') {
        let timer: ReturnType<typeof setTimeout> | null = null
        const unsubscribe = useWorld.subscribe(() => {
          if (sceneReady(step.scene)) { if (timer) { clearTimeout(timer); timer = null } return }
          if (timer) return
          // Scroll transitions flicker through neighbouring scenes; only a lasting change counts.
          timer = setTimeout(() => { timer = null; if (!sceneReady(step.scene)) fire(recipe.leaveIsAction ? 'action-done' : 'scene-changed') }, 350)
        })
        signal.addEventListener('abort', () => { unsubscribe(); if (timer) clearTimeout(timer) }, { once: true })
      }
      if (hosted?.stepId === step.id) {
        const dialog = hosted.dialog
        void waitUntil(() => !dialog.isConnected || !dialog.open, { signal, timeoutMs: FOREVER }).then(() => { if (!owned?.closing) fire('modal-closed') }, ignore)
      }
      if (recipe.acted) void waitUntil(recipe.acted, { signal, timeoutMs: FOREVER }).then(() => fire('action-done'), ignore)
    },

    game: env.game,
  }
}
