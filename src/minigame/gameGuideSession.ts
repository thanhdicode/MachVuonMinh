// Parent-side state machine for the game dialog <-> iframe guide link. Pure TypeScript with injected effects
// (frame, lease, timers, reports) so the teardown rules can be exercised under Node without a DOM.
import { envelope, parseChildMessage } from '../onboarding/gameGuideProtocol.ts'
import type { ChildMessage, GuideTeardownMode, IncomingEvent, ParentMessage } from '../onboarding/gameGuideProtocol.ts'
import type { GameGuideEvent } from '../onboarding/guideController.ts'

export type GameGuideReport = GameGuideEvent

export type SessionSnapshot = {
  guide: 'none' | 'pending' | 'active' | 'cancelling'
  // The parent toolbar always offers a text Skip while a guide is pending or active.
  skipVisible: boolean
  // Handshake timed out: the written how-to-play stays available and the game keeps running.
  fallback: boolean
  closed: boolean
}

export type FrameLike = { postMessage(message: unknown, targetOrigin: string): void }

export type SessionDeps = {
  nonce: string
  origin: string
  stepIds: ReadonlySet<string>
  startStepId: string | null
  hasGuide: boolean
  frameWindow(): unknown
  report(event: GameGuideEvent): void
  acquireLease(): () => void
  // Focus and scroll go back to the exhibit; only ever called for a real dialog close, once.
  onDialogClosed(): void
  // Asks the host to unmount the dialog (child Esc with no guide open).
  requestClose(): void
  onChange?(snapshot: SessionSnapshot): void
  timers?: { set(callback: () => void, ms: number): unknown; clear(handle: unknown): void }
  handshakeMs?: number
  loadWatchdogMs?: number
  cancelAckMs?: number
}

export type GameGuideSession = {
  start(): void
  frameLoaded(): void
  receive(event: IncomingEvent): void
  // Escape rule: the first Esc closes a pending/active guide only; with no guide the dialog closes.
  escape(): 'closed-guide' | 'close-dialog'
  // The toolbar Skip: works while the child is still loading.
  skipGuide(): void
  cancel(mode: GuideTeardownMode, options?: { silent?: boolean; resumable?: boolean }): void
  motion(reduced: boolean): void
  snapshot(): SessionSnapshot
  dispose(): void
}

const defaultTimers = {
  set: (callback: () => void, ms: number): unknown => globalThis.setTimeout(callback, ms),
  clear: (handle: unknown) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
}

