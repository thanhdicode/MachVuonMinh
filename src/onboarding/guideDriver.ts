import { driver as createDriver } from 'driver.js'
import type { Driver, PopoverDOM } from 'driver.js'
import 'driver.js/dist/driver.css'
import './guideDriver.css'
import type { DriverPort, PresentArgs } from './guideController.ts'

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] as string)
const sheetQuery = '(max-width:700px)'

export type DriverRuntime = Omit<DriverPort, 'load'> & { backText: string }
// Hosts are created inside onPopoverRender, i.e. before Driver measures and positions the popover.
export type PopoverHosts = { popover: PopoverDOM; owl: HTMLElement; extras: HTMLElement }

// Thin, replaceable wrapper over the official factory: one Driver per step, always destroyed explicitly.
export function createDriverRuntime(onPopover: (hosts: PopoverHosts | null) => void, labels: { back: string }): DriverRuntime {
  let instance: Driver | null = null
  const destroy = () => {
    const current = instance
    instance = null
    try { current?.destroy() } finally { onPopover(null) }
  }
  return {
    backText: labels.back,
    present(args: PresentArgs) {
      destroy()
      const reduced = args.reduced
      const hooks = {
        onNextClick: () => args.handlers.next(),
        onDoneClick: () => args.handlers.next(),
        onPrevClick: () => args.handlers.back(),
        onCloseClick: () => args.handlers.close(),
        onDestroyStarted: () => args.handlers.close(),
      }
      const actions = {
        skipModule: () => args.handlers.skipModule(),
        pause: () => args.handlers.pause(),
        skipGuide: () => args.handlers.skipGuide(),
        skipGame: () => args.handlers.skipGame(),
      }
      const rect = args.element.getBoundingClientRect()
      const lowerHalf = rect.top + rect.height / 2 > innerHeight / 2
      const next = createDriver({
        animate: !reduced,
        duration: reduced ? 0 : 280,
        smoothScroll: false,
        allowScroll: true,
        allowKeyboardControl: false,
        allowClose: true,
        overlayClickBehavior: () => { /* clicking outside never dismisses the guide */ },
        overlayColor: '#171512',
        overlayOpacity: 0.36,
        stagePadding: 8,
        stageRadius: 8,
        popoverClass: 'mach-guide',
        popoverOffset: 14,
        showButtons: ['next', 'previous', 'close'],
        showProgress: true,
        ...hooks,
        onPopoverRender: (popover) => {
          if (matchMedia(sheetQuery).matches) popover.wrapper.dataset.sheet = lowerHalf ? 'top' : 'bottom'
          popover.closeButton.setAttribute('aria-label', 'Đóng hướng dẫn')
          const owl = document.createElement('div')
          owl.className = 'mach-guide__owl'
          const extras = document.createElement('div')
          extras.className = 'mach-guide__extras'
          popover.wrapper.insertBefore(owl, popover.arrow.nextSibling)
          popover.wrapper.appendChild(extras)
          // Built here, not by React: Driver measures the popover right after this hook, so its final height must already be there.
          const add = (label: string | null, tone: string, action: string, run: () => void) => {
            if (!label) return
            const button = document.createElement('button')
            button.type = 'button'
            button.className = `mach-guide__btn mach-guide__btn--${tone}`
            button.dataset.action = action
            button.textContent = label
            button.addEventListener('click', run)
            extras.append(button)
          }
          add(args.extras.skipGame, 'ghost', 'skip-game', actions.skipGame)
          add(args.extras.skipModule, 'quiet', 'skip-module', actions.skipModule)
          add(args.extras.pause, 'quiet', 'pause', actions.pause)
          add(args.extras.skipGuide, 'skip', 'skip-guide', actions.skipGuide)
          onPopover({ popover, owl, extras })
        },
        onDestroyed: () => onPopover(null),
      })
      instance = next
      next.highlight({
        element: args.element,
        disableActiveInteraction: false,
        popover: {
          title: escapeHtml(args.step.title),
          description: escapeHtml(args.step.say),
          side: lowerHalf ? 'top' : 'bottom',
          align: 'center',
          showButtons: ['next', 'previous', 'close'],
          disableButtons: args.canBack ? [] : ['previous'],
          showProgress: true,
          progressText: args.counterText,
          nextBtnText: args.nextText,
          prevBtnText: labels.back,
          ...hooks,
        },
      })
    },
    refresh: () => instance?.refresh(),
    destroy,
    isActive: () => instance?.isActive() ?? false,
  }
}
