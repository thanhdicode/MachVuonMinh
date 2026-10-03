// QA harness: mounts the real MiniGame with a real GameGuideLink (catalog copy) the way the exhibit provider will.
import { StrictMode, useCallback, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '../../../../../src/style.css'
import { createGuideCatalog } from '../../../../../src/onboarding/guideCatalog'
import MiniGame from '../../../../../src/minigame/MiniGame'
import { scrollLeaseCounts } from '../../../../../src/experience/WorldTimeline'
import type { GameGuideLink, GameGuideHandle } from '../../../../../src/onboarding/gameGuideLink'
import type { GameGuideEvent } from '../../../../../src/onboarding/guideController'

const params = new URLSearchParams(location.search)
const catalog = createGuideCatalog()
const events: unknown[] = []
let handle: GameGuideHandle | null = null
const w = window as unknown as Record<string, unknown>
w.__events = events
w.__leases = scrollLeaseCounts
w.__handle = () => handle
w.__attached = () => handle !== null

// ?dropReady=1 hides the child's ready message from the exhibit, to exercise the handshake deadline and Skip-while-waiting.
if (params.get('dropReady') === '1') window.addEventListener('message', (event) => { if (event.data?.type === 'guide:ready') event.stopImmediatePropagation() }, true)

const link: GameGuideLink | null = params.get('guide') === '0' ? null : {
  startStepId: params.get('start') === '0' ? null : (params.get('start') ?? 'G01'),
  steps: catalog.route('game'),
  buttons: catalog.buttons,
  systemCopy: catalog.systemCopy,
  motionTokens: catalog.motionTokens,
  assetBase: `${import.meta.env.BASE_URL}guide/`,
  vendorBase: `${import.meta.env.BASE_URL}vendor/driver/1.8.0/`,
  reduced: params.get('reduced') === '1',
  report: (event: GameGuideEvent) => { events.push(event) },
  attach: (next: GameGuideHandle) => { handle = next; return () => { if (handle === next) handle = null } },
}

function App() {
  const [open, setOpen] = useState(params.get('open') === '1')
  const close = useCallback(() => { events.push({ type: 'host-closed' }); setOpen(false) }, [])
  return <div className="stage">
    <h1>Harness</h1>
    <button className="final-game-trigger" style={{ position: 'static', display: 'inline-block', minHeight: 44 }} onClick={() => setOpen(true)}>CHƠI MINIGAME</button>
    {open && <MiniGame onClose={close} guide={link} />}
  </div>
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