export function createGameGuideSession(deps: SessionDeps): GameGuideSession {
  const timers = deps.timers ?? defaultTimers
  const handshakeMs = deps.handshakeMs ?? 6000
  const loadWatchdogMs = deps.loadWatchdogMs ?? 20000
  const cancelAckMs = deps.cancelAckMs ?? 1200

  let started = false
  let closed = false
  let release: (() => void) | null = null
  // waiting: a ready message may still start the guide. lapsed: skip/timeout/close happened, so a late ready is ignored.
  let handshake: 'idle' | 'waiting' | 'ready' | 'lapsed' = 'idle'
  let guide: SessionSnapshot['guide'] = 'none'
  let startPending = deps.hasGuide && deps.startStepId !== null
  let fallback = false
  let loads = 0
  let deadline: unknown = null
  let watchdog: unknown = null
  let ack: unknown = null
  let lastKey = ''

  const clear = (handle: unknown) => { if (handle !== null) timers.clear(handle) }
  const clearAll = () => { clear(deadline); clear(watchdog); clear(ack); deadline = watchdog = ack = null }
  const snapshot = (): SessionSnapshot => ({ guide, skipVisible: guide === 'pending' || guide === 'active', fallback, closed })
  const emit = () => {
    const current = snapshot()
    const key = JSON.stringify(current)
    if (key === lastKey) return
    lastKey = key
    deps.onChange?.(current)
  }
  const report = (event: GameGuideReport) => {
    if (!deps.hasGuide) return
    try {
      deps.report(event)
    } catch (error) {
      // A failing listener on the exhibit side must not stop the teardown that is running here.
      console.warn('[game-guide] report failed', error)
    }
  }
  const send = (message: ParentMessage) => {
    try {
      const frame = deps.frameWindow() as FrameLike | null
      frame?.postMessage(envelope(deps.nonce, message), deps.origin)
    } catch {
      // The frame may already be gone while the dialog unmounts; there is nothing left to tell.
    }
  }

  function onHandshakeTimeout() {
    deadline = watchdog = null
    if (closed || handshake !== 'waiting') return
    handshake = 'lapsed'
    if (startPending) {
      startPending = false
      guide = 'none'
      fallback = true
      report({ type: 'failed', reason: 'timeout' })
    }
    emit()
  }

  // guide-only: invalidate the handshake, tell the child, keep the dialog and the lease.
  function endGuide(resumable: boolean) {
    if (handshake === 'waiting') { handshake = 'lapsed'; clear(deadline); clear(watchdog); deadline = watchdog = null }
    startPending = false
    if (guide === 'active' || (guide === 'pending' && handshake === 'ready')) {
      guide = 'cancelling'
      send({ type: 'guide:cancel', mode: 'guide-only', resumable })
      clear(ack)
      ack = timers.set(() => { ack = null; if (guide === 'cancelling') { guide = 'none'; emit() } }, cancelAckMs)
    } else {
      guide = 'none'
    }
    emit()
  }

  function closeDialog(silent: boolean) {
    if (closed) return
    closed = true
    handshake = 'lapsed'
    startPending = false
    guide = 'none'
    try {
      clearAll()
      if (started && deps.hasGuide) send({ type: 'guide:cancel', mode: 'dialog-closed', resumable: false })
    } finally {
      const lease = release
      release = null
      try {
        lease?.()
      } finally {
        try {
          deps.onDialogClosed()
        } finally {
          if (!silent) report({ type: 'closed', mode: 'dialog-closed' })
          emit()
        }
      }
    }
  }

  const escape = (): 'closed-guide' | 'close-dialog' => {
    if (closed) return 'close-dialog'
    if (guide === 'pending' || guide === 'active') {
      endGuide(true)
      report({ type: 'closed', mode: 'guide-only' })
      return 'closed-guide'
    }
    return guide === 'cancelling' ? 'closed-guide' : 'close-dialog'
  }

  function handle(message: ChildMessage) {
    switch (message.type) {
      case 'guide:ready':
        if (handshake !== 'waiting') return
        clear(deadline); clear(watchdog); deadline = watchdog = null
        handshake = 'ready'
        report({ type: 'ready' })
        if (startPending && guide === 'pending') {
          startPending = false
          send({ type: 'guide:start', stepId: deps.startStepId })
        }
        break
      case 'guide:step':
        if (guide === 'cancelling') return
        guide = 'active'
        report({ type: 'step', stepId: message.stepId })
        break
      case 'guide:step-done':
        report({ type: 'step-done', stepId: message.stepId })
        break
      case 'guide:step-skipped':
        report({ type: 'step-skipped', stepId: message.stepId })
        break
      case 'guide:done':
        guide = 'none'
        startPending = false
        report({ type: 'finished' })
        break
      case 'guide:skipped':
        guide = 'none'
        startPending = false
        report({ type: 'skipped', scope: message.scope })
        break
      case 'guide:closed':
        if (guide === 'cancelling') { guide = 'none'; clear(ack); ack = null } else { guide = 'none'; startPending = false; report({ type: 'closed', mode: 'guide-only' }) }
        break
      case 'guide:failed':
        guide = 'none'
        startPending = false
        report({ type: 'failed', reason: message.reason })
        break
      case 'guide:exit':
        if (escape() === 'close-dialog') deps.requestClose()
        break
    }
    emit()
  }

  return {
    start() {
      if (started || closed) return
      started = true
      release = deps.acquireLease()
      if (deps.hasGuide) {
        handshake = 'waiting'
        if (startPending) guide = 'pending'
        watchdog = timers.set(onHandshakeTimeout, loadWatchdogMs)
      }
      emit()
    },
    frameLoaded() {
      if (closed || !started || !deps.hasGuide) return
      loads += 1
      clear(watchdog); watchdog = null
      if (loads > 1) {
        // Reloaded in place: the previous child is gone, so whatever it was showing has ended. A new child must not auto-start.
        const wasLive = guide !== 'none'
        guide = 'none'
        startPending = false
        handshake = 'waiting'
        if (wasLive) report({ type: 'closed', mode: 'guide-only' })
      }
      if (handshake === 'waiting') { clear(deadline); deadline = timers.set(onHandshakeTimeout, handshakeMs) }
      emit()
    },
    receive(event) {
      if (closed) return
      const message = parseChildMessage(event, { frame: deps.frameWindow(), origin: deps.origin, nonce: deps.nonce, stepIds: deps.stepIds })
      if (message) handle(message)
    },
    escape,
    skipGuide() {
      if (closed) return
      const live = guide !== 'none' || startPending
      endGuide(false)
      if (live) report({ type: 'skipped' })
    },
    cancel(mode, options = {}) {
      if (mode === 'dialog-closed') {
        closeDialog(options.silent ?? false)
        return
      }
      if (closed) return
      const live = guide !== 'none' || startPending
      endGuide(options.resumable ?? false)
      if (live && !options.silent) report({ type: 'closed', mode: 'guide-only' })
    },
    motion(reduced) {
      if (closed || handshake !== 'ready') return
      send({ type: 'guide:motion', reduced })
    },
    snapshot,
    dispose() { closeDialog(false) },
  }
}
