import type { GuideModule, GuideRoute } from './guideTypes.ts'
import { GUIDE_MODULES } from './guideTypes.ts'

const range = (prefix: string, count: number): string[] => Array.from({ length: count }, (_, i) => `${prefix}${String(i + 1).padStart(2, '0')}`)

export const MODULE_ORDER: readonly GuideModule[] = GUIDE_MODULES

export const MODULE_STEP_IDS: Readonly<Record<GuideModule, readonly string[]>> = {
  intro: range('I', 6),
  history: range('H', 8),
  production: range('T', 5),
  lab: range('L', 15),
  vietnam: range('V', 11),
  policy: range('P', 11),
  finale: range('F', 4),
  game: range('G', 10),
}

// Narrative order: the tool scene (T01) comes before the Atlas, the rest of production after it.
export const FULL_ROUTE_IDS: readonly string[] = [
  ...MODULE_STEP_IDS.intro,
  'T01',
  ...MODULE_STEP_IDS.history,
  ...MODULE_STEP_IDS.production.slice(1),
  ...MODULE_STEP_IDS.lab,
  ...MODULE_STEP_IDS.vietnam,
  ...MODULE_STEP_IDS.policy,
  ...MODULE_STEP_IDS.finale,
  ...MODULE_STEP_IDS.game,
]

export const ALL_STEP_IDS: readonly string[] = FULL_ROUTE_IDS

const owner = new Map<string, GuideModule>()
const position = new Map<string, number>()
MODULE_ORDER.forEach((moduleId) => MODULE_STEP_IDS[moduleId].forEach((id) => owner.set(id, moduleId)))
ALL_STEP_IDS.forEach((id, index) => position.set(id, index))

export const moduleOfStep = (id: string): GuideModule | undefined => owner.get(id)
export const isStepId = (value: unknown): value is string => typeof value === 'string' && owner.has(value)
export const isModuleId = (value: unknown): value is GuideModule => typeof value === 'string' && (GUIDE_MODULES as readonly string[]).includes(value)
export const isRoute = (value: unknown): value is GuideRoute => value === 'quick' || value === 'full' || isModuleId(value)
export const canonicalIndex = (id: string): number => position.get(id) ?? Number.MAX_SAFE_INTEGER

export function routeStepIds(route: GuideRoute): readonly string[] {
  if (route === 'full') return FULL_ROUTE_IDS
  if (route === 'quick') return MODULE_STEP_IDS.intro
  return MODULE_STEP_IDS[route]
}

export function nextModule(moduleId: GuideModule): GuideModule | null {
  return MODULE_ORDER[MODULE_ORDER.indexOf(moduleId) + 1] ?? null
}
