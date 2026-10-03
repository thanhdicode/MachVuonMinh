// Pure session helpers (no DOM, no React) so the lifecycle rules can be tested under Node.

export type ScrollOwner = 'tour' | 'game' | 'dialog'

export type ScrollLeases = {
  acquire(owner: ScrollOwner): () => void
  isLocked(): boolean
  isHeldBy(owner: ScrollOwner): boolean
  counts(): Record<ScrollOwner, number>
}

export function createScrollLeases(apply: (locked: boolean) => void): ScrollLeases {
  const held = new Map<symbol, ScrollOwner>()
  let locked = false
  const sync = () => {
    const next = held.size > 0
    if (next === locked) return
    locked = next
    apply(locked)
  }
  return {
    acquire(owner) {
      const token = Symbol(owner)
      held.set(token, owner)
      sync()
      let released = false
      return () => {
        if (released) return
        released = true
        held.delete(token)
        sync()
      }
    },
    isLocked: () => locked,
    isHeldBy: (owner) => [...held.values()].includes(owner),
    counts: () => {
      const totals: Record<ScrollOwner, number> = { tour: 0, game: 0, dialog: 0 }
      held.forEach((owner) => { totals[owner] += 1 })
      return totals
    },
  }
}

export const canResumeScroll = (state: { unlocked: boolean; leasesLocked: boolean }): boolean => state.unlocked && !state.leasesLocked

export type GuideRun = {
  readonly id: number
  readonly signal: AbortSignal
  isCurrent(): boolean
  cancel(): void
}

export type RunGate = {
  begin(): GuideRun
  current(): GuideRun | null
  cancelAll(): void
}

// Every start/transition owns a generation; late promises compare against it before mutating anything.
export function createRunGate(): RunGate {
  let counter = 0
  let active: { id: number; controller: AbortController; run: GuideRun } | null = null
  const gate: RunGate = {
    begin() {
      active?.controller.abort()
      const id = ++counter
      const controller = new AbortController()
      const run: GuideRun = {
        id,
        signal: controller.signal,
        isCurrent: () => active?.id === id,
        cancel: () => {
          if (active?.id !== id) return
          active = null
          controller.abort()
        },
      }
      active = { id, controller, run }
      return run
    },
    current: () => active?.run ?? null,
    cancelAll() {
      const previous = active
      active = null
      counter += 1
      previous?.controller.abort()
    },
  }
  return gate
}

// Fields a demo may change. Sound, motion pause, reduced motion and the intro unlock are never owned.
export type DemoFields = {
  automation: number
  forces: number[]
  relations: number[]
  evidenceCase: number
  evidenceLens: number
  farmStage: number
  slots: (number | null)[]
  reconfigure: number
}

export const DEMO_KEYS: readonly (keyof DemoFields)[] = ['automation', 'forces', 'relations', 'evidenceCase', 'evidenceLens', 'farmStage', 'slots', 'reconfigure']

export type DemoSnapshot = { fields: DemoFields; scrollY: number; era: number | null }

export function captureDemo(state: DemoFields, position: { scrollY?: number; era?: number | null } = {}): DemoSnapshot {
  return {
    fields: {
      automation: state.automation,
      forces: [...state.forces],
      relations: [...state.relations],
      evidenceCase: state.evidenceCase,
      evidenceLens: state.evidenceLens,
      farmStage: state.farmStage,
      slots: [...state.slots],
      reconfigure: state.reconfigure,
    },
    scrollY: position.scrollY ?? 0,
    era: position.era ?? null,
  }
}

// Returns fresh arrays so restoring never aliases the stored snapshot.
export function demoRestorePatch(snapshot: DemoSnapshot): DemoFields {
  const { fields } = snapshot
  return { ...fields, forces: [...fields.forces], relations: [...fields.relations], slots: [...fields.slots] }
}

export const demoEquals = (a: DemoFields, b: DemoFields): boolean => JSON.stringify(a) === JSON.stringify(b)

export type EscapeContext = {
  dialogOpen: boolean
  menuOpen: boolean
  welcomeVisible: boolean
  presenter: string
  phase: string
  focusInCue: boolean
}
export type EscapeAction = 'ignore' | 'close-menu' | 'skip-welcome' | 'cancel'

// Escape belongs to the topmost layer: an open native dialog, then the owl menu, then the welcome, then the guide itself.
export function escapeAction(context: EscapeContext): EscapeAction {
  if (context.dialogOpen) return 'ignore'
  if (context.menuOpen) return 'close-menu'
  if (context.welcomeVisible) return 'skip-welcome'
  // Nothing on the page is being practised while the guide waits or shows its written fallback, so Escape closes it wherever focus is.
  const waiting = context.phase === 'preparing' || (context.phase === 'presenting' && context.presenter === 'cue')
  if (context.presenter === 'driver' || (context.presenter === 'cue' && (context.focusInCue || waiting))) return 'cancel'
  return 'ignore'
}
