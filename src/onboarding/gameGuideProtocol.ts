// Pure protocol between the exhibit (parent window) and the game guide that runs inside the srcdoc iframe.
// No DOM and no React here, so Node tests can import it. Every message is an envelope { type, nonce, ...fields }.
import type { GameGuideLink } from './gameGuideLink.ts'
import type { GuideButtons, GuideMotionToken, GuideStep } from './guideTypes.ts'

export const GAME_GUIDE_PROTOCOL_VERSION = 1

export type GuideTeardownMode = 'guide-only' | 'dialog-closed'
export type GuideSkipScope = 'guide' | 'module'

// iframe -> exhibit
export type ChildMessage =
  | { type: 'guide:ready' }
  | { type: 'guide:step'; stepId: string }
  | { type: 'guide:step-done'; stepId: string }
  | { type: 'guide:step-skipped'; stepId: string }
  | { type: 'guide:done' }
  | { type: 'guide:skipped'; scope: GuideSkipScope }
  | { type: 'guide:closed'; mode: 'guide-only' }
  | { type: 'guide:failed'; reason: 'timeout' | 'load' }
  | { type: 'guide:exit' }

// exhibit -> iframe
export type ParentMessage =
  | { type: 'guide:start'; stepId: string | null }
  | { type: 'guide:cancel'; mode: GuideTeardownMode; resumable: boolean }
  | { type: 'guide:motion'; reduced: boolean }

export type Envelope<T> = T & { nonce: string }

export const CHILD_MESSAGE_TYPES = [
  'guide:ready', 'guide:step', 'guide:step-done', 'guide:step-skipped', 'guide:done',
  'guide:skipped', 'guide:closed', 'guide:failed', 'guide:exit',
] as const satisfies readonly ChildMessage['type'][]

export const PARENT_MESSAGE_TYPES = ['guide:start', 'guide:cancel', 'guide:motion'] as const satisfies readonly ParentMessage['type'][]

export type IncomingEvent = { source: unknown; origin: string; data: unknown }

export type MessageContext = {
  // The iframe's contentWindow; messages from any other window are dropped.
  frame: unknown
  // Explicit origin passed by the exhibit. `about:srcdoc` inherits the creator origin, but nothing is assumed from the child.
  origin: string
  nonce: string
  stepIds: ReadonlySet<string>
}

const STEP_ID = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/
const NONCE = /^[0-9a-f]{32}$/

// Messages may come from another realm (the iframe), so compare by tag rather than by prototype identity.
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && Object.prototype.toString.call(value) === '[object Object]'

function sameKeys(data: Record<string, unknown>, allowed: readonly string[]): boolean {
  const keys = Object.keys(data)
  return keys.length === allowed.length && allowed.every((key) => Object.prototype.hasOwnProperty.call(data, key))
}

function equalSecret(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index)
  return diff === 0
}

export const isNonce = (value: unknown): value is string => typeof value === 'string' && NONCE.test(value)

