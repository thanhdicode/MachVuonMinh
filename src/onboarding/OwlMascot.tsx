import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import type { GuideMotion, GuideMotionToken, GuidePose } from './guideTypes.ts'

const BASE = import.meta.env.BASE_URL
export const owlUrl = (pose: GuidePose | 'dock') => `${BASE}guide/owl-${pose}.webp`

type Props = {
  pose: GuidePose
  motion: GuideMotion
  nonce: number
  tokens: Record<string, GuideMotionToken>
  still: boolean
  size: number
  onFailed?: () => void
}

// Static poses only: whole-image crossfade, nudge and nod on an inner wrapper; the frame never changes size.
export function OwlMascot({ pose, motion, nonce, tokens, still, size, onFailed }: Props) {
  const root = useRef<HTMLSpanElement>(null)
  const front = useRef<HTMLImageElement>(null)
  const [layers, setLayers] = useState<{ back: GuidePose | null; front: GuidePose }>({ back: null, front: 'neutral' })
  const [failed, setFailed] = useState(false)

  useLayoutEffect(() => {
    setLayers((current) => (current.front === pose ? current : { back: current.front, front: pose }))
  }, [pose])

  useLayoutEffect(() => {
    const image = front.current
    const node = root.current
    if (!image || !node) return
    const token = tokens[motion] ?? tokens.none
    const duration = still || !token || !token.durationMs ? 0 : token.durationMs / 1000
    const settle = () => setLayers((current) => (current.back ? { ...current, back: null } : current))
    const context = gsap.context(() => {
      const inner = node.querySelector('.mach-owl__inner')
      if (duration === 0) { gsap.set(image, { opacity: 1 }); settle(); return }
      const play = () => {
        const ease = token.ease ?? 'power2.out'
        const timeline = gsap.timeline({ onComplete: settle })
        timeline.fromTo(image, { opacity: token.opacity?.[0] ?? 0 }, { opacity: token.opacity?.[1] ?? 1, duration, ease }, 0)
        if (token.translateY) timeline.fromTo(inner, { y: token.translateY }, { y: 0, duration, ease }, 0)
        if (token.rotationDeg) timeline.fromTo(inner, { rotation: 0 }, { rotation: token.rotationDeg, duration: duration / 2, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0)
      }
      if (image.complete && image.naturalWidth) play()
      else image.addEventListener('load', play, { once: true })
    }, node)
    return () => context.revert()
  }, [layers.front, motion, nonce, still, tokens])

  const fail = () => { setFailed(true); onFailed?.() }
  return (
    <span ref={root} className="mach-owl" data-pose={pose} data-failed={failed || undefined} style={{ ['--owl' as string]: `${size}px` }} aria-hidden="true">
      <span className="mach-owl__inner">
        {layers.back && <img className="mach-owl__img" src={owlUrl(layers.back)} alt="" draggable={false} />}
        <img ref={front} className="mach-owl__img mach-owl__img--front" src={owlUrl(layers.front)} alt="" draggable={false} onError={fail} />
      </span>
    </span>
  )
}

export function preloadOwl(pose: GuidePose) {
  const image = new Image()
  image.src = owlUrl(pose)
}
