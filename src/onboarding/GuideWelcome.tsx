import { useEffect, useRef } from 'react'
import type { GuideCatalog } from './guideCatalog.ts'
import type { GuideController, GuideView } from './guideController.ts'
import { Button } from './GuideCue.tsx'
import { OwlMascot } from './OwlMascot.tsx'

export function GuideWelcome({ view, controller, catalog, onOwlFailed }: { view: GuideView; controller: GuideController; catalog: GuideCatalog; onOwlFailed: () => void }) {
  const primary = useRef<HTMLButtonElement>(null)
  const copy = catalog.get('I01')
  useEffect(() => { primary.current?.focus({ preventScroll: true }) }, [])
  return (
    <section className="mach-guide-welcome" role="region" aria-labelledby="mach-guide-welcome-title" data-guide="welcome">
      <OwlMascot pose="neutral" motion="welcome" nonce={view.motionNonce} tokens={catalog.motionTokens} still={view.reduced || view.paused} size={96} onFailed={onOwlFailed} />
      <div className="mach-guide-welcome__main">
        <p className="mach-guide-cue__counter">CÚ MẠCH</p>
        <h2 id="mach-guide-welcome-title" className="mach-guide-cue__title">{copy.title}</h2>
        <p className="mach-guide-cue__text">{copy.say}</p>
        <div className="mach-guide-cue__actions mach-guide-welcome__choices">
          <Button tone="primary" innerRef={primary} action="full" onClick={() => void controller.chooseWelcome('full')}>Dẫn tôi khám phá</Button>
          <Button action="quick" onClick={() => void controller.chooseWelcome('quick')}>Hướng dẫn nhanh</Button>
          <Button action="explore" onClick={() => void controller.chooseWelcome('explore')}>Tự khám phá</Button>
        </div>
        <div className="mach-guide-cue__extras"><Button tone="skip" action="skip-guide" onClick={() => void controller.skip('guide')}>{catalog.buttons.skipGuide}</Button></div>
      </div>
    </section>
  )
}
