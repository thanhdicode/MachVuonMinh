import { useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { GuideCatalog } from './guideCatalog.ts'
import type { GuideView } from './guideController.ts'
import type { PopoverHosts } from './guideDriver.ts'
import { OwlMascot } from './OwlMascot.tsx'
import type { GuidePose } from './guideTypes.ts'

// Pose resolution: the catalog says point-right; the owl points the other way when the target is left of the popover.
function useSide(popover: PopoverHosts['popover'] | undefined, key: string): 'left' | 'right' {
  const [side, setSide] = useState<'left' | 'right'>('right')
  useLayoutEffect(() => {
    if (!popover) return
    let frame = 0
    const measure = () => {
      const target = document.querySelector('.driver-active-element')
      if (!target) return
      const t = target.getBoundingClientRect()
      const p = popover.wrapper.getBoundingClientRect()
      const dx = t.left + t.width / 2 - (p.left + p.width / 2)
      setSide(dx < -24 ? 'left' : 'right')
    }
    frame = requestAnimationFrame(() => { measure(); frame = requestAnimationFrame(measure) })
    window.addEventListener('resize', measure)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', measure) }
  }, [popover, key])
  return side
}

export function GuidePopoverPortal({ hosts, view, catalog, onOwlFailed }: { hosts: PopoverHosts | null; view: GuideView; catalog: GuideCatalog; onOwlFailed: () => void }) {
  const side = useSide(hosts?.popover, view.step?.id ?? '')
  if (!hosts || !view.step) return null
  const { motionTokens } = catalog
  const pose: GuidePose = view.pose === 'point-right' && side === 'left' ? 'point-left' : view.pose
  return <>
    {createPortal(<OwlMascot pose={pose} motion={view.motion} nonce={view.motionNonce} tokens={motionTokens} still={view.reduced || view.paused} size={96} onFailed={onOwlFailed} />, hosts.owl)}
  </>
}
