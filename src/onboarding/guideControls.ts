import { createContext, useContext, useEffect, useRef } from 'react'
import type { GameGuideLink } from './gameGuideLink.ts'

// Capabilities the real UI exposes to the guide while it is mounted. The registry is owned by GuideProvider.
export type GuideControls = {
  app: {
    openMenu(): void
    closeDrawer(): void
    openSource(index: number, mode: 'source' | 'history'): void
    drawer(): 'menu' | 'source' | 'history' | null
    openGame(): void
  }
  history: { openZoom(index: number): void; closeZoom(): void; zoomOpen(): boolean }
  vietnam: { openMap(): void; closeMap(): void; mapOpen(): boolean; sourceIndex(): number }
}

export type GuideRegistry = {
  register<K extends keyof GuideControls>(key: K, controls: GuideControls[K]): () => void
  get<K extends keyof GuideControls>(key: K): GuideControls[K] | undefined
}

export function createGuideRegistry(): GuideRegistry {
  const slots = new Map<keyof GuideControls, unknown>()
  return {
    register(key, controls) {
      slots.set(key, controls)
      return () => { if (slots.get(key) === controls) slots.delete(key) }
    },
    get: (key) => slots.get(key) as never,
  }
}

export type GuideApi = {
  registry: GuideRegistry
  gameLink: GameGuideLink | null
  openReplayMenu(): void
  // Opens the mini game; while the tour is on the game offer it hands off to the game guide.
  openGame(): void
  notifyGame(open: boolean): void
}

export const GuideApiContext = createContext<GuideApi | null>(null)
export const useGuideApi = () => useContext(GuideApiContext)

// Registers stable wrappers that always call the latest closures, so components never re-register per render.
export function useGuideControls<K extends keyof GuideControls>(key: K, controls: GuideControls[K]) {
  const registry = useGuideApi()?.registry
  const latest = useRef(controls)
  latest.current = controls
  useEffect(() => {
    if (!registry) return
    const stable = Object.fromEntries(Object.keys(latest.current as object).map((name) => [name, (...args: unknown[]) => (latest.current as Record<string, (...a: unknown[]) => unknown>)[name](...args)])) as GuideControls[K]
    return registry.register(key, stable)
  }, [registry, key])
}
