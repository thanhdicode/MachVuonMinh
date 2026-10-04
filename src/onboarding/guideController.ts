import { resolveStep } from './guideCatalog.ts'
import type { GuideCatalog } from './guideCatalog.ts'
import { MODULE_ORDER, moduleOfStep, routeStepIds } from './guideIds.ts'
import {
  beginGuide, closeGuide, completeStep, dismissWelcome, finishRoute, moveGuide, pauseGuide, resumeTarget,
  skipGameAtFinale, skipGuide, skipModule, skipStep,
} from './guideProgress.ts'
import type { ProgressStore } from './guideProgress.ts'
import { createRunGate } from './guideSession.ts'
import type { DemoSnapshot, GuideRun, RunGate, ScrollLeases } from './guideSession.ts'
import type {
  GuideContext, GuideModule, GuideMotion, GuidePhase, GuidePose, GuideProgress, GuideRoute, GuideStepKind, ResolvedGuideStep,
} from './guideTypes.ts'

export type GuideErrorKind = 'missing-target' | 'timeout' | 'cancelled'

export class GuideError extends Error {
  kind: GuideErrorKind
  constructor(kind: GuideErrorKind, message?: string) {
    super(message ?? kind)
    this.name = 'GuideError'
    this.kind = kind
  }
}

export type PreparedStep = {
  element: HTMLElement | null
  cueHost?: HTMLElement | null
  // Real context decides how the step is shown (e.g. desktop lens = practice, mobile zoom = modal).
  mode?: GuideStepKind
  // Overrides the step default: the reader must be able to scroll while this step is shown (static Atlas).
  scrollFree?: boolean
  // The user already did this earlier in the session (e.g. the intro gesture): complete it and move on.
  satisfied?: boolean
  // The step cannot run in the current context; continue with this id instead.
  redirect?: string
}
export type PrepareReason = 'enter' | 'skip' | 'back' | 'resume' | 'retry' | 'relayout'
export type GuideLostReason = 'scene-changed' | 'target-lost' | 'modal-closed' | 'action-done'

export type GameGuideEvent =
  | { type: 'ready' }
  | { type: 'step'; stepId: string }
  | { type: 'step-done'; stepId: string }
  | { type: 'finished' }
  | { type: 'step-skipped'; stepId: string }
  | { type: 'skipped'; scope?: 'guide' | 'module' }
  | { type: 'closed'; mode: 'guide-only' | 'dialog-closed' }
  | { type: 'failed'; reason: 'timeout' | 'load' }

export type GuideAdapters = {
  context(): GuideContext
  prepare(step: ResolvedGuideStep, options: { signal: AbortSignal; reason: PrepareReason }): Promise<PreparedStep>
  practice(step: ResolvedGuideStep, options: { signal: AbortSignal }): Promise<void>
  closeOwnedModal(): Promise<void> | void
  closeOwnedModalSync(): void
  snapshotDemo(): DemoSnapshot
  restoreDemo(snapshot: DemoSnapshot): void
  restorePosition?(snapshot: DemoSnapshot): void
  restoreFocus(): void
  watch?(step: ResolvedGuideStep, options: { signal: AbortSignal; lost(reason: GuideLostReason): void }): void
  game?: { open(stepId: string): void; cancel(mode: 'guide-only' | 'dialog-closed'): void }
}

export type PresentArgs = {
  step: ResolvedGuideStep
  element: HTMLElement
  counterText: string
  nextText: string
  canBack: boolean
  reduced: boolean
  extras: { skipModule: string | null; pause: string; skipGuide: string; skipGame: string | null }
  handlers: { next(): void; back(): void; close(): void; skipModule(): void; pause(): void; skipGuide(): void; skipGame(): void }
}

export type DriverPort = {
  load(signal: AbortSignal): Promise<void>
  present(args: PresentArgs): void
  refresh(): void
  destroy(): void
  isActive(): boolean
}

export type GuideNotice =
  | { kind: 'preparing' }
  | { kind: 'missing-target'; reason: 'missing-target' | 'timeout' }
  | { kind: 'driver-failed' }
  | { kind: 'skipped' }
  | { kind: 'paused' }
  | { kind: 'scene-changed' }
  | { kind: 'module-skipped'; moduleId: GuideModule }
  | { kind: 'module-complete'; moduleId: GuideModule }
  | { kind: 'route-complete'; route: GuideRoute; partial: boolean }
  | { kind: 'keep-or-restore'; moduleId: GuideModule }
  | { kind: 'game-skipped' }
  | { kind: 'game-failed' }

