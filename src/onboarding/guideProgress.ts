import { ALL_STEP_IDS, MODULE_ORDER, MODULE_STEP_IDS, canonicalIndex, isModuleId, isRoute, isStepId, moduleOfStep } from './guideIds.ts'
import type { GuideLastExit, GuideModule, GuideProgress, GuideRoute, GuideStatus } from './guideTypes.ts'

export const GUIDE_STORAGE_KEY = 'mach-vuon-minh:guide:v2'
export const GUIDE_LEGACY_STORAGE_KEY = 'mach-vuon-minh:guide:v1'

export type GuideStorage = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem?(key: string): void
}

const STATUSES: readonly GuideStatus[] = ['new', 'in-progress', 'dismissed', 'skipped', 'completed']
const EXITS: readonly GuideLastExit[] = ['pause', 'skip-guide', 'skip-module', 'close']

export function createProgress(): GuideProgress {
  return { schemaVersion: 2, status: 'new', route: null, moduleId: null, stepId: null, completedStepIds: [], completedModules: [], skippedStepIds: [], skippedModuleIds: [], lastExit: null }
}

const ordered = (ids: Iterable<unknown>): string[] => [...new Set(ids)].filter(isStepId).sort((a, b) => canonicalIndex(a) - canonicalIndex(b))

export function completedModulesOf(done: Iterable<string>): GuideModule[] {
  const set = new Set(done)
  return MODULE_ORDER.filter((moduleId) => MODULE_STEP_IDS[moduleId].every((id) => set.has(id)))
}

// Single enforcement point for the invariants: monotonic completed, disjoint skipped, derived modules.
export function normalizeProgress(input: GuideProgress): GuideProgress {
  const completedStepIds = ordered(input.completedStepIds)
  const done = new Set(completedStepIds)
  const skippedStepIds = ordered(input.skippedStepIds).filter((id) => !done.has(id))
  const completedModules = completedModulesOf(done)
  const skippedModuleIds = MODULE_ORDER.filter((moduleId) => input.skippedModuleIds.includes(moduleId) && !completedModules.includes(moduleId))
  const stepId = isStepId(input.stepId) ? input.stepId : null
  const moduleId = stepId ? (moduleOfStep(stepId) ?? null) : isModuleId(input.moduleId) ? input.moduleId : null
  return { ...input, schemaVersion: 2, completedStepIds, completedModules, skippedStepIds, skippedModuleIds, stepId, moduleId }
}

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])
const isStatus = (value: unknown): value is GuideStatus => STATUSES.includes(value as GuideStatus)
const isExit = (value: unknown): value is GuideLastExit => EXITS.includes(value as GuideLastExit)

export function sanitizeGuideProgress(value: unknown): GuideProgress | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (raw.schemaVersion !== 2 || !isStatus(raw.status)) return null
  let progress = normalizeProgress({
    ...createProgress(),
    status: raw.status,
    route: isRoute(raw.route) ? raw.route : null,
    moduleId: isModuleId(raw.moduleId) ? raw.moduleId : null,
    stepId: isStepId(raw.stepId) ? raw.stepId : null,
    completedStepIds: asArray(raw.completedStepIds).filter(isStepId),
    skippedStepIds: asArray(raw.skippedStepIds).filter(isStepId),
    skippedModuleIds: asArray(raw.skippedModuleIds).filter(isModuleId),
    lastExit: isExit(raw.lastExit) ? raw.lastExit : null,
  })
  // A stale in-progress step must not make the welcome greet someone who already chose.
  if (progress.status === 'in-progress' && !progress.stepId) progress = { ...progress, status: 'dismissed', route: null, moduleId: null, lastExit: null }
  return progress
}

export function migrateLegacyProgress(value: unknown): GuideProgress | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const modules = asArray(raw.completedModules).filter(isModuleId)
  const completedStepIds = modules.flatMap((moduleId) => MODULE_STEP_IDS[moduleId])
  const stepId = isStepId(raw.stepId) ? raw.stepId : null
  let status: GuideStatus = isStatus(raw.status) ? raw.status : modules.length ? 'dismissed' : 'new'
  if (status === 'in-progress' && !stepId) status = 'dismissed'
  const keepsStep = status === 'in-progress' || status === 'skipped'
  return normalizeProgress({
    ...createProgress(),
    status,
    route: keepsStep && isRoute(raw.route) ? raw.route : null,
    stepId: keepsStep ? stepId : null,
    completedStepIds,
  })
}

function browserStorage(): GuideStorage | null {
  try { return globalThis.localStorage ?? null } catch { return null }
}

function safeGet(storage: GuideStorage | null, key: string): string | null {
  if (!storage) return null
  try { return storage.getItem(key) } catch { return null }
}

function safeParse(text: string | null): unknown {
  if (text === null) return null
  try { return JSON.parse(text) } catch { return null }
}

export function readGuideProgress(storage?: GuideStorage | null): GuideProgress {
  const store = storage === undefined ? browserStorage() : storage
  const current = sanitizeGuideProgress(safeParse(safeGet(store, GUIDE_STORAGE_KEY)))
  if (current) return current
  const legacy = migrateLegacyProgress(safeParse(safeGet(store, GUIDE_LEGACY_STORAGE_KEY)))
  return legacy ?? createProgress()
}

