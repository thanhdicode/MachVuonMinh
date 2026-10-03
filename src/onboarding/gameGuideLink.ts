import type { GameGuideEvent } from './guideController.ts'
import type { GuideButtons, GuideMotionToken, GuideStep } from './guideTypes.ts'

export type GameGuideHandle = {
  // guide-only: Skip/timeout, the game dialog and its lease stay. dialog-closed: the game is really closing.
  cancel(mode: 'guide-only' | 'dialog-closed'): void
}

// Everything the iframe guide needs, built by the exhibit guide from the single copy catalog.
export type GameGuideLink = {
  // Step the exhibit tour wants to start at, or null when the game was opened without a tour (launcher only).
  startStepId: string | null
  steps: readonly GuideStep[]
  buttons: GuideButtons
  systemCopy: Record<string, string>
  motionTokens: Record<string, GuideMotionToken>
  // `${BASE_URL}guide/` for owl-*.webp and `${BASE_URL}vendor/driver/1.8.0/` for the copied Driver files.
  assetBase: string
  vendorBase: string
  reduced: boolean
  report(event: GameGuideEvent): void
  attach(handle: GameGuideHandle): () => void
}
