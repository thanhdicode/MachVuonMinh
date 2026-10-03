export const GUIDE_MODULES = ['intro', 'history', 'production', 'lab', 'vietnam', 'policy', 'finale', 'game'] as const
export type GuideModule = (typeof GUIDE_MODULES)[number]
export type GuideRoute = 'quick' | 'full' | GuideModule
export type GuidePhase = 'idle' | 'preparing' | 'presenting' | 'practice' | 'modal' | 'handoff' | 'paused' | 'completed' | 'cancelled'
export type GuideStatus = 'new' | 'in-progress' | 'dismissed' | 'skipped' | 'completed'
export type GuideLastExit = 'pause' | 'skip-guide' | 'skip-module' | 'close'

export type GuideProgress = {
  schemaVersion: 2
  status: GuideStatus
  route: GuideRoute | null
  moduleId: GuideModule | null
  stepId: string | null
  completedStepIds: string[]
  completedModules: GuideModule[]
  skippedStepIds: string[]
  skippedModuleIds: GuideModule[]
  lastExit: GuideLastExit | null
}

export type GuidePose = 'neutral' | 'point-left' | 'point-right' | 'inspect' | 'practice' | 'confirm' | 'bye'
export type GuideMotion = 'welcome' | 'read' | 'point' | 'inspect' | 'practice' | 'confirm' | 'exit' | 'none'
export type GuideStepKind = 'read' | 'practice' | 'modal'
export type GuideScene = number | 'history' | 'game'
export type GuideVariantKey = 'history-static' | 'audio-on' | 'case-farm' | 'keyboard' | 'quiz-no-hearts' | 'boss-final'
export type GuideContext = Partial<Record<GuideVariantKey, boolean>>

export type GuideVariant = { when: GuideVariantKey; say: string; action?: string; pose?: GuidePose; motion?: GuideMotion }

export type GuideCopyStep = {
  id: string
  title: string
  say: string
  // Authoring notes from the canonical catalog; stripped from the production bundle.
  action?: string
  observe?: string
  completion?: string
  pose: GuidePose
  motion: GuideMotion
  variants?: GuideVariant[]
}

export type GuideStep = GuideCopyStep & {
  moduleId: GuideModule
  scene: GuideScene
  target: string
  kind: GuideStepKind
  scrollFree: boolean
}

export type ResolvedGuideStep = GuideStep & { variant: GuideVariantKey | null }

export type GuideButtons = {
  next: string
  back: string
  practiceDone: string
  skipStep: string
  skipModule: string
  skipGuide: string
  pause: string
  resume: string
  replay: string
}

export type GuideMotionToken = {
  durationMs: number
  translateY?: number
  rotationDeg?: number
  opacity?: [number, number]
  ease?: string
  repeat: number
  trigger?: string
}