export type GuidePresenter = 'none' | 'welcome' | 'driver' | 'cue' | 'game'

export type GuideView = {
  phase: GuidePhase
  presenter: GuidePresenter
  route: GuideRoute | null
  step: ResolvedGuideStep | null
  counter: { label: string; index: number; total: number } | null
  nextText: string
  canBack: boolean
  canSkipModule: boolean
  notice: GuideNotice | null
  busy: boolean
  practiceSignaled: boolean
  pose: GuidePose
  motion: GuideMotion
  motionNonce: number
  cueHost: HTMLElement | null
  welcomeVisible: boolean
  menuOpen: boolean
  hidden: boolean
  reduced: boolean
  paused: boolean
  progress: GuideProgress
}

export type GuideDeps = {
  catalog: GuideCatalog
  progress: ProgressStore
  leases: Pick<ScrollLeases, 'acquire'>
  adapters: GuideAdapters
  port: DriverPort
  gate?: RunGate
  report?: (error: unknown, where: string) => void
}

export type GuideController = {
  getView(): GuideView
  subscribe(listener: () => void): () => void
  showWelcome(): void
  chooseWelcome(choice: 'full' | 'quick' | 'explore' | 'skip'): Promise<void>
  start(route: GuideRoute, stepId?: string): Promise<void>
  resume(): Promise<void>
  next(): Promise<void>
  back(): Promise<void>
  confirmPractice(): Promise<void>
  skip(scope: 'step' | 'module' | 'guide'): Promise<void>
  pause(): Promise<void>
  cancel(): Promise<void>
  finish(): Promise<void>
  retry(): Promise<void>
  readAsText(): void
  resolveKeepRestore(choice: 'keep' | 'restore'): Promise<void>
  playGame(): Promise<void>
  skipGame(): Promise<void>
  gameEvent(event: GameGuideEvent): void
  relayout(refreshOnly?: boolean): void
  setMotion(motion: { reduced: boolean; paused: boolean }): void
  openMenu(): void
  closeMenu(): void
  toggleMenu(): void
  hideOwl(): void
  showOwl(): void
  dismissNotice(): void
  suspend(): void
  dispose(): void
}

const WELCOME_ID = 'I01'
const DEMO_MODULES: ReadonlySet<GuideModule> = new Set<GuideModule>(['lab', 'vietnam', 'policy'])
const PROMPT_MODULES: ReadonlySet<GuideModule> = new Set<GuideModule>(['lab', 'policy'])
const GAME_OFFER_ID = 'F04'

const presentable = (route: GuideRoute): readonly string[] => routeStepIds(route).filter((id) => id !== WELCOME_ID)

