import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { GuideCatalog } from './guideCatalog.ts'
import { MODULE_LABELS, MODULE_TITLES } from './guideCatalog.ts'
import type { GuideController, GuideView } from './guideController.ts'
import { MODULE_ORDER, MODULE_STEP_IDS, nextModule } from './guideIds.ts'
import type { GuideModule, GuideProgress } from './guideTypes.ts'
import { OwlMascot } from './OwlMascot.tsx'

export type CueProps = {
  view: GuideView
  controller: GuideController
  catalog: GuideCatalog
  currentModule: () => GuideModule
  onOwlFailed: () => void
}

const pad = (value: number) => String(value).padStart(2, '0')

type Anchor = 'bottom-left' | 'top-right' | 'top-left' | 'bottom-right'
const ANCHORS: readonly Anchor[] = ['bottom-left', 'top-right', 'top-left', 'bottom-right']

// Measures every candidate corner against the real controls (and the step target) and keeps the one that hides the least.
function pickAnchor(node: HTMLElement, target: string | null): Anchor {
  const { width, height } = node.getBoundingClientRect()
  const margin = Math.max(14, innerWidth * 0.03)
  const spots: Record<Anchor, { left: number; top: number }> = {
    'bottom-left': { left: margin, top: innerHeight - 56 - height },
    'top-right': { left: innerWidth - margin - width, top: 76 },
    'top-left': { left: margin, top: 76 },
    'bottom-right': { left: innerWidth - margin - width, top: innerHeight - 122 - height },
  }
  const controls = Array.from(document.querySelectorAll<HTMLElement>('input,button,select,textarea,a[href]'))
    .filter((element) => !element.closest('.mach-guide-root,.driver-popover') && element.checkVisibility?.())
    .map((element) => ({ box: element.getBoundingClientRect(), weight: target==='history-inspect'&&element.classList.contains('history-image') ? .05 : 1 }))
  if (target) {
    for (const element of document.querySelectorAll<HTMLElement>(`[data-guide~="${target}"]`)) {
      if (!element.checkVisibility?.()) continue
      const box = element.getBoundingClientRect()
      // A scene-sized target (the ring behind the Policy sockets) cannot be kept clear anyway; counting it pushes the cue onto the real controls.
      if (box.width * box.height < innerWidth * innerHeight * 0.15) controls.push({ box, weight: 3 })
    }
  }
  let best: Anchor = 'bottom-left'
  let bestScore = Number.POSITIVE_INFINITY
  for (const anchor of ANCHORS) {
    const spot = spots[anchor]
    const score = controls.reduce((total, { box, weight }) => {
      const x = Math.max(0, Math.min(spot.left + width, box.right) - Math.max(spot.left, box.left))
      const y = Math.max(0, Math.min(spot.top + height, box.bottom) - Math.max(spot.top, box.top))
      return total + x * y * weight
    }, 0)
    if (score < bestScore - 1) { best = anchor; bestScore = score }
  }
  return best
}

function summary(progress: GuideProgress) {
  const read = MODULE_ORDER.filter((moduleId) => progress.completedModules.includes(moduleId))
  const skipped = MODULE_ORDER.filter((moduleId) => progress.skippedModuleIds.includes(moduleId))
  const partial = MODULE_ORDER.filter((moduleId) => !progress.completedModules.includes(moduleId) && MODULE_STEP_IDS[moduleId].some((id) => progress.completedStepIds.includes(id)))
  return { read, skipped, partial }
}

export function Button({ children, onClick, tone = 'ghost', action, disabled, innerRef }: { children: ReactNode; onClick: () => void; tone?: 'primary' | 'ghost' | 'quiet' | 'skip'; action?: string; disabled?: boolean; innerRef?: React.Ref<HTMLButtonElement> }) {
  return <button ref={innerRef} type="button" className={`mach-guide__btn mach-guide__btn--${tone}`} data-action={action} disabled={disabled} onClick={onClick}>{children}</button>
}