// `random` fills the buffer in place, like crypto.getRandomValues.
export function createNonce(random: (bytes: Uint8Array<ArrayBuffer>) => unknown = (bytes) => globalThis.crypto.getRandomValues(bytes)): string {
  const bytes = new Uint8Array(16)
  random(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function envelope<T extends ChildMessage | ParentMessage>(nonce: string, message: T): Envelope<T> {
  return { ...message, nonce }
}

function readStepId(data: Record<string, unknown>, stepIds: ReadonlySet<string>): string | null {
  const value = data.stepId
  return typeof value === 'string' && STEP_ID.test(value) && stepIds.has(value) ? value : null
}

// Returns a clean copy of an accepted message, or null. Unknown types, unknown fields, wrong frame/origin/nonce all fail closed.
export function parseChildMessage(event: IncomingEvent, ctx: MessageContext): ChildMessage | null {
  if (!ctx.frame || event.source !== ctx.frame) return null
  if (typeof event.origin !== 'string' || event.origin !== ctx.origin) return null
  const data = event.data
  if (!isPlainObject(data)) return null
  if (typeof data.nonce !== 'string' || !equalSecret(data.nonce, ctx.nonce)) return null
  const type = data.type
  if (typeof type !== 'string' || !(CHILD_MESSAGE_TYPES as readonly string[]).includes(type)) return null
  switch (type) {
    case 'guide:ready':
    case 'guide:done':
    case 'guide:exit':
      return sameKeys(data, ['type', 'nonce']) ? { type } : null
    case 'guide:step':
    case 'guide:step-done':
    case 'guide:step-skipped': {
      if (!sameKeys(data, ['type', 'nonce', 'stepId'])) return null
      const stepId = readStepId(data, ctx.stepIds)
      return stepId ? { type, stepId } : null
    }
    case 'guide:skipped':
      return sameKeys(data, ['type', 'nonce', 'scope']) && (data.scope === 'guide' || data.scope === 'module') ? { type, scope: data.scope } : null
    case 'guide:closed':
      return sameKeys(data, ['type', 'nonce', 'mode']) && data.mode === 'guide-only' ? { type, mode: 'guide-only' } : null
    case 'guide:failed':
      return sameKeys(data, ['type', 'nonce', 'reason']) && (data.reason === 'timeout' || data.reason === 'load') ? { type, reason: data.reason } : null
    default:
      return null
  }
}

// Mirror of the validator the iframe runs (game-guide.js cannot import this file); tests run both against the same fixtures.
export function parseParentMessage(event: IncomingEvent, ctx: { parent: unknown; origin: string; nonce: string; stepIds: ReadonlySet<string> }): ParentMessage | null {
  if (!ctx.parent || event.source !== ctx.parent) return null
  if (typeof event.origin !== 'string' || event.origin !== ctx.origin) return null
  const data = event.data
  if (!isPlainObject(data)) return null
  if (typeof data.nonce !== 'string' || !equalSecret(data.nonce, ctx.nonce)) return null
  const type = data.type
  if (typeof type !== 'string' || !(PARENT_MESSAGE_TYPES as readonly string[]).includes(type)) return null
  if (type === 'guide:start') {
    if (!sameKeys(data, ['type', 'nonce', 'stepId'])) return null
    if (data.stepId === null) return { type, stepId: null }
    const stepId = readStepId(data, ctx.stepIds)
    return stepId ? { type, stepId } : null
  }
  if (type === 'guide:cancel') {
    if (!sameKeys(data, ['type', 'nonce', 'mode', 'resumable'])) return null
    if ((data.mode !== 'guide-only' && data.mode !== 'dialog-closed') || typeof data.resumable !== 'boolean') return null
    return { type, mode: data.mode, resumable: data.resumable }
  }
  if (type === 'guide:motion') {
    return sameKeys(data, ['type', 'nonce', 'reduced']) && typeof data.reduced === 'boolean' ? { type, reduced: data.reduced } : null
  }
  return null
}

// What the iframe needs, trimmed from the exhibit catalog. Development-only fields (action/observe/completion) never leave the parent.
export type GameChildStep = Pick<GuideStep, 'id' | 'title' | 'say' | 'pose' | 'motion' | 'target' | 'kind'> & { variants?: GuideStep['variants'] }

export type GameChildGuide = {
  startStepId: string | null
  steps: GameChildStep[]
  buttons: GuideButtons
  systemCopy: Record<string, string>
  motionTokens: Record<string, GuideMotionToken>
  assetBase: string
  vendorBase: string
  reduced: boolean
  driverDeadlineMs: number
}

export type GameChildConfig = {
  version: typeof GAME_GUIDE_PROTOCOL_VERSION
  nonce: string
  origin: string
  guide: GameChildGuide | null
}

export const DRIVER_DEADLINE_MS = 6000

export function buildChildConfig(options: { nonce: string; origin: string; link: GameGuideLink | null | undefined }): GameChildConfig {
  const { nonce, origin, link } = options
  return {
    version: GAME_GUIDE_PROTOCOL_VERSION,
    nonce,
    origin,
    guide: link
      ? {
          startStepId: link.startStepId,
          steps: link.steps.map((step) => ({
            id: step.id, title: step.title, say: step.say, pose: step.pose, motion: step.motion, target: step.target, kind: step.kind,
            ...(step.variants ? { variants: step.variants.map((variant) => ({ ...variant })) } : {}),
          })),
          buttons: { ...link.buttons },
          systemCopy: { ...link.systemCopy },
          motionTokens: Object.fromEntries(Object.entries(link.motionTokens).map(([key, token]) => [key, { ...token }])),
          assetBase: link.assetBase,
          vendorBase: link.vendorBase,
          reduced: link.reduced,
          driverDeadlineMs: DRIVER_DEADLINE_MS,
        }
      : null,
  }
}

// JSON that is safe inside an inline <script>: no closing tags, comment openers or line-separator characters.
export function scriptSafeJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
