import { useEffect, useRef, useState } from 'react'
import { acquireScrollLease } from '../experience/WorldTimeline'
import { buildChildConfig, createNonce } from '../onboarding/gameGuideProtocol'
import type { GameGuideLink } from '../onboarding/gameGuideLink'
import { buildGameDocument } from './gameDocument'
import { createGameGuideSession } from './gameGuideSession'
import type { GameGuideSession, SessionSnapshot } from './gameGuideSession'
import './miniGame.css'

type FocusMemory = { focus: HTMLElement | null; scroll: number }

const idle: SessionSnapshot = { guide: 'none', skipVisible: false, fallback: false, closed: false }

// Focus and scroll go back to the exhibit only once the modal is really gone: while it is open the page behind it is inert,
// and a close that did not start from a React event is committed a little later than the next task.
function restoreApp(memory: FocusMemory, modal: HTMLDialogElement, restoreScroll: boolean) {
  let frames = 0
  const attempt = () => {
    if (modal.isConnected && modal.open && frames++ < 60) { window.requestAnimationFrame(attempt); return }
    // The control that opened the game may be gone (the owl menu closes on use): fall back to the owl.
    const target = memory.focus?.isConnected ? memory.focus : document.querySelector<HTMLElement>('.mach-guide-dock__button')
    target?.focus({ preventScroll: true })
    if (restoreScroll && Math.abs(window.scrollY - memory.scroll) > 1) window.scrollTo({ top: memory.scroll, behavior: 'instant' })
  }
  window.requestAnimationFrame(attempt)
}

export default function MiniGame({ onClose, guide = null }: { onClose: () => void; guide?: GameGuideLink | null }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const session = useRef<GameGuideSession | null>(null)
  const pendingDispose = useRef<number | null>(null)
  const latest = useRef({ onClose, guide })
  const [view, setView] = useState<SessionSnapshot>(idle)
  // One document per open. It never changes while the dialog is mounted, so the iframe never reloads under a live guide.
  const [boot] = useState(() => {
    const nonce = createNonce()
    const origin = window.location.origin
    return { nonce, origin, document: buildGameDocument(buildChildConfig({ nonce, origin, link: guide })) }
  })

  useEffect(() => { latest.current = { onClose, guide } })

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    // React's StrictMode simulates unmount + mount: the pending dispose is cancelled so one real session survives.
    if (pendingDispose.current !== null) { window.clearTimeout(pendingDispose.current); pendingDispose.current = null }
    const link = latest.current.guide
    if (!session.current) {
      // <body> is what is focused once the control that opened the game has unmounted: it is not worth restoring.
      const opener = document.activeElement
      const memory: FocusMemory = { focus: opener instanceof HTMLElement && opener !== document.body ? opener : null, scroll: window.scrollY }
      const created: GameGuideSession = createGameGuideSession({
        nonce: boot.nonce,
        origin: boot.origin,
        stepIds: new Set(link ? link.steps.map((step) => step.id) : []),
        startStepId: link?.startStepId ?? null,
        hasGuide: link !== null,
        frameWindow: () => frame.current?.contentWindow ?? null,
        report: (event) => latest.current.guide?.report(event),
        acquireLease: () => acquireScrollLease('game'),
        // A handed-off tour owns its caller position. The game only restores its own natural opener.
        onDialogClosed: () => restoreApp(memory, element, link?.startStepId == null),
        requestClose: () => { created.cancel('dialog-closed'); latest.current.onClose() },
        onChange: setView,
      })
      session.current = created
      created.start()
    }
    const detach = link?.attach({
      cancel: (mode) => {
        session.current?.cancel(mode, { silent: true })
        if (mode === 'dialog-closed') latest.current.onClose()
      },
    })
    const receive = (event: MessageEvent) => session.current?.receive({ source: event.source, origin: event.origin, data: event.data })
    window.addEventListener('message', receive)
    if (!element.open) element.showModal()
    document.body.classList.add('mini-game-open')
    return () => {
      window.removeEventListener('message', receive)
      detach?.()
      element.close()
      document.body.classList.remove('mini-game-open')
      pendingDispose.current = window.setTimeout(() => {
        pendingDispose.current = null
        session.current?.dispose()
        session.current = null
      }, 0)
    }
  }, [boot])

  // Reduced-motion changes reach the running guide without reloading the game.
  const reduced = guide?.reduced
  useEffect(() => {
    if (reduced !== undefined) session.current?.motion(reduced)
  }, [reduced])

  // The toolbar Skip unmounts once used; focus goes into the game (or to the close button) instead of falling to the page.
  const skipGuide = () => {
    session.current?.skipGuide()
    const start = frame.current?.contentDocument?.getElementById('startButton')
    start?.focus({ preventScroll: true })
    if (!start || start.ownerDocument.activeElement !== start) closeButton.current?.focus({ preventScroll: true })
  }

  const closeDialog = () => {
    session.current?.cancel('dialog-closed')
    latest.current.onClose()
  }

  return <dialog
    ref={dialog}
    className="mini-game-dialog"
    aria-labelledby="mini-game-title"
    data-lenis-prevent
    onCancel={event => {
      event.preventDefault()
      // The first Esc closes a pending or active guide only; with none, it leaves the game.
      if (session.current?.escape() !== 'closed-guide') closeDialog()
    }}
  >
    <header className="mini-game-toolbar">
      <div><span className="mini-game-thread" aria-hidden="true" /><div><span className="eyebrow">MẠCH VƯƠN MÌNH / ÔN TẬP</span><h2 id="mini-game-title">Hành trình sản xuất</h2></div></div>
      <div className="mini-game-actions">
        {guide && view.skipVisible && <button type="button" className="mini-game-skip" onClick={skipGuide}>{guide.buttons.skipGuide}</button>}
        <button ref={closeButton} type="button" onClick={closeDialog} aria-label="Đóng mini game và quay lại bài thuyết trình"><span aria-hidden="true">←</span> <span>QUAY LẠI BÀI THUYẾT TRÌNH</span></button>
      </div>
      {guide && view.fallback && <details className="mini-game-howto" open>
        <summary>Cách chơi bằng chữ</summary>
        <p>{guide.systemCopy.gameFailed}</p>
        <ol>{guide.steps.map(step => <li key={step.id}><strong>{step.title}.</strong> {step.say}</li>)}</ol>
      </details>}
    </header>
    <iframe
      ref={frame}
      className="mini-game-frame"
      title="Mini game Hành trình sản xuất: 5 giai đoạn, 5 boss và 77 câu hỏi"
      srcDoc={boot.document}
      onLoad={() => {
        session.current?.frameLoaded()
        if (!latest.current.guide?.startStepId) frame.current?.contentDocument?.getElementById('startButton')?.focus({ preventScroll: true })
      }}
    />
  </dialog>
}
