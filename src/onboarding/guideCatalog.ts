import copyJson from './guideCopy.json' with { type: 'json' }
import { ALL_STEP_IDS, FULL_ROUTE_IDS, MODULE_ORDER, MODULE_STEP_IDS, moduleOfStep, routeStepIds } from './guideIds.ts'
import type {
  GuideButtons,
  GuideContext,
  GuideCopyStep,
  GuideModule,
  GuideMotion,
  GuideMotionToken,
  GuidePose,
  GuideRoute,
  GuideScene,
  GuideStep,
  GuideStepKind,
  GuideVariantKey,
  ResolvedGuideStep,
} from './guideTypes.ts'

type Wiring = { scene: GuideScene; target: string; kind: GuideStepKind; scrollFree: boolean }
const w = (scene: GuideScene, target: string, kind: GuideStepKind = 'read', scrollFree = false): Wiring => ({ scene, target, kind, scrollFree })

// `target` is the value of the `data-guide` attribute added to the real UI (or its DOM proxy).
export const STEP_WIRING: Readonly<Record<string, Wiring>> = {
  I01: w(0, 'welcome', 'modal'),
  I02: w(0, 'intro-thread', 'practice'),
  I03: w(0, 'intro-next', 'read', true),
  I04: w(1, 'menu-trigger'),
  I05: w(1, 'menu-settings', 'modal'),
  I06: w(1, 'guide-replay'),
  H01: w('history', 'history-overview', 'read', true),
  H02: w('history', 'history-era-nav'),
  H03: w('history', 'history-next-prev'),
  H04: w('history', 'history-caption'),
  H05: w('history', 'history-audio'),
  H06: w('history', 'history-inspect', 'modal'),
  H07: w('history', 'history-source', 'modal'),
  H08: w('history', 'history-machine-cta'),
  T01: w(1, 'agrarian-observation', 'read', true),
  T02: w(2, 'machine-system', 'read', true),
  T03: w(3, 'automation-range', 'practice'),
  T04: w(3, 'automation-roles'),
  T05: w(4, 'data-observation'),
  L01: w(5, 'lab-core'),
  L02: w(5, 'lab-technology', 'practice'),
  L03: w(5, 'lab-data', 'practice'),
  L04: w(5, 'lab-skills', 'practice'),
  L05: w(5, 'lab-infrastructure', 'practice'),
  L06: w(5, 'lab-automation', 'practice'),
  L07: w(5, 'lab-relations'),
  L08: w(5, 'lab-ownership', 'practice'),
  L09: w(5, 'lab-organization', 'practice'),
  L10: w(5, 'lab-distribution', 'practice'),
  L11: w(5, 'lab-status'),
  L12: w(5, 'lab-preset-fit'),
  L13: w(5, 'lab-preset-ahead'),
  L14: w(5, 'lab-preset-rigid'),
  L15: w(5, 'lab-preset-adapt', 'practice'),
  V01: w(6, 'vietnam-cases'),
  V02: w(6, 'farm-before'),
  V03: w(6, 'farm-after'),
  V04: w(6, 'farm-cooperation'),
  V05: w(6, 'case-factory'),
  V06: w(6, 'relation-ownership'),
  V07: w(6, 'relation-organization'),
  V08: w(6, 'relation-distribution'),
  V09: w(6, 'case-digital'),
  V10: w(6, 'case-source', 'modal'),
  V11: w(6, 'case-map', 'modal'),
  P01: w(7, 'policy-instruction', 'practice'),
  P02: w(7, 'policy-skills'),
  P03: w(7, 'policy-data-rights'),
  P04: w(7, 'policy-data-governance'),
  P05: w(7, 'policy-sandbox'),
  P06: w(7, 'policy-reward'),
  P07: w(7, 'policy-infrastructure'),
  P08: w(7, 'policy-inclusion'),
  P09: w(7, 'policy-sockets', 'practice'),
  P10: w(7, 'policy-result'),
  P11: w(7, 'policy-retry', 'practice'),
  F01: w(8, 'finale-thesis'),
  F02: w(8, 'finale-lab'),
  F03: w(8, 'finale-source', 'modal'),
  F04: w(8, 'finale-game'),
  G01: w('game', 'game-start'),
  G02: w('game', 'game-jump', 'practice'),
  G03: w('game', 'game-duck', 'practice'),
  G04: w('game', 'game-pause'),
  G05: w('game', 'game-hud'),
  G06: w('game', 'game-hearts'),
  G07: w('game', 'game-quiz-help'),
  G08: w('game', 'game-boss-help'),
  G09: w('game', 'game-next-retry-help'),
  G10: w('game', 'game-guide-replay'),
}

export const MODULE_LABELS: Readonly<Record<GuideModule, string>> = {
  intro: 'MỞ ĐẦU',
  history: 'ATLAS',
  production: 'CÔNG CỤ & MÁY',
  lab: 'LAB',
  vietnam: 'VIỆT NAM',
  policy: 'CÔNG NGHỆ & QUAN HỆ',
  finale: 'KẾT',
  game: 'GAME',
}