export function writeGuideProgress(storage: GuideStorage | null | undefined, progress: GuideProgress): boolean {
  const store = storage === undefined ? browserStorage() : storage
  if (!store) return false
  try { store.setItem(GUIDE_STORAGE_KEY, JSON.stringify(normalizeProgress(progress))) } catch { return false }
  // The legacy key is only dropped after the v2 write succeeded.
  try { store.removeItem?.(GUIDE_LEGACY_STORAGE_KEY) } catch { /* harmless */ }
  return true
}

export type ProgressStore = {
  get(): GuideProgress
  set(next: GuideProgress): void
  update(change: (current: GuideProgress) => GuideProgress): void
  subscribe(listener: () => void): () => void
  isPersisted(): boolean
}

export function createProgressStore(storage?: GuideStorage | null): ProgressStore {
  const target = storage === undefined ? browserStorage() : storage
  let current = readGuideProgress(target)
  let persisted = target !== null
  const listeners = new Set<() => void>()
  const set = (next: GuideProgress) => {
    current = normalizeProgress(next)
    persisted = writeGuideProgress(target, current)
    listeners.forEach((listener) => listener())
  }
  return {
    get: () => current,
    set,
    update: (change) => set(change(current)),
    subscribe: (listener) => { listeners.add(listener); return () => { listeners.delete(listener) } },
    isPersisted: () => persisted,
  }
}

// ---- Pure transitions -------------------------------------------------------------------------

export function beginGuide(progress: GuideProgress, route: GuideRoute, stepId: string): GuideProgress {
  return normalizeProgress({ ...progress, status: 'in-progress', route, stepId, lastExit: null })
}

export function moveGuide(progress: GuideProgress, stepId: string): GuideProgress {
  return normalizeProgress({ ...progress, stepId })
}

export function completeStep(progress: GuideProgress, stepId: string): GuideProgress {
  if (!isStepId(stepId)) return progress
  return normalizeProgress({ ...progress, completedStepIds: [...progress.completedStepIds, stepId] })
}

export function skipStep(progress: GuideProgress, stepId: string): GuideProgress {
  if (!isStepId(stepId) || progress.completedStepIds.includes(stepId)) return progress
  return normalizeProgress({ ...progress, skippedStepIds: [...progress.skippedStepIds, stepId] })
}

export function skipModule(progress: GuideProgress, moduleId: GuideModule): GuideProgress {
  const pending = MODULE_STEP_IDS[moduleId].filter((id) => !progress.completedStepIds.includes(id))
  return normalizeProgress({
    ...progress,
    skippedStepIds: [...progress.skippedStepIds, ...pending],
    skippedModuleIds: pending.length ? [...progress.skippedModuleIds, moduleId] : progress.skippedModuleIds,
    lastExit: 'skip-module',
  })
}

export function skipGuide(progress: GuideProgress): GuideProgress {
  return normalizeProgress({ ...progress, status: 'skipped', lastExit: 'skip-guide' })
}

export function dismissWelcome(progress: GuideProgress): GuideProgress {
  return normalizeProgress({ ...progress, status: 'dismissed', route: null, moduleId: null, stepId: null, lastExit: null })
}

export function pauseGuide(progress: GuideProgress): GuideProgress {
  if (!progress.stepId) return progress
  return normalizeProgress({ ...progress, status: 'in-progress', lastExit: 'pause' })
}

export function closeGuide(progress: GuideProgress): GuideProgress {
  if (!progress.stepId) return progress
  return normalizeProgress({ ...progress, status: 'in-progress', lastExit: 'close' })
}

export function finishRoute(progress: GuideProgress): GuideProgress {
  return normalizeProgress({ ...progress, status: 'completed', moduleId: null, stepId: null, lastExit: null })
}

// Chosen at F04: the finale was seen, the game part was declined and stays resumable from G01.
export function skipGameAtFinale(progress: GuideProgress): GuideProgress {
  const done = completeStep(progress, 'F04')
  const afterSteps = MODULE_STEP_IDS.game.reduce((current, id) => skipStep(current, id), done)
  const gameIncomplete = !afterSteps.completedModules.includes('game')
  return normalizeProgress({
    ...afterSteps,
    status: 'skipped',
    route: 'full',
    moduleId: 'game',
    stepId: 'G01',
    skippedModuleIds: gameIncomplete ? [...afterSteps.skippedModuleIds, 'game'] : afterSteps.skippedModuleIds,
    lastExit: 'skip-module',
  })
}

export function resumeTarget(progress: GuideProgress): { route: GuideRoute; stepId: string; moduleId: GuideModule } | null {
  if (progress.status !== 'in-progress' && progress.status !== 'skipped') return null
  if (!progress.stepId) return null
  return { route: progress.route ?? 'full', stepId: progress.stepId, moduleId: moduleOfStep(progress.stepId)! }
}

export const allStepCount = ALL_STEP_IDS.length