// Non-modal helper layer for preparing, practice, dialogs, errors and end-of-run notices.
export function GuideCue({ view, controller, catalog, currentModule, onOwlFailed }: CueProps) {
  const { buttons, systemCopy, motionTokens } = catalog
  const primary = useRef<HTMLButtonElement>(null)
  const root = useRef<HTMLElement>(null)
  const optionsTrigger = useRef<HTMLButtonElement>(null)
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [anchor, setAnchor] = useState<Anchor>('bottom-left')
  const notice = view.notice
  const step = view.step
  useEffect(() => setOptionsOpen(false), [step?.id, view.phase, notice?.kind])
  const decision = notice?.kind === 'missing-target' || notice?.kind === 'keep-or-restore' || notice?.kind === 'scene-changed'
  useEffect(() => { if (decision) primary.current?.focus({ preventScroll: true }) }, [decision, notice?.kind])
  useLayoutEffect(() => {
    const node = root.current
    if (!node || view.cueHost || matchMedia('(max-width:700px)').matches) return
    const place = () => setAnchor(pickAnchor(node, step?.target ?? null))
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [step?.id, view.phase, notice?.kind, view.cueHost, view.practiceSignaled, step?.target])

  // Keep the real practice controls below the measured phone instruction.
  useLayoutEffect(() => {
    const node = root.current
    if (!node || view.phase !== 'practice' || !['policy', 'lab'].includes(step?.moduleId ?? '') || view.cueHost) return
    const body = document.body
    const className = `guide-${step?.moduleId}-practice`
    const previous = body.style.getPropertyValue('--policy-guide-bottom')
    const measure = () => {
      body.classList.add(className)
      body.style.setProperty('--policy-guide-bottom', `${node.getBoundingClientRect().bottom}px`)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
      body.classList.remove(className)
      if (previous) body.style.setProperty('--policy-guide-bottom', previous)
      else body.style.removeProperty('--policy-guide-bottom')
    }
  }, [step?.id, step?.moduleId, view.phase, view.cueHost])

  // A sticky cue at the bottom of a scrolling drawer can land on the target on short phones: scroll just enough to clear it.
  useLayoutEffect(() => {
    const node = root.current
    const host = view.cueHost
    const name = step?.target
    if (!node || !host || !name || getComputedStyle(node).position !== 'sticky') return
    const clear = () => {
      const target = Array.from(host.querySelectorAll<HTMLElement>(`[data-guide~="${name}"]`)).find((element) => element.checkVisibility?.())
      if (!target) return
      const box = target.getBoundingClientRect()
      const hidden = box.bottom - (node.getBoundingClientRect().top - 8)
      if (hidden <= 0) return
      let scroller: HTMLElement | null = target.parentElement
      while (scroller && !(scroller.scrollHeight > scroller.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(scroller).overflowY))) scroller = scroller.parentElement
      const room = scroller ? box.top - scroller.getBoundingClientRect().top - 8 : 0
      if (scroller && room > 0) scroller.scrollBy({ top: Math.min(hidden, room), behavior: 'instant' })
    }
    let frame = requestAnimationFrame(() => { clear(); frame = requestAnimationFrame(clear) })
    return () => cancelAnimationFrame(frame)
  }, [view.cueHost, step?.id, step?.target, view.phase])

  const counter = view.counter ? `${view.counter.label} · ${pad(view.counter.index)} / ${pad(view.counter.total)}` : null
  const still = view.reduced || view.paused
  const skipGuide = <Button tone="skip" action="skip-guide" onClick={() => void controller.skip('guide')}>{buttons.skipGuide}</Button>
  let title = step?.title ?? 'Cú Mạch'
  let text: ReactNode = step?.say ?? ''
  let actions: ReactNode = null
  let kind: string = view.phase
  const quiet = (label: string, action: string, run: () => void) => <Button tone="quiet" action={action} onClick={run}>{label}</Button>

  if (notice) {
    kind = notice.kind
    if (notice.kind === 'preparing') { text = systemCopy.preparing; actions = null }
    else if (notice.kind === 'missing-target') {
      title = step?.title ?? 'Cú Mạch'
      text = systemCopy.missingTarget
      actions = <>
        <Button tone="primary" innerRef={primary} action="retry" onClick={() => void controller.retry()}>Thử lại</Button>
        <Button action="skip-step" onClick={() => void controller.skip('step')}>{buttons.skipStep}</Button>
        <Button tone="quiet" action="read-text" onClick={() => controller.readAsText()}>Đọc hướng dẫn bằng chữ</Button>
      </>
    } else if (notice.kind === 'driver-failed') {
      actions = <>
        {view.canBack && <Button action="back" onClick={() => void controller.back()}>{buttons.back}</Button>}
        <Button tone="primary" action="next" onClick={() => void controller.next()}>{view.nextText}</Button>
      </>
    } else if (notice.kind === 'skipped') { title = 'Cú Mạch'; text = systemCopy.skipped; actions = <Button tone="quiet" action="dismiss" onClick={() => controller.dismissNotice()}>Đóng</Button> }
    else if (notice.kind === 'paused') {
      title = step?.title ?? 'Cú Mạch'; text = systemCopy.paused
      actions = <Button tone="primary" action="resume" onClick={() => void controller.resume()}>{buttons.resume}</Button>
    } else if (notice.kind === 'scene-changed') {
      title = 'Cú Mạch'; text = 'Bạn vừa sang một cảnh khác. Mình có thể quay lại bước này, hoặc hướng dẫn phần bạn đang xem.'
      actions = <>
        <Button tone="primary" innerRef={primary} action="retry" onClick={() => void controller.retry()}>Quay lại bước này</Button>
        <Button action="current-module" onClick={() => void controller.start(currentModule())}>Hướng dẫn phần này</Button>
      </>
    } else if (notice.kind === 'keep-or-restore') {
      title = MODULE_TITLES[notice.moduleId]
      text = 'Bạn vừa thử các thiết lập trong phần này. Muốn giữ lại hay khôi phục như lúc trước khi mình hướng dẫn?'
      actions = <>
        <Button tone="primary" innerRef={primary} action="restore" onClick={() => void controller.resolveKeepRestore('restore')}>Khôi phục thiết lập trước hướng dẫn</Button>
        <Button action="keep" onClick={() => void controller.resolveKeepRestore('keep')}>Giữ các thiết lập vừa thử</Button>
      </>
    } else if (notice.kind === 'module-skipped' || notice.kind === 'module-complete' || notice.kind === 'route-complete' || notice.kind === 'game-skipped') {
      const info = summary(view.progress)
      title = 'Cú Mạch'
      text = notice.kind === 'module-skipped' ? systemCopy.skippedModule : notice.kind === 'module-complete' ? systemCopy.complete : notice.kind === 'route-complete' && notice.partial ? systemCopy.partial : notice.kind === 'game-skipped' ? 'Tuyến triển lãm đã kết thúc. Phần minigame mình chưa hướng dẫn; bạn có thể xem cách chơi bất cứ lúc nào.' : systemCopy.complete
      const upcoming = notice.kind === 'module-complete' ? nextModule(notice.moduleId) : notice.kind === 'module-skipped' ? nextModule(notice.moduleId) : null
      actions = <>
        {notice.kind === 'game-skipped' && <Button tone="primary" action="game-guide" onClick={() => void controller.start('game')}>Xem hướng dẫn cách chơi</Button>}
        {upcoming && <Button tone="primary" action="next-module" onClick={() => void controller.start(upcoming)}>Tiếp tục khám phá</Button>}
        {notice.kind === 'route-complete' && notice.route === 'quick' && <Button tone="primary" action="explore-more" onClick={() => void controller.start('full', 'T01')}>Dẫn tôi khám phá thêm</Button>}
        <Button tone="quiet" action="dismiss" onClick={() => controller.dismissNotice()}>Để sau</Button>
      </>
      text = <>
        {text}
        <span className="mach-guide-cue__summary">
          <span><b>Đã đọc:</b> {info.read.length ? info.read.map((m) => MODULE_TITLES[m]).join(' · ') : info.partial.length ? `một phần của ${info.partial.map((m) => MODULE_LABELS[m]).join(', ')}` : 'chưa có phần nào trọn vẹn'}</span>
          {info.skipped.length > 0 && <span><b>Đã bỏ qua:</b> {info.skipped.map((m) => MODULE_TITLES[m]).join(' · ')}</span>}
        </span>
      </>
    } else if (notice.kind === 'game-failed') {
      title = 'Cú Mạch'; text = systemCopy.gameFailed
      actions = <Button tone="quiet" action="dismiss" onClick={() => controller.dismissNotice()}>Đóng</Button>
    }
  } else if (view.phase === 'practice') {
    text = <>{step?.say}<span className="mach-guide-cue__hint" data-signaled={view.practiceSignaled || undefined}>{view.practiceSignaled ? 'Mình thấy bạn đã thực hiện thao tác này.' : systemCopy.practice}</span></>
    actions = <>
      <Button tone="primary" action="practice-done" onClick={() => void controller.confirmPractice()}>{buttons.practiceDone}</Button>
      {quiet(buttons.skipStep, 'skip-step', () => void controller.skip('step'))}
    </>
  } else {
    actions = <>
      {view.canBack && <Button action="back" onClick={() => void controller.back()}>{buttons.back}</Button>}
      <Button tone="primary" action="next" onClick={() => void controller.next()}>{view.nextText}</Button>
      {step?.id === 'F04' && <Button action="skip-game" onClick={() => void controller.skipGame()}>Bỏ qua phần game</Button>}
    </>
  }

  const ending = !!notice && ['skipped', 'module-skipped', 'module-complete', 'route-complete', 'game-skipped', 'game-failed'].includes(notice.kind)
  const showSteps = !!step && !ending && (!notice || notice.kind === 'driver-failed' || notice.kind === 'missing-target')
  const body = (
    <section ref={root} className="mach-guide-cue" role="region" aria-labelledby="mach-guide-cue-title" aria-live="polite" data-kind={kind} data-module={step?.moduleId} data-host={view.cueHost ? 'dialog' : 'page'} data-anchor={anchor} data-guide-cue onKeyDownCapture={(event) => {
      if (event.key === 'Escape' && optionsOpen) { event.preventDefault(); event.stopPropagation(); setOptionsOpen(false); optionsTrigger.current?.focus() }
    }}>
      <OwlMascot pose={view.pose} motion={view.motion} nonce={view.motionNonce} tokens={motionTokens} still={still} size={64} onFailed={onOwlFailed} />
      <div className="mach-guide-cue__main">
        {counter && showSteps && <p className="mach-guide-cue__counter">{counter}</p>}
        <h2 id="mach-guide-cue-title" className="mach-guide-cue__title">{title}</h2>
        <div className="mach-guide-cue__text">{text}</div>
        <div className="mach-guide-cue__actions">{actions}</div>
        <div className="mach-guide-cue__extras">
          {showSteps && <>
            <button ref={optionsTrigger} type="button" className="mach-guide__btn mach-guide__btn--quiet mach-guide-options-toggle" data-action="options" aria-expanded={optionsOpen} aria-controls="mach-guide-cue-options" onClick={() => setOptionsOpen(!optionsOpen)}>Tùy chọn</button>
            <div id="mach-guide-cue-options" className="mach-guide-options" data-open={optionsOpen || undefined}>
              {view.canSkipModule && quiet(buttons.skipModule, 'skip-module', () => void controller.skip('module'))}
              {quiet(buttons.pause, 'pause', () => void controller.pause())}
            </div>
          </>}
          {!ending && skipGuide}
        </div>
      </div>
    </section>
  )
  return view.cueHost ? createPortal(body, view.cueHost) : body
}