export const MODULE_TITLES: Readonly<Record<GuideModule, string>> = {
  intro: 'Mở đầu và điều hướng',
  history: 'Atlas lịch sử',
  production: 'Công cụ, máy móc và dữ liệu',
  lab: 'Phòng biện chứng',
  vietnam: 'Việt Nam và bằng chứng',
  policy: 'Công nghệ mới, quan hệ mới',
  finale: 'Kết thúc triển lãm',
  game: 'Minigame',
}

const POSES: readonly GuidePose[] = ['neutral', 'point-left', 'point-right', 'inspect', 'practice', 'confirm', 'bye']
const MOTIONS: readonly GuideMotion[] = ['welcome', 'read', 'point', 'inspect', 'practice', 'confirm', 'exit', 'none']
const VARIANTS: readonly GuideVariantKey[] = ['history-static', 'audio-on', 'case-farm', 'keyboard', 'quiz-no-hearts', 'boss-final']

export type GuideCopySource = {
  buttons: GuideButtons
  systemCopy: Record<string, string>
  motionTokens: Record<string, GuideMotionToken>
  steps: unknown[]
}

export type GuideCatalog = {
  get(id: string): GuideStep
  has(id: string): boolean
  list(): readonly GuideStep[]
  route(route: GuideRoute): readonly GuideStep[]
  next(route: GuideRoute, id: string): GuideStep | null
  prev(route: GuideRoute, id: string): GuideStep | null
  counter(id: string): { moduleId: GuideModule; label: string; index: number; total: number }
  buttons: GuideButtons
  systemCopy: Record<string, string>
  motionTokens: Record<string, GuideMotionToken>
}

function problem(list: string[], condition: boolean, message: string) {
  if (!condition) list.push(message)
}

// Maps the canonical copy JSON onto runtime steps and refuses to start with a broken catalog.
export function createGuideCatalog(source: GuideCopySource = copyJson as unknown as GuideCopySource): GuideCatalog {
  const problems: string[] = []
  const seen = new Set<string>()
  const byId = new Map<string, GuideStep>()
  for (const raw of source.steps as GuideCopyStep[]) {
    const id = raw?.id
    if (typeof id !== 'string') { problems.push('step without id'); continue }
    if (seen.has(id)) { problems.push(`duplicate id ${id}`); continue }
    seen.add(id)
    const wiring = STEP_WIRING[id]
    const moduleId = moduleOfStep(id)
    problem(problems, !!wiring && !!moduleId, `unknown step ${id}`)
    for (const field of ['title', 'say'] as const) {
      problem(problems, typeof raw[field] === 'string' && raw[field].trim().length > 0, `${id}.${field} is empty`)
    }
    for (const field of ['action', 'observe', 'completion'] as const) {
      problem(problems, raw[field] === undefined || (typeof raw[field] === 'string' && raw[field].trim().length > 0), `${id}.${field} is empty`)
    }
    problem(problems, POSES.includes(raw.pose), `${id}.pose ${String(raw.pose)} is not a known pose`)
    problem(problems, MOTIONS.includes(raw.motion), `${id}.motion ${String(raw.motion)} is not a known motion`)
    for (const variant of raw.variants ?? []) {
      problem(problems, VARIANTS.includes(variant.when), `${id} variant ${String(variant.when)} is not allowed`)
      problem(problems, typeof variant.say === 'string' && variant.say.length > 0, `${id} variant ${variant.when} has no text`)
    }
    if (wiring && moduleId) byId.set(id, { ...raw, moduleId, ...wiring })
  }
  problem(problems, source.steps.length === 70, `expected 70 steps, found ${source.steps.length}`)
  for (const id of ALL_STEP_IDS) problem(problems, seen.has(id), `missing step ${id}`)
  if (problems.length) throw new Error(`Invalid guide catalog: ${problems.join('; ')}`)

  const get = (id: string): GuideStep => {
    const step = byId.get(id)
    if (!step) throw new Error(`Unknown guide step ${id}`)
    return step
  }
  const route = (name: GuideRoute) => routeStepIds(name).map(get)
  return {
    get,
    has: (id) => byId.has(id),
    list: () => FULL_ROUTE_IDS.map(get),
    route,
    next(name, id) {
      const ids = routeStepIds(name)
      const index = ids.indexOf(id)
      return index >= 0 && index + 1 < ids.length ? get(ids[index + 1]) : null
    },
    prev(name, id) {
      const ids = routeStepIds(name)
      const index = ids.indexOf(id)
      return index > 0 ? get(ids[index - 1]) : null
    },
    counter(id) {
      const moduleId = moduleOfStep(id)!
      const ids = MODULE_STEP_IDS[moduleId]
      return { moduleId, label: MODULE_LABELS[moduleId], index: ids.indexOf(id) + 1, total: ids.length }
    },
    buttons: source.buttons,
    systemCopy: source.systemCopy,
    motionTokens: source.motionTokens,
  }
}

export { MODULE_ORDER }

// Picks the variant whose control/context is really visible; the catalog text is never duplicated elsewhere.
export function resolveStep(step: GuideStep, context: GuideContext = {}): ResolvedGuideStep {
  const variant = step.variants?.find((candidate) => context[candidate.when])
  if (!variant) return { ...step, variant: null }
  return {
    ...step,
    say: variant.say,
    action: variant.action ?? step.action,
    pose: variant.pose ?? step.pose,
    motion: variant.motion ?? step.motion,
    variant: variant.when,
  }
}
