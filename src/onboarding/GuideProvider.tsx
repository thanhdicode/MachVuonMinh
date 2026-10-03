import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { acquireScrollLease } from '../experience/WorldTimeline'
import { timeline as _timeline, useWorld } from '../experience/WorldState'
import { createGuideCatalog } from './guideCatalog.ts'
import type { GuideCatalog } from './guideCatalog.ts'
import { createGuideAdapters } from './guideAdapters.ts'
import { createGuideController } from './guideController.ts'
import type { DriverPort, GuideController } from './guideController.ts'
import type { GameGuideHandle, GameGuideLink } from './gameGuideLink.ts'
import type { PopoverHosts } from './guideDriver.ts'
import { GuideApiContext, createGuideRegistry } from './guideControls.ts'
import type { GuideApi } from './guideControls.ts'
import { createProgressStore } from './guideProgress.ts'
import { escapeAction } from './guideSession.ts'
import { waitForTarget, waitUntil } from './guideTargets.ts'
import type { GuideModule } from './guideTypes.ts'
import { GuideCue } from './GuideCue.tsx'
import { GuideDock } from './GuideDock.tsx'
import { GuidePopoverPortal } from './GuidePopover.tsx'
import { GuideWelcome } from './GuideWelcome.tsx'
import './guide.css'

void _timeline
const BASE = import.meta.env.BASE_URL
const DRIVER_BASE = `${BASE}vendor/driver/1.8.0/`
const timeoutScale = () => Number((globalThis as { __machGuideTimeoutScale?: number }).__machGuideTimeoutScale) || 1

type Runtime = { controller: GuideController; catalog: GuideCatalog }

function currentModule(): GuideModule {
  if (document.body.classList.contains('mini-game-open')) return 'game'
  const state = useWorld.getState()
  if (state.history) return 'history'
  if (state.active === 0) return 'intro'
  if (state.active <= 4) return 'production'
  return (['lab', 'vietnam', 'policy', 'finale'] as const)[Math.min(state.active, 8) - 5]
}