export function createGuideController(deps: GuideDeps): GuideController {
  const { catalog, progress, adapters, port, leases } = deps
  const gate = deps.gate ?? createRunGate()
  const report = deps.report ?? ((error: unknown, where: string) => { console.error(`[guide] ${where}`, error) })
  const listeners = new Set<() => void>()
  const baselines = new Map<GuideModule, DemoSnapshot>()
  const skippedModules = new Set<GuideModule>()
  let stepSnapshot: DemoSnapshot | null = null
  let releaseTour: (() => void) | null = null
  let stepAbort: AbortController | null = null
  let afterPrompt: (() => Promise<void>) | null = null
  let tearing: Promise<void> | null = null
  let toastTimer: ReturnType<typeof setTimeout> | null = null
  let disposed = false
  let gameDialogOpen = false
  let sessionOrigin: DemoSnapshot | null = null
  let restoreSessionPosition = false
  let pendingFullReprepare: { runId: number; stepId: string } | null = null
  let fullReprepareInFlight = false

  let view: GuideView = {
    phase: 'idle', presenter: 'none', route: null, step: null, counter: null, nextText: catalog.buttons.next,
    canBack: false, canSkipModule: false, notice: null, busy: false, practiceSignaled: false,
    pose: 'neutral', motion: 'none', motionNonce: 0, cueHost: null, welcomeVisible: false, menuOpen: false,
    hidden: false, reduced: false, paused: false, progress: progress.get(),
  }

  const emit = () => { listeners.forEach((listener) => listener()) }
  const set = (patch: Partial<GuideView>) => { view = { ...view, ...patch, progress: progress.get() }; emit() }
  progress.subscribe(() => { view = { ...view, progress: progress.get() }; emit() })

  const attempt = async (where: string, action: () => unknown) => {
    try { await action() } catch (error) { report(error, where) }
  }
  const attemptSync = (where: string, action: () => void) => {
    try { action() } catch (error) { report(error, where) }
  }

  const active = () => !disposed && view.step !== null && view.phase !== 'idle' && view.phase !== 'paused' && view.phase !== 'cancelled' && view.phase !== 'completed'
  // A scene change or a lost target leaves the cue paused with its own buttons; they have to keep working.
  const recoverable = () => !disposed && view.step !== null && view.phase === 'paused' && (view.notice?.kind === 'scene-changed' || view.notice?.kind === 'missing-target')
  const usable = () => active() || recoverable()
  const resolved = (id: string): ResolvedGuideStep => resolveStep(catalog.get(id), adapters.context())

  const nextStepId = (route: GuideRoute, id: string): string | null => {
    // The offer at the end of the finale opens the game guide whichever route is running (replaying only "Kết" included).
    if (id === GAME_OFFER_ID && route !== 'full' && route !== 'game' && !skippedModules.has('game')) return 'G01'
    const ids = presentable(route)
    for (let index = ids.indexOf(id) + 1; index > 0 && index < ids.length; index += 1) {
      const candidate = ids[index]
      if (!skippedModules.has(moduleOfStep(candidate)!)) return candidate
    }
    return null
  }
  const prevStepId = (route: GuideRoute, id: string): string | null => {
    const ids = presentable(route)
    const index = ids.indexOf(id)
    return index > 0 ? ids[index - 1] : null
  }

  const describe = (route: GuideRoute, step: ResolvedGuideStep) => {
    const moduleIds = presentable(step.moduleId)
    const isFirst = moduleIds[0] === step.id
    const isLast = moduleIds[moduleIds.length - 1] === step.id
    const next = nextStepId(route, step.id)
    const endsModule = isLast || !next || moduleOfStep(next) !== step.moduleId
    return {
      counter: catalog.counter(step.id),
      canBack: prevStepId(route, step.id) !== null,
      canSkipModule: isFirst || isLast,
      nextText: step.id === GAME_OFFER_ID ? 'Mở game và xem cách chơi' : endsModule ? 'Xong phần này' : catalog.buttons.next,
    }
  }

  const syncTourLease = (wanted: boolean) => {
    if (wanted && !releaseTour) releaseTour = leases.acquire('tour')
    else if (!wanted && releaseTour) { const release = releaseTour; releaseTour = null; attemptSync('lease', release) }
  }

  const endStepLayers = () => {
    stepAbort?.abort()
    stepAbort = null
    attemptSync('driver', () => port.destroy())
  }

  const restoreBaseline = (moduleId: GuideModule | null) => {
    if (!moduleId) return
    const snapshot = baselines.get(moduleId)
    if (!snapshot) return
    baselines.delete(moduleId)
    attemptSync('restore-demo', () => adapters.restoreDemo(snapshot))
  }

  const restoreOrigin = () => {
    const origin = sessionOrigin
    sessionOrigin = null
    if (!origin || !restoreSessionPosition) return
    attemptSync('restore-position', () => adapters.restorePosition?.(origin))
  }

  const enterModule = (moduleId: GuideModule) => {
    if (DEMO_MODULES.has(moduleId) && !baselines.has(moduleId)) baselines.set(moduleId, adapters.snapshotDemo())
  }

  const showToast = (notice: GuideNotice) => {
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { toastTimer = null; if (view.notice?.kind === notice.kind && view.phase === 'idle') set({ notice: null }) }, 8000)
  }

  async function present(step: ResolvedGuideStep, prepared: PreparedStep, run: GuideRun) {
    const info = describe(view.route!, step)
    const kind = prepared.mode ?? step.kind
    const scrollFree = prepared.scrollFree ?? step.scrollFree
    stepSnapshot = null
    const abort = new AbortController()
    stepAbort = abort
    run.signal.addEventListener('abort', () => abort.abort(), { once: true })
    if (kind === 'practice') {
      stepSnapshot = adapters.snapshotDemo()
      if (scrollFree) syncTourLease(false)
      set({ phase: 'practice', presenter: 'cue', notice: null, busy: false, practiceSignaled: false, pose: 'practice', motion: 'practice', motionNonce: view.motionNonce + 1, cueHost: null, ...info })
      adapters.practice(step, { signal: abort.signal }).then(() => {
        if (!run.isCurrent() || abort.signal.aborted || view.step?.id !== step.id) return
        set({ practiceSignaled: true, pose: 'confirm', motion: 'confirm', motionNonce: view.motionNonce + 1 })
      }, () => { /* aborted or the control vanished: the manual button stays available */ })
    } else if (kind === 'modal' || prepared.cueHost) {
      set({ phase: 'modal', presenter: 'cue', notice: null, busy: false, practiceSignaled: false, pose: step.pose, motion: step.motion, motionNonce: view.motionNonce + 1, cueHost: prepared.cueHost ?? null, ...info })
    } else {
      try { await port.load(run.signal) } catch (error) {
        if (!run.isCurrent()) return
        report(error, 'driver-load')
        set({ phase: 'presenting', presenter: 'cue', notice: { kind: 'driver-failed' }, busy: false, pose: step.pose, motion: 'none', cueHost: null, ...info })
        return
      }
      if (!run.isCurrent()) return
      if (!prepared.element) throw new GuideError('missing-target', step.target)
      if (scrollFree) syncTourLease(false)
      set({ phase: 'presenting', presenter: 'driver', notice: null, busy: false, practiceSignaled: false, pose: step.pose, motion: step.motion, motionNonce: view.motionNonce + 1, cueHost: null, ...info })
      port.present({
        step, element: prepared.element, counterText: `${info.counter.label} · ${String(info.counter.index).padStart(2, '0')} / ${String(info.counter.total).padStart(2, '0')}`,
        nextText: info.nextText, canBack: info.canBack, reduced: view.reduced || view.paused,
        extras: { skipModule: info.canSkipModule ? catalog.buttons.skipModule : null, pause: catalog.buttons.pause, skipGuide: catalog.buttons.skipGuide, skipGame: step.id === GAME_OFFER_ID ? 'Bỏ qua phần game' : null },
        handlers: {
          next: () => { void controller.next() }, back: () => { void controller.back() }, close: () => { void controller.cancel() },
          skipModule: () => { void controller.skip('module') }, pause: () => { void controller.pause() },
          skipGuide: () => { void controller.skip('guide') }, skipGame: () => { void controller.skipGame() },
        },
      })
    }
    adapters.watch?.(step, { signal: abort.signal, lost: (reason) => contextLost(reason, run) })
  }

  async function runFullReprepare(run: GuideRun, stepId: string) {
    if (fullReprepareInFlight || !run.isCurrent() || !active() || view.step?.id !== stepId) return
    fullReprepareInFlight = true
    pendingFullReprepare = null
    set({ busy: true })
    try { await go(stepId, 'relayout', run) }
    finally {
      fullReprepareInFlight = false
      await flushPendingFullReprepare(run)
    }
  }

  async function flushPendingFullReprepare(run: GuideRun) {
    if (fullReprepareInFlight) return
    const pending = pendingFullReprepare
    pendingFullReprepare = null
    if (!pending || pending.runId !== run.id || !run.isCurrent() || !active() || view.step?.id !== pending.stepId) return
    await runFullReprepare(run, pending.stepId)
  }

  async function go(stepId: string, reason: PrepareReason, run: GuideRun) {
    const route = view.route!
    const previousPractice = (reason === 'relayout' || reason === 'retry') && view.step?.id === stepId
      && (view.phase === 'practice' || (view.notice?.kind === 'missing-target' && stepSnapshot !== null))
      ? { snapshot: stepSnapshot, signaled: view.practiceSignaled } : null
    endStepLayers()
    stepSnapshot = null
    const step = resolved(stepId)
    if (step.scene === 'game') { handoffToGame(step); return }
    syncTourLease(true)
    enterModule(step.moduleId)
    set({
      phase: 'preparing', presenter: 'cue', step, notice: { kind: 'preparing' }, busy: true, practiceSignaled: false,
      pose: 'neutral', motion: 'none', cueHost: null, welcomeVisible: false, menuOpen: false, ...describe(route, step),
    })
    progress.update((current) => moveGuide(current, stepId))
    try {
      const prepared = await adapters.prepare(step, { signal: run.signal, reason })
      if (!run.isCurrent()) return
      if (prepared.redirect && prepared.redirect !== stepId && catalog.has(prepared.redirect)) { await go(prepared.redirect, reason, run); return }
      if (prepared.satisfied) { await advanceFrom(step, { complete: true }); return }
      await present(step, prepared, run)
      if (previousPractice && run.isCurrent() && view.phase === 'practice' && view.step?.id === stepId) {
        stepSnapshot = previousPractice.snapshot
        if (previousPractice.signaled) set({ practiceSignaled: true, pose: 'confirm', motion: 'none' })
      }
    } catch (error) {
      if (!run.isCurrent()) return
      const kind: GuideErrorKind = error instanceof GuideError ? error.kind : 'missing-target'
      if (kind === 'cancelled') return
      if (!(error instanceof GuideError)) report(error, 'prepare')
      if (previousPractice) stepSnapshot = previousPractice.snapshot
      set({ phase: 'preparing', presenter: 'cue', busy: false, practiceSignaled: previousPractice?.signaled ?? false, notice: { kind: 'missing-target', reason: kind } })
    } finally {
      await flushPendingFullReprepare(run)
    }
  }

  // The game guide runs inside the iframe; the parent only keeps the lease-free bookkeeping.
  function handoffToGame(step: ResolvedGuideStep) {
    syncTourLease(false)
    gameDialogOpen = true
    // A replay of a single module hands over as the game route, so closing the game later resumes at a step that route contains.
    const route: GuideRoute = view.route === 'full' ? 'full' : 'game'
    set({
      phase: 'modal', presenter: 'game', route, step, notice: null, busy: false, cueHost: null, practiceSignaled: false,
      pose: 'neutral', motion: 'none', welcomeVisible: false, menuOpen: false, ...describe(route, step),
    })
    progress.update((current) => beginGuide(current, route, step.id))
    if (adapters.game) adapters.game.open(step.id)
    else set({ presenter: 'cue', phase: 'idle', notice: { kind: 'game-failed' } })
  }

  function contextLost(reason: GuideLostReason, run: GuideRun) {
    if (!run.isCurrent() || !active()) return
    if (reason === 'modal-closed' || reason === 'action-done') {
      // The reader closed the dialog / pressed the highlighted control on purpose: that finishes the step.
      if (!view.busy && (view.phase === 'modal' || view.phase === 'presenting')) { stepAbort?.abort(); stepAbort = null; void controller.next() }
      return
    }
    endStepLayers()
    const notice: GuideNotice = reason === 'scene-changed' ? { kind: 'scene-changed' } : { kind: 'missing-target', reason: 'missing-target' }
    set({ phase: 'paused', presenter: 'cue', busy: false, cueHost: null, notice })
  }

  // Each cleanup has its own try/catch so one failure never blocks the next. Persisting happens last.
  async function teardown(mode: 'finish' | 'close' | 'pause' | 'skip-guide' | 'replace' | 'dispose'): Promise<void> {
    if (tearing) return tearing
    const hadStep = view.step
    const wasGame = view.presenter === 'game'
    tearing = (async () => {
      gate.cancelAll()
      pendingFullReprepare = null
      afterPrompt = null
      endStepLayers()
      syncTourLease(false)
      const moduleId = hadStep?.moduleId ?? null
      set({ phase: 'idle', presenter: 'none', busy: false, cueHost: null, practiceSignaled: false, notice: null, welcomeVisible: false })
      if (wasGame) attemptSync('game-cancel', () => adapters.game?.cancel('guide-only'))
      await attempt('close-modal', () => adapters.closeOwnedModal())
      if (mode !== 'finish') {
        if (stepSnapshot) attemptSync('restore-step', () => adapters.restoreDemo(stepSnapshot!))
        for (const key of [...baselines.keys()]) restoreBaseline(key)
        restoreBaseline(moduleId)
      }
      stepSnapshot = null
      baselines.clear()
      attemptSync('focus', () => adapters.restoreFocus())
      attemptSync('persist', () => {
        if (mode === 'pause') progress.update(pauseGuide)
        else if (mode === 'close' || (mode === 'dispose' && hadStep)) progress.update(closeGuide)
        else if (mode === 'skip-guide') progress.update((current) => (hadStep || current.status === 'in-progress' ? skipGuide(current) : dismissWelcome(current)))
        else if (mode === 'finish') progress.update(finishRoute)
      })
      if (mode === 'pause') set({ phase: 'paused', presenter: 'none', notice: { kind: 'paused' }, step: hadStep, route: view.route })
      else if (mode === 'close') set({ phase: 'cancelled', presenter: 'none', step: hadStep })
      else if (mode === 'skip-guide') { set({ phase: 'idle', step: null, route: null, counter: null, notice: { kind: 'skipped' }, pose: 'bye' as GuidePose, motion: 'none' }); showToast({ kind: 'skipped' }) }
      else if (mode === 'finish') set({ phase: 'completed', step: null, counter: null })
      else if (mode === 'replace' || mode === 'dispose') set({ step: null, route: null, counter: null })
      if (!wasGame && (mode === 'finish' || mode === 'close' || mode === 'pause' || mode === 'skip-guide')) restoreOrigin()
    })()
    try { await tearing } finally { tearing = null }
  }

  async function endRoute(route: GuideRoute, lastModule: GuideModule | null) {
    if (lastModule && PROMPT_MODULES.has(lastModule) && baselines.has(lastModule)) {
      afterPrompt = () => endRoute(route, null)
      endStepLayers()
      set({ phase: 'modal', presenter: 'cue', busy: false, notice: { kind: 'keep-or-restore', moduleId: lastModule }, cueHost: null })
      return
    }
    const finishedStep = view.step
    await teardown('finish')
    const partial = progress.get().skippedStepIds.length > 0 || route === 'quick'
    set({
      phase: 'completed', step: null,
      notice: route === 'full' || route === 'quick' ? { kind: 'route-complete', route, partial } : { kind: 'module-complete', moduleId: (route as GuideModule) },
      pose: 'confirm', motion: 'confirm', motionNonce: view.motionNonce + 1,
    })
    void finishedStep
  }

  async function advanceFrom(step: ResolvedGuideStep, options: { complete: boolean }) {
    const route = view.route!
    const run = gate.current()
    if (!run) { set({ busy: false }); return }
    if (options.complete) progress.update((current) => completeStep(current, step.id))
    const target = nextStepId(route, step.id)
    if (!target) { await endRoute(route, step.moduleId); return }
    if (moduleOfStep(target) !== step.moduleId && PROMPT_MODULES.has(step.moduleId) && baselines.has(step.moduleId)) {
      endStepLayers()
      afterPrompt = () => { const current = gate.current(); return current ? go(target, 'enter', current) : Promise.resolve() }
      set({ phase: 'modal', presenter: 'cue', busy: false, notice: { kind: 'keep-or-restore', moduleId: step.moduleId }, cueHost: null })
      return
    }
    await go(target, options.complete ? 'enter' : 'skip', run)
  }

  const controller: GuideController = {
    getView: () => view,
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener) } },

    showWelcome() {
      if (disposed || active()) return
      set({ welcomeVisible: true, menuOpen: false, hidden: false, presenter: 'welcome', pose: 'neutral', motion: 'welcome', motionNonce: view.motionNonce + 1 })
    },

    async chooseWelcome(choice) {
      if (disposed) return
      if (choice === 'full' || choice === 'quick') { set({ welcomeVisible: false, presenter: 'none' }); await controller.start(choice); return }
      set({ welcomeVisible: false, presenter: 'none', pose: 'bye' as GuidePose, motion: 'none' })
      progress.update(dismissWelcome)
      showToast({ kind: 'skipped' })
      set({ notice: { kind: 'skipped' } })
    },

    async start(route, stepId) {
      if (disposed) return
      if (view.step && view.phase !== 'idle' && view.phase !== 'completed' && view.phase !== 'cancelled' && view.phase !== 'paused') await teardown('replace')
      const ids = presentable(route)
      const first = stepId ?? ids[0]
      if (!catalog.has(first)) return
      const run = gate.begin()
      skippedModules.clear()
      // A baseline left over from a paused run is restored, not forgotten: the next one must snapshot the reader's own state.
      for (const key of [...baselines.keys()]) restoreBaseline(key)
      afterPrompt = null
      sessionOrigin = adapters.snapshotDemo()
      restoreSessionPosition = route !== 'full' && route !== 'quick' && route !== 'game'
      progress.update((current) => {
        let next = beginGuide(current, route, first)
        if ((route === 'full' || route === 'quick') && !next.completedStepIds.includes(WELCOME_ID)) next = completeStep(next, WELCOME_ID)
        return next
      })
      set({ route, welcomeVisible: false, menuOpen: false, hidden: false, notice: null })
      syncTourLease(true)
      void port.load(run.signal).catch(() => { /* surfaced when the first Driver step needs it */ })
      await go(first, 'enter', run)
    },

    async resume() {
      const target = resumeTarget(progress.get())
      if (!target) return
      await controller.start(target.route, target.stepId)
    },

    async next() {
      const step = view.step
      if (!active() || view.busy || !step || view.notice?.kind === 'keep-or-restore') return
      set({ busy: true })
      await advanceFrom(step, { complete: true })
    },

    async confirmPractice() {
      if (view.phase !== 'practice') return
      await controller.next()
    },

    async back() {
      const step = view.step
      const run = gate.current()
      if (!active() || view.busy || !step || !run || !view.route) return
      const target = prevStepId(view.route, step.id)
      if (!target) return
      set({ busy: true })
      if (stepSnapshot) attemptSync('restore-step', () => adapters.restoreDemo(stepSnapshot!))
      await go(target, 'back', run)
    },

    async skip(scope) {
      if (scope === 'guide') {
        await teardown('skip-guide')
        return
      }
      const step = view.step
      const route = view.route
      const run = gate.current()
      if (!usable() || !step || !route || !run) return
      if (scope === 'step') {
        if (view.busy && view.notice?.kind !== 'missing-target') return
        set({ busy: true })
        if (stepSnapshot) attemptSync('restore-step', () => adapters.restoreDemo(stepSnapshot!))
        progress.update((current) => skipStep(current, step.id))
        await advanceFrom(step, { complete: false })
        return
      }
      set({ busy: true })
      endStepLayers()
      skippedModules.add(step.moduleId)
      restoreBaseline(step.moduleId)
      attemptSync('close-modal', () => { void adapters.closeOwnedModal() })
      progress.update((current) => skipModule(current, step.moduleId))
      const target = route === 'full' ? nextStepId(route, step.id) : null
      if (target) { await go(target, 'enter', run); return }
      await teardown('finish')
      progress.update((current) => ({ ...current, status: 'skipped', lastExit: 'skip-module' }))
      set({ phase: 'completed', notice: { kind: 'module-skipped', moduleId: step.moduleId }, pose: 'bye' as GuidePose, motion: 'none' })
    },

    pause: () => teardown('pause'),
    cancel: () => teardown('close'),
    finish: () => teardown('finish'),

    async retry() {
      const step = view.step
      const run = gate.current()
      if (!usable() || !step || !run || view.busy) return
      set({ busy: true })
      await go(step.id, 'retry', run)
    },

    readAsText() {
      const step = view.step
      if (!usable() || !step) return
      endStepLayers()
      set({ phase: 'presenting', presenter: 'cue', notice: null, busy: false, pose: step.pose, motion: 'none' })
    },

    async resolveKeepRestore(choice) {
      const notice = view.notice
      if (notice?.kind !== 'keep-or-restore') return
      const moduleId = notice.moduleId
      if (choice === 'keep') baselines.delete(moduleId)
      else restoreBaseline(moduleId)
      const continuation = afterPrompt
      afterPrompt = null
      set({ notice: null, busy: true })
      if (continuation) await continuation()
    },

    async playGame() {
      if (view.step?.id === GAME_OFFER_ID) await controller.next()
    },

    async skipGame() {
      const step = view.step
      if (!active() || !step || step.id !== GAME_OFFER_ID) return
      await teardown('finish')
      progress.update(skipGameAtFinale)
      set({ phase: 'completed', step: null, route: 'full', notice: { kind: 'game-skipped' }, pose: 'bye' as GuidePose, motion: 'none' })
    },

    gameEvent(event) {
      if (disposed) return
      if (event.type === 'ready') { gameDialogOpen = true; return }
      if (view.presenter !== 'game' && !gameDialogOpen) return
      if (event.type === 'step') {
        const route: GuideRoute = view.route === 'full' ? 'full' : 'game'
        progress.update((current) => view.presenter === 'game' ? moveGuide(current, event.stepId) : beginGuide(current, route, event.stepId))
        if (catalog.has(event.stepId)) { const game = resolved(event.stepId); set({ route, presenter: 'game', phase: 'modal', step: game, notice: null, ...describe(route, game) }) }
      }
      else if (event.type === 'step-done') progress.update((current) => completeStep(current, event.stepId))
      else if (event.type === 'finished') { progress.update((current) => finishRoute(current)); set({ phase: 'completed', presenter: 'none', step: null, notice: { kind: 'route-complete', route: view.route ?? 'game', partial: progress.get().skippedStepIds.length > 0 } }) }
      else if (event.type === 'step-skipped') progress.update((current) => skipStep(current, event.stepId))
      else if (event.type === 'skipped' && event.scope === 'module') {
        progress.update((current) => ({ ...skipModule(current, 'game'), status: 'skipped', lastExit: 'skip-module' }))
        set({ phase: 'idle', presenter: 'none', step: null, notice: { kind: 'module-skipped', moduleId: 'game' } })
      } else if (event.type === 'skipped') { progress.update(skipGuide); set({ phase: 'idle', presenter: 'none', step: null, notice: { kind: 'skipped' } }); showToast({ kind: 'skipped' }) }
      else if (event.type === 'closed') {
        if (event.mode === 'dialog-closed') { gameDialogOpen = false; restoreOrigin() }
        if (view.presenter === 'game') {
          progress.update(closeGuide)
          set({ phase: 'cancelled', presenter: 'none', step: view.step })
        }
      } else if (event.type === 'failed') set({ phase: 'idle', presenter: 'none', notice: { kind: 'game-failed' } })
    },

    relayout(refreshOnly) {
      const step = view.step
      const run = gate.current()
      if (!active() || !step || !run) return
      if (view.busy || fullReprepareInFlight) {
        if (!refreshOnly) pendingFullReprepare = { runId: run.id, stepId: step.id }
        return
      }
      if (view.presenter === 'driver' && !refreshOnly) {
        void runFullReprepare(run, step.id)
      } else attemptSync('refresh', () => port.refresh())
    },

    setMotion(motion) {
      const reducedChanged = view.reduced !== motion.reduced
      set({ reduced: motion.reduced, paused: motion.paused })
      if (reducedChanged) {
        const step = view.step
        const run = gate.current()
        if (!active() || !step || !run) return
        if (view.busy || fullReprepareInFlight) pendingFullReprepare = { runId: run.id, stepId: step.id }
        else void runFullReprepare(run, step.id)
      } else if (port.isActive()) attemptSync('refresh', () => port.refresh())
    },

    openMenu() { set({ menuOpen: true, hidden: false }) },
    closeMenu() { set({ menuOpen: false }) },
    toggleMenu() { set({ menuOpen: !view.menuOpen, hidden: false }) },
    hideOwl() { set({ hidden: true, menuOpen: false }) },
    showOwl() { set({ hidden: false }) },
    dismissNotice() { if (view.phase === 'idle' || view.phase === 'completed' || view.phase === 'cancelled') set({ notice: null }) },

      // pagehide / hot unmount: layers and the lease go synchronously, the id being learned stays resumable.
      suspend() {
        if (!view.step || view.presenter === 'game') return
        gate.cancelAll()
        pendingFullReprepare = null
        afterPrompt = null
        endStepLayers()
        attemptSync('close-modal', () => adapters.closeOwnedModalSync())
        if (stepSnapshot) attemptSync('restore-step', () => adapters.restoreDemo(stepSnapshot!))
        for (const key of [...baselines.keys()]) restoreBaseline(key)
        stepSnapshot = null
        baselines.clear()
        syncTourLease(false)
        restoreOrigin()
        attemptSync('persist', () => progress.update(closeGuide))
        // A page restored from the back/forward cache must show the same state as ×: no dead cue, the owl offers to continue.
        set({ phase: 'cancelled', presenter: 'none', busy: false, cueHost: null, practiceSignaled: false, notice: null, welcomeVisible: false })
      },

    dispose() {
      if (disposed) return
      if (toastTimer) clearTimeout(toastTimer)
      void teardown('dispose').finally(() => { disposed = true; listeners.clear() })
    },
  }
  return controller
}

export { MODULE_ORDER }
