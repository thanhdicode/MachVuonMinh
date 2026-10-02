import { useEffect, useRef } from 'react'
import { setTimelineSuspended } from '../experience/WorldTimeline'
import { gameDocument } from './gameDocument'

export default function MiniGame({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const element = dialog.current
    element?.showModal()
    document.body.classList.add('mini-game-open')
    setTimelineSuspended(true)
    const receive = (event: MessageEvent) => {
      if (event.source === frame.current?.contentWindow && event.data?.type === 'mach-minigame-close') onClose()
    }
    window.addEventListener('message', receive)
    return () => {
      window.removeEventListener('message', receive)
      element?.close()
      document.body.classList.remove('mini-game-open')
      setTimelineSuspended(false)
      previous?.focus({ preventScroll: true })
    }
  }, [onClose])

  return <dialog ref={dialog} className="mini-game-dialog" aria-labelledby="mini-game-title" data-lenis-prevent onCancel={event => { event.preventDefault(); onClose() }}>
    <header className="mini-game-toolbar">
      <div><span className="mini-game-thread" aria-hidden="true" /><div><span className="eyebrow">MẠCH VƯƠN MÌNH / ÔN TẬP</span><h2 id="mini-game-title">Hành trình sản xuất</h2></div></div>
      <button type="button" onClick={onClose} aria-label="Đóng mini game và quay lại bài thuyết trình"><span aria-hidden="true">←</span> <span>QUAY LẠI BÀI THUYẾT TRÌNH</span></button>
    </header>
    <iframe ref={frame} className="mini-game-frame" title="Mini game Hành trình sản xuất: 5 giai đoạn, 5 boss và 77 câu hỏi" srcDoc={gameDocument} onLoad={() => frame.current?.contentDocument?.getElementById('startButton')?.focus({ preventScroll: true })} />
  </dialog>
}
