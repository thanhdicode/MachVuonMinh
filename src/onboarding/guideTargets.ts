import { GuideError } from './guideController.ts'

export type Box = { left: number; top: number; width: number; height: number }

export type TargetEnv = {
  query(selector: string): HTMLElement[]
  isRendered(element: HTMLElement): boolean
  rect(element: HTMLElement): Box
  viewport(): { width: number; height: number }
  now(): number
  raf(callback: () => void): number
  caf(id: number): void
  hidden(): boolean
  onVisibility(callback: () => void): () => void
}

export const domEnv: TargetEnv = {
  query: (selector) => Array.from(document.querySelectorAll<HTMLElement>(selector)),
  isRendered: (element) => element.isConnected && (typeof element.checkVisibility === 'function'
    ? element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
    : element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden'),
  rect: (element) => { const r = element.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height } },
  viewport: () => ({ width: window.innerWidth, height: window.innerHeight }),
  now: () => performance.now(),
  raf: (callback) => requestAnimationFrame(() => callback()),
  caf: (id) => cancelAnimationFrame(id),
  hidden: () => document.hidden,
  onVisibility: (callback) => { document.addEventListener('visibilitychange', callback); return () => document.removeEventListener('visibilitychange', callback) },
}

const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export type TargetQuery = { name: string; where?: (element: HTMLElement) => boolean }

function visibleSpan(start: number, size: number, limit: number) {
  return Math.max(0, Math.min(start + size, limit) - Math.max(start, 0))
}

// A target counts only when it is rendered AND really inside the viewport (a stale off-screen caption does not).
export function findVisibleTarget(query: TargetQuery, env: TargetEnv = domEnv): HTMLElement | null {
  if (!NAME.test(query.name)) throw new Error(`Invalid guide target name: ${query.name}`)
  const viewport = env.viewport()
  let best: HTMLElement | null = null
  let bestArea = 0
  for (const element of env.query(`[data-guide~="${query.name}"]`)) {
    if (!env.isRendered(element)) continue
    if (query.where && !query.where(element)) continue
    const box = env.rect(element)
    const width = visibleSpan(box.left, box.width, viewport.width)
    const height = visibleSpan(box.top, box.height, viewport.height)
    if (width < 4 || height < 4) continue
    if (width * height > bestArea) { best = element; bestArea = width * height }
  }
  return best
}

export type WaitOptions = { signal: AbortSignal; timeoutMs?: number; stableFrames?: number; env?: TargetEnv }

const sameBox = (a: Box, b: Box) => Math.abs(a.left - b.left) < 1 && Math.abs(a.top - b.top) < 1 && Math.abs(a.width - b.width) < 1 && Math.abs(a.height - b.height) < 1

// Resolves with a visible, layout-stable target; the deadline only counts time while the tab is visible.
export function waitForTarget(query: TargetQuery, options: WaitOptions): Promise<HTMLElement> {
  const env = options.env ?? domEnv
  const timeoutMs = options.timeoutMs ?? 5000
  const stableFrames = options.stableFrames ?? 2
  return new Promise<HTMLElement>((resolve, reject) => {
    if (options.signal.aborted) { reject(new GuideError('cancelled')); return }
    let frame = 0
    let last: HTMLElement | null = null
    let lastBox: Box | null = null
    let stable = 0
    let elapsed = 0
    let lastTick = env.now()
    let sawRendered = false
    let finished = false
    const stopVisibility = env.onVisibility(() => { lastTick = env.now() })
    const finish = (settle: () => void) => {
      if (finished) return
      finished = true
      env.caf(frame)
      stopVisibility()
      options.signal.removeEventListener('abort', onAbort)
      settle()
    }
    const onAbort = () => finish(() => reject(new GuideError('cancelled')))
    options.signal.addEventListener('abort', onAbort, { once: true })
    const tick = () => {
      const now = env.now()
      if (!env.hidden()) elapsed += now - lastTick
      lastTick = now
      const element = findVisibleTarget(query, env)
      if (element) {
        sawRendered = true
        const box = env.rect(element)
        if (element === last && lastBox && sameBox(box, lastBox)) stable += 1
        else { stable = 1; last = element; lastBox = box }
        if (stable >= stableFrames) { finish(() => resolve(element)); return }
      } else { last = null; lastBox = null; stable = 0 }
      if (elapsed >= timeoutMs) { finish(() => reject(new GuideError(sawRendered ? 'timeout' : 'missing-target', query.name))); return }
      frame = env.raf(tick)
    }
    frame = env.raf(tick)
  })
}

// Polls a real state predicate each frame (no blind sleeps); aborts and freezes its deadline like waitForTarget.
export function waitUntil(predicate: () => boolean, options: WaitOptions): Promise<void> {
  const env = options.env ?? domEnv
  const timeoutMs = options.timeoutMs ?? 5000
  return new Promise<void>((resolve, reject) => {
    if (options.signal.aborted) { reject(new GuideError('cancelled')); return }
    let frame = 0
    let elapsed = 0
    let lastTick = env.now()
    let finished = false
    const stopVisibility = env.onVisibility(() => { lastTick = env.now() })
    const finish = (settle: () => void) => {
      if (finished) return
      finished = true
      env.caf(frame)
      stopVisibility()
      options.signal.removeEventListener('abort', onAbort)
      settle()
    }
    const onAbort = () => finish(() => reject(new GuideError('cancelled')))
    options.signal.addEventListener('abort', onAbort, { once: true })
    const tick = () => {
      const now = env.now()
      if (!env.hidden()) elapsed += now - lastTick
      lastTick = now
      let ok = false
      try { ok = predicate() } catch { ok = false }
      if (ok) { finish(resolve); return }
      if (elapsed >= timeoutMs) { finish(() => reject(new GuideError('timeout'))); return }
      frame = env.raf(tick)
    }
    frame = env.raf(tick)
  })
}