export function GuideProvider({ children }: { children: ReactNode }) {
  const registry = useMemo(createGuideRegistry, [])
  const [runtime, setRuntime] = useState<Runtime | null>(null)
  const [popover, setPopover] = useState<PopoverHosts | null>(null)
  const [gameStart, setGameStart] = useState<string | null>(null)
  const handle = useRef<GameGuideHandle | null>(null)
  const keyboard = useRef(false)
  const controllerRef = useRef<GuideController | null>(null)
  const [owlFailed, setOwlFailed] = useState(false)
  const onOwlFailed = useCallback(() => setOwlFailed(true), [])

  useEffect(() => {
    let catalog: GuideCatalog
    try { catalog = createGuideCatalog() } catch (error) { console.error('[guide] catalog rejected, the guide is disabled', error); return }
    const progress = createProgressStore()
    const adapters = createGuideAdapters({
      registry,
      ui: { showOwl: () => controllerRef.current?.showOwl(), focusReturn: () => focusReturn(), keyboardModality: () => keyboard.current },
      game: {
        open: (stepId) => { setGameStart(stepId); registry.get('app')?.openGame() },
        cancel: (mode) => handle.current?.cancel(mode),
      },
    })
    let loading: Promise<typeof import('./guideDriver.ts')> | null = null
    let driver: ReturnType<typeof import('./guideDriver.ts').createDriverRuntime> | null = null
    const port: DriverPort = {
      async load(signal) {
        if (driver) return
        loading ??= import('./guideDriver.ts')
        const result: { module: typeof import('./guideDriver.ts') | null; failure: { error: unknown } | null } = { module: null, failure: null }
        loading.then((module) => { result.module = module }, (error) => { result.failure = { error } })
        // A hung request must not leave the reader on "preparing": after the deadline the written fallback takes over.
        await waitUntil(() => result.module !== null || result.failure !== null, { signal, timeoutMs: 5000 * timeoutScale() })
        if (result.failure) { loading = null; throw result.failure.error }
        driver ??= result.module!.createDriverRuntime(setPopover, { back: catalog.buttons.back })
      },
      present: (args) => driver?.present(args),
      refresh: () => driver?.refresh(),
      destroy: () => driver?.destroy(),
      isActive: () => driver?.isActive() ?? false,
    }
    const controller = createGuideController({ catalog, progress, leases: { acquire: acquireScrollLease }, adapters, port })
    controllerRef.current = controller
    setRuntime({ controller, catalog })

    const returnTo = document.activeElement instanceof HTMLElement ? document.activeElement : null
    function focusReturn() {
      const dock = document.querySelector<HTMLElement>('.mach-guide-dock__button')
      const target = dock ?? (returnTo?.isConnected ? returnTo : null)
      target?.focus({ preventScroll: true })
    }

    const abort = new AbortController()
    const deadline = setTimeout(() => abort.abort(), 5000)
    void (async () => {
      if (progress.get().status !== 'new') return
      try {
        const fonts = document.fonts?.ready ?? Promise.resolve()
        const expired = new Promise<never>((_, reject) => abort.signal.addEventListener('abort', () => reject(new Error('welcome deadline')), { once: true }))
        await Promise.race([Promise.all([fonts, waitForTarget({ name: 'intro-thread' }, { signal: abort.signal, timeoutMs: 5000 })]), expired])
        if (document.hidden) await new Promise<void>((resolve) => document.addEventListener('visibilitychange', () => resolve(), { once: true }))
        if (abort.signal.aborted || useWorld.getState().unlocked || progress.get().status !== 'new') return
        controller.showWelcome()
      } catch { /* deadline or cancellation: the guide stays available from the owl */ }
    })()

    const motion = () => controller.setMotion({ reduced: useWorld.getState().reduced, paused: useWorld.getState().paused })
    motion()
    const unsubscribeWorld = useWorld.subscribe((state, previous) => { if (state.reduced !== previous.reduced || state.paused !== previous.paused) motion() })
    let frame = 0
    // A phone's URL bar resizes the viewport while scrolling; only a width change can alter the layout, so only that re-prepares the step.
    let width = innerWidth
    const relayout = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => { const widthChanged = innerWidth !== width; width = innerWidth; controller.relayout(!widthChanged) })
    }
    const pagehide = () => controller.suspend()
    const onKeyDown = (event: KeyboardEvent) => {
      if (['Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(event.key)) keyboard.current = true
      if (event.key !== 'Escape' || event.defaultPrevented) return
      const view = controller.getView()
      const action = escapeAction({
        dialogOpen: !!document.querySelector('dialog[open]'), menuOpen: view.menuOpen, welcomeVisible: view.welcomeVisible,
        presenter: view.presenter, phase: view.phase, focusInCue: !!document.activeElement?.closest?.('[data-guide-cue]'),
      })
      if (action === 'ignore') return
      event.preventDefault()
      if (action === 'close-menu') controller.closeMenu()
      else if (action === 'skip-welcome') void controller.skip('guide')
      else void controller.cancel()
    }
    const onPointer = () => { keyboard.current = false }
    window.addEventListener('resize', relayout)
    window.addEventListener('pagehide', pagehide)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('pointerdown', onPointer, true)
    return () => {
      clearTimeout(deadline)
      abort.abort()
      cancelAnimationFrame(frame)
      unsubscribeWorld()
      window.removeEventListener('resize', relayout)
      window.removeEventListener('pagehide', pagehide)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pointerdown', onPointer, true)
      controllerRef.current = null
      controller.dispose()
      driver?.destroy()
      setRuntime(null)
      setPopover(null)
    }
  }, [registry])

  // The game guide follows the in-app motion toggle while it is running, not only at hand-off.
  const motionOff = useWorld((state) => state.reduced || state.paused)
  const api = useMemo<GuideApi>(() => {
    const gameLink: GameGuideLink | null = runtime ? {
      startStepId: gameStart,
      steps: runtime.catalog.route('game'),
      buttons: runtime.catalog.buttons,
      systemCopy: runtime.catalog.systemCopy,
      motionTokens: runtime.catalog.motionTokens,
      assetBase: `${BASE}guide/`,
      vendorBase: DRIVER_BASE,
      reduced: motionOff,
      report: (event) => runtime.controller.gameEvent(event),
      attach: (next) => { handle.current = next; return () => { if (handle.current === next) handle.current = null } },
    } : null
    return {
      registry,
      gameLink,
      openReplayMenu: () => { runtime?.controller.showOwl(); runtime?.controller.openMenu() },
      openGame: () => {
        const view = runtime?.controller.getView()
        if (runtime && view?.step?.id === 'F04' && view.presenter === 'driver') void runtime.controller.playGame()
        else registry.get('app')?.openGame()
      },
      notifyGame: (open) => { if (!open) setGameStart(null) },
    }
  }, [registry, runtime, gameStart, motionOff])

  return (
    <GuideApiContext.Provider value={api}>
      {children}
      {runtime && <GuideLayer runtime={runtime} popover={popover} onOwlFailed={onOwlFailed} owlFailed={owlFailed} />}
    </GuideApiContext.Provider>
  )
}

function GuideLayer({ runtime, popover, onOwlFailed, owlFailed }: { runtime: Runtime; popover: PopoverHosts | null; onOwlFailed: () => void; owlFailed: boolean }) {
  const { controller, catalog } = runtime
  const view = useSyncExternalStore(controller.subscribe, controller.getView)
  const unlocked = useWorld((state) => state.unlocked)
  const running = view.phase === 'preparing' || view.phase === 'presenting' || view.phase === 'practice' || view.phase === 'modal'
  const cueVisible = !view.welcomeVisible && view.presenter !== 'driver' && view.presenter !== 'game' && (view.notice !== null || (running && view.step !== null))
  const dockVisible = !view.hidden && !view.welcomeVisible && view.presenter !== 'game'
  void unlocked
  return (
    <div className="mach-guide-root" data-owl-failed={owlFailed || undefined}>
      {view.welcomeVisible && <GuideWelcome view={view} controller={controller} catalog={catalog} onOwlFailed={onOwlFailed} />}
      {cueVisible && <GuideCue view={view} controller={controller} catalog={catalog} currentModule={currentModule} onOwlFailed={onOwlFailed} />}
      {view.presenter === 'driver' && <GuidePopoverPortal hosts={popover} view={view} catalog={catalog} onOwlFailed={onOwlFailed} />}
      {dockVisible && <GuideDock view={view} controller={controller} catalog={catalog} currentModule={currentModule} />}
    </div>
  )
}
