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
    document.body.classList.remove('guide-lab-reading')
    try { current?.destroy() } finally { onPopover(null) }
  }
  return {
    backText: labels.back,
    present(args: PresentArgs) {
      destroy()
      const reduced = args.reduced
      document.body.classList.toggle('guide-lab-reading', args.step.id === 'L07' && matchMedia(sheetQuery).matches)
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
      // Static Atlas captions must sit above the phone sheet, rather than centred behind it.
      if (matchMedia(sheetQuery).matches && args.element.closest('[data-label-era]') && args.element.classList.contains('history-mobile-copy')) {
        args.element.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'instant' })
        window.scrollBy({ top: -80, behavior: 'instant' })
      }
      const targetRect = args.element.getBoundingClientRect()
      const lowerHalf = targetRect.top + targetRect.height / 2 > innerHeight / 2
      const side = !matchMedia(sheetQuery).matches && targetRect.left >= 414 ? 'left'
        : !matchMedia(sheetQuery).matches && innerWidth - targetRect.right >= 414 ? 'right'
        : lowerHalf ? 'top' : 'bottom'
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
          if (matchMedia(sheetQuery).matches) {
            popover.wrapper.dataset.sheet = lowerHalf ? 'top' : 'bottom'
            popover.wrapper.appendChild(popover.progress)
          }
          popover.closeButton.setAttribute('aria-label', 'Đóng hướng dẫn')
          const owl = document.createElement('div')
          owl.className = 'mach-guide__owl'
          const extras = document.createElement('div')
          extras.className = 'mach-guide__extras'
          popover.wrapper.insertBefore(owl, popover.arrow.nextSibling)
          popover.wrapper.appendChild(extras)
          // Built here, not by React: Driver measures the popover right after this hook, so its final height must already be there.
          const add = (label: string | null, tone: string, action: string, run: () => void, host = extras) => {
            if (!label) return
            const button = document.createElement('button')
            button.type = 'button'
            button.className = `mach-guide__btn mach-guide__btn--${tone}`
            button.dataset.action = action
            button.textContent = label
            button.addEventListener('click', run)
            host.append(button)
            return button
          }
          add(args.extras.skipGame, 'ghost', 'skip-game', actions.skipGame)
          if (matchMedia(sheetQuery).matches) {
            const options = document.createElement('div')
            options.className = 'mach-guide-options'
            options.id = `mach-guide-options-${args.step.id}`
            const toggle = add('Tùy chọn', 'quiet', 'options', () => {
              const open = options.dataset.open !== 'true'
              if (open) options.dataset.open = 'true'
              else delete options.dataset.open
              toggle?.setAttribute('aria-expanded', String(open))
            })
            toggle?.setAttribute('aria-expanded', 'false')
            toggle?.setAttribute('aria-controls', options.id)
            add(args.extras.skipModule, 'quiet', 'skip-module', actions.skipModule, options)
            add(args.extras.pause, 'quiet', 'pause', actions.pause, options)
            extras.append(options)
            popover.wrapper.addEventListener('keydown', (event) => {
              if (event.key !== 'Escape' || !options.dataset.open) return
              event.preventDefault()
              event.stopPropagation()
              delete options.dataset.open
              toggle?.setAttribute('aria-expanded', 'false')
              toggle?.focus()
            }, true)
          } else {
            add(args.extras.skipModule, 'quiet', 'skip-module', actions.skipModule)
            add(args.extras.pause, 'quiet', 'pause', actions.pause)
          }
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
          side,
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
