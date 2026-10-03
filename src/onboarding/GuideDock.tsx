import { useEffect, useRef } from 'react'
import type { GuideCatalog } from './guideCatalog.ts'
import { MODULE_TITLES } from './guideCatalog.ts'
import type { GuideController, GuideView } from './guideController.ts'
import { MODULE_ORDER, MODULE_STEP_IDS } from './guideIds.ts'
import { resumeTarget } from './guideProgress.ts'
import type { GuideModule } from './guideTypes.ts'
import { owlUrl } from './OwlMascot.tsx'

export function GuideDock({ view, controller, catalog, currentModule }: { view: GuideView; controller: GuideController; catalog: GuideCatalog; currentModule: () => GuideModule }) {
  const launcher = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const wasOpen = useRef(false)
  const progress = view.progress
  const resume = resumeTarget(progress)
  const running = view.phase !== 'idle' && view.phase !== 'completed' && view.phase !== 'cancelled' && view.phase !== 'paused'

  useEffect(() => {
    if (view.menuOpen) menu.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })
    else if (wasOpen.current && !running) launcher.current?.focus({ preventScroll: true })
    wasOpen.current = view.menuOpen
  }, [view.menuOpen, running])

  const run = (action: () => void) => () => { controller.closeMenu(); action() }
  const mark = (moduleId: GuideModule) => progress.completedModules.includes(moduleId) ? '✓ đã xem' : progress.skippedModuleIds.includes(moduleId) ? 'đã bỏ qua' : ''
  return (
    <div className="mach-guide-dock" data-open={view.menuOpen || undefined}>
      {view.menuOpen && (
        <div ref={menu} id="mach-guide-menu" className="mach-guide-menu" role="region" aria-label="Cú Mạch / Hướng dẫn & xem lại">
          <p className="mach-guide-cue__counter">CÚ MẠCH / HƯỚNG DẪN &amp; XEM LẠI</p>
          {progress.status === 'new' && !running && <button type="button" className="mach-guide-menu__item mach-guide-menu__item--primary" onClick={run(() => controller.showWelcome())}>Bắt đầu hướng dẫn</button>}
          {resume && !running && <button type="button" className="mach-guide-menu__item mach-guide-menu__item--primary" onClick={run(() => void controller.resume())}>Tiếp tục bước dang dở<small>{catalog.get(resume.stepId).title}</small></button>}
          <button type="button" className="mach-guide-menu__item" onClick={run(() => void controller.start(currentModule()))}>Hướng dẫn phần đang xem<small>{MODULE_TITLES[currentModule()]}</small></button>
          <button type="button" className="mach-guide-menu__item" onClick={run(() => void controller.start('full'))}>{catalog.buttons.replay}</button>
          <p className="mach-guide-menu__heading">Chọn một phần</p>
          <ol className="mach-guide-menu__modules">
            {MODULE_ORDER.map((moduleId, index) => (
              <li key={moduleId}>
                <button type="button" className="mach-guide-menu__item" onClick={run(() => void controller.start(moduleId))}>
                  <span className="mach-guide-menu__index">{String(index + 1).padStart(2, '0')}</span>
                  {MODULE_TITLES[moduleId]}
                  <small>{MODULE_STEP_IDS[moduleId].length} bước {mark(moduleId) && `· ${mark(moduleId)}`}</small>
                </button>
              </li>
            ))}
          </ol>
          <button type="button" className="mach-guide-menu__item mach-guide-menu__item--quiet" onClick={() => controller.hideOwl()}>Ẩn cú trong phiên này</button>
        </div>
      )}
      <button
        ref={launcher}
        type="button"
        className="mach-guide-dock__button"
        aria-label="Mở hướng dẫn của Cú Mạch"
        aria-expanded={view.menuOpen}
        aria-controls="mach-guide-menu"
        data-guide="guide-replay"
        onClick={() => controller.toggleMenu()}
      >
        <img src={owlUrl('dock')} alt="" width={40} height={40} draggable={false} />
      </button>
    </div>
  )
}
