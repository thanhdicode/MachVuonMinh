// Shared layout probe for the Cú Mạch QA walkers: one in-page sample of the guide layer plus the issue classifier.
// Classes: 1 skip button, 2 covers target/control, 3 layout (clipped/outside/overflow/hscroll), 4 touch size/body font, 5 copy/target.
// One evaluate call per sample: presenter state plus every layout metric the issue classes need.
export const sampleLayer = (page, targetName) => page.evaluate((targetName) => {
  const round = (n) => Math.round(n * 10) / 10
  const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } }
  const shown = (e) => e.checkVisibility?.({ checkOpacity: true, checkVisibilityCSS: true }) ?? true
  const pop = document.querySelector('.driver-popover.mach-guide'), cue = document.querySelector('.mach-guide-cue'), welcome = document.querySelector('.mach-guide-welcome')
  const target = document.querySelector('.driver-active-element')
  const layer = pop ?? cue ?? welcome
  const hit = (el) => {
    const b = el.getBoundingClientRect(); const cx = b.x + b.width / 2, cy = b.y + b.height / 2
    if (b.width <= 0 || b.height <= 0 || cx < 0 || cy < 0 || cx > innerWidth || cy > innerHeight) return false
    const top = document.elementFromPoint(cx, cy)
    return !!top && (top === el || el.contains(top))
  }
  const skip = layer?.querySelector('.mach-guide__btn--skip')
  let skipInfo = { found: !!skip, ok: false, covered: null, box: null }
  if (skip) {
    const b = skip.getBoundingClientRect(); const top = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2)
    skipInfo = { found: true, box: r(skip), ok: !skip.disabled && hit(skip) && b.bottom <= innerHeight + 1 && b.top >= -1, covered: top && !(skip === top || skip.contains(top)) ? (top.className?.toString() || top.tagName) : null }
  }
  let m = null
  if (layer) {
    const lb = layer.getBoundingClientRect(), cs = getComputedStyle(layer)
    const px = (sel) => [...layer.querySelectorAll(sel)].filter(shown).map((e) => round(parseFloat(getComputedStyle(e).fontSize)))
    const buttons = [...layer.querySelectorAll('button, a[href]')].filter(shown).map((b) => ({ label: (b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 28), w: Math.round(b.getBoundingClientRect().width), h: Math.round(b.getBoundingClientRect().height), clickable: hit(b) }))
    const escapes = [...layer.querySelectorAll('*')].filter((e) => !e.closest('.driver-popover-arrow') && shown(e)).map((e) => ({ e, b: e.getBoundingClientRect() })).filter(({ e, b }) => b.width > 0 && b.height > 0 && (b.right > lb.right + 1.5 || b.left < lb.left - 1.5) && !e.closest('.mach-owl')).slice(0, 4).map(({ e, b }) => `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]} ${Math.round(b.left)}..${Math.round(b.right)} vs ${Math.round(lb.left)}..${Math.round(lb.right)}`)
    const owlBox = layer.querySelector('.mach-owl')
    const owlImg = layer.querySelector('.mach-owl__img--front')
    let flipped = false
    for (let n = owlImg; n && n !== layer; n = n.parentElement) { const t = getComputedStyle(n).transform; if (t && t !== 'none') { const a = new DOMMatrixReadOnly(t); if (a.a < 0 || a.d < 0) flipped = true } }
    const scroller = [layer, ...layer.querySelectorAll('*')].filter((e) => { const o = getComputedStyle(e).overflowY; return (o === 'auto' || o === 'scroll') && e.scrollHeight > e.clientHeight + 1 })
    m = {
      kind: pop ? 'driver' : cue ? 'cue' : 'welcome', box: r(layer), overflowY: cs.overflowY, maxHeight: cs.maxHeight, position: cs.position,
      scrollH: layer.scrollHeight, clientH: layer.clientHeight, scrollable: scroller.map((e) => `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]} ${e.scrollHeight}/${e.clientHeight}`),
      clipped: layer.scrollHeight > layer.clientHeight + 1 && !['auto', 'scroll'].includes(cs.overflowY),
      fonts: { title: px('.driver-popover-title, .mach-guide-cue__title'), body: px('.driver-popover-description, .mach-guide-cue__text'), hint: px('.mach-guide-cue__hint, .mach-guide-cue__summary'), counter: px('.driver-popover-progress-text, .mach-guide-cue__counter'), buttons: px('button') },
      buttons, escapes, owl: owlBox ? { box: r(owlBox), img: r(owlImg), natural: owlImg ? [owlImg.naturalWidth, owlImg.naturalHeight] : null, flipped } : null,
      anim: layer.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').map((a) => a.animationName || a.constructor.name).slice(0, 4),
    }
  }
  const targets = targetName ? [...document.querySelectorAll(`[data-guide~="${targetName}"]`)].filter(shown).map((e) => ({ ...r(e), tag: e.tagName.toLowerCase() })) : []
  const controls = layer ? [...document.querySelectorAll('input,button,select,textarea,a[href],[role="button"],[draggable="true"]')].filter((e) => !e.closest('.mach-guide-root,.driver-popover,.mach-guide-cue') && shown(e)).map((e) => ({ e, b: e.getBoundingClientRect() })).filter(({ b }) => b.width > 0 && b.height > 0) : []
  const lbox = layer?.getBoundingClientRect()
  const covered = lbox ? controls.filter(({ b }) => Math.min(lbox.right, b.right) - Math.max(lbox.left, b.left) > 2 && Math.min(lbox.bottom, b.bottom) - Math.max(lbox.top, b.top) > 2).slice(0, 6).map(({ e, b }) => `${e.tagName.toLowerCase()}[${e.getAttribute('data-guide') || e.getAttribute('aria-label') || e.className?.toString().split(' ')[0] || ''}] ${Math.round(b.x)},${Math.round(b.y)} ${Math.round(b.width)}x${Math.round(b.height)}`) : []
  const history = document.querySelector('.history-bridge')
  return {
    presenter: pop ? 'driver' : cue ? 'cue' : welcome ? 'welcome' : null, kind: cue?.dataset.kind ?? null, host: cue?.dataset.host ?? null, anchor: cue?.dataset.anchor ?? null,
    title: (pop?.querySelector('.driver-popover-title') ?? cue?.querySelector('.mach-guide-cue__title'))?.textContent ?? null,
    text: (pop?.querySelector('.driver-popover-description') ?? cue?.querySelector('.mach-guide-cue__text'))?.textContent ?? null,
    counter: (pop?.querySelector('.driver-popover-progress-text') ?? cue?.querySelector('.mach-guide-cue__counter'))?.textContent ?? null,
    next: pop?.querySelector('.driver-popover-next-btn')?.textContent ?? cue?.querySelector('[data-action="next"],[data-action="practice-done"]')?.textContent ?? null,
    pop: r(pop), cue: r(cue), target: r(target), targetInfo: target ? { tag: target.tagName.toLowerCase(), guide: target.getAttribute('data-guide'), cls: String(target.className).split(' ')[0], shown: shown(target) } : null,
    skip: skipInfo.ok, skipInfo, skipCovered: skipInfo.covered, owl: (pop ?? cue)?.querySelector('.mach-owl')?.dataset.pose ?? null, layer: m, targets, covered,
    overlays: document.querySelectorAll('.driver-overlay').length, popovers: document.querySelectorAll('.driver-popover').length,
    marker: window.__qaMarker === true, vw: innerWidth, vh: innerHeight, dpr: devicePixelRatio, scrollY: Math.round(scrollY), docW: document.documentElement.scrollWidth, body: document.body.className,
    historyLayout: history?.dataset.layout ?? null, activeEra: history?.dataset.activeEra ?? null,
    signaled: !!document.querySelector('.mach-guide-cue__hint[data-signaled]'), notice: cue?.dataset.kind,
  }
}, targetName)
export const overlapOf = (a, b, pad = 8) => { if (!a || !b) return 0; const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w + pad) - Math.max(a.x, b.x - pad)), y = Math.max(0, Math.min(a.y + a.h, b.y + b.h + pad) - Math.max(a.y, b.y - pad)); return x * y }
// Issue classes: 1 skip button, 2 covers target/control, 3 layout (clipped/outside/overflow/hscroll), 4 touch size/body font, 5 copy/target.
export function classify(rec, s, { baseDocW = 0, touch = false } = {}) {
  const issues = []
  const L = s.layer
  const ending = ['skipped', 'module-skipped', 'module-complete', 'route-complete', 'game-skipped', 'game-failed'].includes(s.kind)
  if (!s.skip && !ending) issues.push(`1:skip-not-clickable${s.skipInfo.found ? '' : '(missing)'}${s.skipCovered ? ` covered-by=${s.skipCovered}` : ''}`)
  const vpArea = s.vw * s.vh
  if (s.presenter === 'driver' && s.target && rec.overlapArea > 0 && s.target.w * s.target.h < vpArea * 0.5) issues.push(`2:popover-overlaps-target(${rec.overlapArea}px2)`)
  if (s.presenter === 'cue' && s.cue) {
    const o = s.targets.reduce((n, t) => n + overlapOf(s.cue, t, 0), 0)
    rec.cueTargetOverlap = o
    if (o > 0 && s.kind !== 'modal' && !s.targets.some((t) => t.w * t.h > vpArea * 0.5)) issues.push(`2:cue-overlaps-target(${o}px2)`)
  }
  if (s.presenter === 'cue' && s.kind === 'practice' && s.covered.length) issues.push(`2:practice-cue-covers-controls ${s.covered.slice(0, 3).join(' ; ')}`)
  if (L) {
    if (L.clipped) issues.push(`3:clipped(scrollH ${L.scrollH} > clientH ${L.clientH}, overflow ${L.overflowY})`)
    const b = L.box
    if (b.x < -1 || b.y < -1 || b.x + b.w > s.vw + 1 || b.y + b.h > s.vh + 1) issues.push(`3:outside-viewport(${b.x},${b.y} ${b.w}x${b.h} in ${s.vw}x${s.vh})`)
    if (L.escapes.length) issues.push(`3:children-escape-card ${L.escapes.join(' ; ')}`)
    if (L.owl?.flipped) issues.push('3:owl-flipped')
    if (L.owl && L.owl.img && (L.owl.img.w < 40 || L.owl.img.h < 40)) issues.push(`3:owl-too-small(${L.owl.img.w}x${L.owl.img.h})`)
    if (touch) {
      const small = L.buttons.filter((x) => Math.min(x.w, x.h) < 44)
      if (small.length) issues.push(`4:touch-target<44 ${small.map((x) => `${x.label}:${x.w}x${x.h}`).join(' ; ')}`)
      const body = [...L.fonts.body, ...L.fonts.hint].filter((n) => n < 16)
      if (body.length) issues.push(`4:body-font<16(${body.join(',')})`)
    }
    const unreachable = L.buttons.filter((x) => !x.clickable)
    if (unreachable.length && !L.scrollable.length) issues.push(`3:button-not-clickable ${unreachable.map((x) => x.label).join(' ; ')}`)
  }
  if (s.docW > s.vw + 1 && s.docW > baseDocW + 1) issues.push(`3:horizontal-scroll(docW ${s.docW} > ${s.vw})`)
  if (!rec.titleOk || !rec.textOk) issues.push(`5:copy(title ${rec.titleOk}, text ${rec.textOk})`)
  if (rec.leftovers) issues.push('3:leftover-overlay')
  if (s.kind === 'missing-target') issues.push('5:missing-target-notice')
  return issues
}
