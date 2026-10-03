// Cú Mạch inside the minigame iframe. Runs in the srcdoc document, so Driver.js is created here (never in the parent).
// Vanilla, no imports. Talks to the game only through window.__machGameBridge and to the exhibit through the nonce'd
// postMessage protocol described in src/onboarding/gameGuideProtocol.ts.
(() => {
  'use strict';
  const cfg = window.MACH_GAME_CONFIG;
  const bridge = window.__machGameBridge;
  const launcher = document.getElementById('guideLauncher');
  if (!cfg || !cfg.guide || !bridge || !launcher) return;

  const G = cfg.guide;
  const doc = document;
  const steps = G.steps;
  const stepAt = new Map(steps.map((step, index) => [step.id, index]));
  const inFrame = window.parent !== window;
  const mq = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  // Interface chrome that is not part of the exhibit copy catalog.
  const UI = {
    module: 'GAME', finish: 'Xong phần này', close: 'Đóng hướng dẫn', retry: 'Thử lại', illustration: 'Tình huống minh họa',
    launcher: 'Cú Mạch / Cách chơi', howto: 'Cách chơi bằng chữ', more: 'Thêm lựa chọn', jumped: 'Mình thấy bạn đã nhảy xong.', ducked: 'Mình thấy bạn đã cúi rồi đứng lại.',
  };
  const IDS = { title: 'mach-guide-title', desc: 'mach-guide-desc' };

  // ---------- small helpers ----------
  const esc = (text) => String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function h(tag, props, ...kids) {
    const node = doc.createElement(tag);
    if (props) {
      for (const key of Object.keys(props)) {
        const value = props[key];
        if (value == null || value === false) continue;
        if (key === 'class') node.className = value;
        else if (key === 'text') node.textContent = value;
        else if (key === 'on') for (const type of Object.keys(value)) node.addEventListener(type, value[type]);
        else node.setAttribute(key, value === true ? '' : String(value));
      }
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) node.append(kid);
    return node;
  }
  const byId = (id) => doc.getElementById(id);
  function visible(el) {
    if (!el || !el.isConnected || !el.getClientRects().length) return false;
    const box = el.getBoundingClientRect();
    if (box.width < 1 || box.height < 1) return false;
    const style = window.getComputedStyle(el);
    return style.visibility !== 'hidden' && style.display !== 'none';
  }
  const shown = (id) => { const el = byId(id); return !!el && !el.classList.contains('hidden') && visible(el); };
  function firstVisible(name) {
    if (!/^[a-z][a-z0-9-]*$/.test(name)) return null;
    return Array.from(doc.querySelectorAll('[data-guide~="' + name + '"]')).find(visible) || null;
  }
  const warn = (where, error) => { try { console.warn('[game-guide] ' + where, error); } catch (ignored) { /* console unavailable */ } };
  // Every cleanup routine runs even if an earlier one throws.
  function runAll(label, tasks) { for (const task of tasks) { try { task(); } catch (error) { warn(label, error); } } }
  const abortError = () => Object.assign(new Error('aborted'), { aborted: true });
  function frames(count, signal) {
    return new Promise((resolve, reject) => {
      if (signal.aborted) { reject(abortError()); return; }
      let left = count;
      let id = 0;
      const onAbort = () => { window.cancelAnimationFrame(id); reject(abortError()); };
      signal.addEventListener('abort', onAbort, { once: true });
      const tick = () => {
        left -= 1;
        if (left <= 0) { signal.removeEventListener('abort', onAbort); resolve(); } else id = window.requestAnimationFrame(tick);
      };
      id = window.requestAnimationFrame(tick);
    });
  }
  function post(type, fields) {
    if (!inFrame) return;
    try { window.parent.postMessage(Object.assign({ type, nonce: cfg.nonce }, fields || {}), cfg.origin); } catch (error) { warn('post', error); }
  }

  // ---------- state ----------
  const S = {
    phase: 'idle', // idle | loading | step | practice | paused | failed
    run: 0, ac: null, index: -1, active: false, contextual: false, busy: false, verified: false,
    enabled: false, ended: false, resume: -1, done: new Set(), hinted: new Set(),
    driver: null, driverState: 'none', driverPromise: null, returnFocus: null,
    reducedPref: !!G.reduced, reduced: !!G.reduced || !!(mq && mq.matches), started: false,
  };
  const ui = { cue: null, card: null, proxy: null, ring: null, animations: new Set(), frameId: 0 };
  const live = (run) => run === S.run && S.active;

  // ---------- Driver loading (lazy, with a deadline) ----------
  function loadDriver() {
    if (S.driverState === 'ready') return Promise.resolve();
    if (S.driverPromise) return S.driverPromise;
    S.driverState = 'loading';
    S.driverPromise = new Promise((resolve, reject) => {
      let settled = false;
      let cssDone = false;
      let jsDone = false;
      const nodes = [];
      const fail = (reason) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        nodes.forEach((node) => node.remove());
        S.driverState = 'failed';
        S.driverPromise = null;
        reject(Object.assign(new Error('driver-' + reason), { reason }));
      };
      const check = () => {
        if (settled || !cssDone || !jsDone) return;
        const factory = window.driver && window.driver.js && window.driver.js.driver;
        if (typeof factory !== 'function') { fail('load'); return; }
        settled = true;
        clearTimeout(timer);
        S.driverState = 'ready';
        resolve();
      };
      const timer = setTimeout(() => fail('timeout'), G.driverDeadlineMs);
      const link = h('link', { rel: 'stylesheet', href: G.vendorBase + 'driver.css', 'data-mach-driver': '' });
      const script = h('script', { src: G.vendorBase + 'driver.js.iife.js', 'data-mach-driver': '' });
      link.addEventListener('load', () => { cssDone = true; check(); });
      link.addEventListener('error', () => fail('load'));
      script.addEventListener('load', () => { jsDone = true; check(); });
      script.addEventListener('error', () => fail('load'));
      nodes.push(link, script);
      doc.head.append(link, script);
    });
    // A failed attempt must not leave an unhandled rejection behind; callers observe it through their own race below.
    S.driverPromise.catch(() => {});
    return S.driverPromise;
  }
  function withSignal(promise, signal) {
    return new Promise((resolve, reject) => {
      if (signal.aborted) { reject(abortError()); return; }
      signal.addEventListener('abort', () => reject(abortError()), { once: true });
      promise.then(resolve, reject);
    });
  }

  function driverConfig() {
    return {
      animate: !S.reduced, duration: S.reduced ? 0 : 280, smoothScroll: false, allowKeyboardControl: false, allowClose: true,
      overlayColor: '#171512', overlayOpacity: 0.62, stagePadding: 6, stageRadius: 8, popoverOffset: 12,
      popoverClass: 'mach-guide', showButtons: ['next', 'previous', 'close'], disableActiveInteraction: true,
      // Clicking the dimmed page must not dismiss the guide; Skip and × are explicit.
      overlayClickBehavior: () => {},
      onNextClick: () => advance(),
      onPrevClick: () => goBack(),
      onCloseClick: () => closeGuide(),
      onDoneClick: () => finishGuide(),
      onDestroyStarted: () => closeGuide(),
    };
  }
  function ensureDriver() {
    if (S.driver) return S.driver;
    S.driver = window.driver.js.driver(driverConfig());
    return S.driver;
  }

  // ---------- owl art ----------
  const easing = (name) => ({ 'power2.out': 'cubic-bezier(0.215, 0.61, 0.355, 1)', 'power1.out': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }[name] || 'ease-out');
  function track(animation) {
    if (!animation) return;
    ui.animations.add(animation);
    animation.onfinish = () => ui.animations.delete(animation);
  }
  function animateIn(el, motion) {
    const token = G.motionTokens[motion];
    if (S.reduced || !el || !token || !token.durationMs || typeof el.animate !== 'function') return;
    try {
      track(el.animate(
        [{ opacity: token.opacity ? token.opacity[0] : 1, transform: 'translateY(' + (token.translateY || 0) + 'px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: token.durationMs, easing: easing(token.ease), fill: 'backwards' },
      ));
    } catch (error) { warn('animate', error); }
  }
  function nod(el) {
    const token = G.motionTokens.confirm;
    if (S.reduced || !el || !token || typeof el.animate !== 'function') return;
    try {
      track(el.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(' + (token.rotationDeg || 3) + 'deg)' }, { transform: 'rotate(0deg)' }], { duration: token.durationMs, easing: easing(token.ease) }));
    } catch (error) { warn('nod', error); }
  }
  let assetNoted = false;
  function noteAssetFailure() {
    if (assetNoted || !G.systemCopy.assetFailed) return;
    assetNoted = true;
    const host = doc.querySelector('.mach-guide .mach-body, .mach-cue .mach-body');
    if (host) host.append(h('p', { class: 'mach-note', role: 'status', text: G.systemCopy.assetFailed }));
  }
  function owlImage(pose) {
    const img = h('img', { class: 'mach-owl', alt: '', width: '96', height: '96', decoding: 'async', draggable: 'false', 'data-pose': pose });
    img.addEventListener('error', () => { img.remove(); noteAssetFailure(); });
    img.src = G.assetBase + 'owl-' + pose + '.webp';
    return img;
  }
  // Static poses only: the new image fades in over the old one, nothing is flipped or animated independently.
  function setPose(art, pose) {
    if (!art) return;
    const current = art.querySelector('.mach-owl');
    if (current && current.getAttribute('data-pose') === pose) return;
    const next = owlImage(pose);
    art.append(next);
    if (!current) return;
    if (!S.reduced && typeof next.animate === 'function') {
      try {
        const fade = next.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
        track(fade);
        fade.onfinish = () => { current.remove(); ui.animations.delete(fade); };
      } catch (error) { current.remove(); }
    } else current.remove();
  }

  // ---------- step resolution ----------
  const BEHAVIOR = {
    'game-start': { optional: true, find: () => firstVisible('game-start') },
    'game-jump': { practice: 'jump', find: () => firstVisible('game-jump') },
    'game-duck': { practice: 'duck', find: () => firstVisible('game-duck') },
    'game-pause': { find: () => firstVisible('game-pause') },
    'game-hud': { find: hudProxy },
    'game-hearts': { find: () => firstVisible('game-hearts') },
    'game-quiz-help': { optional: true, illustration: 'quiz', find: () => (shown('quizOverlay') ? firstVisible('game-quiz-help') : null) },
    'game-boss-help': { optional: true, illustration: 'boss', find: () => (shown('bossPanel') ? firstVisible('game-boss-help') : null) },
    'game-next-retry-help': { optional: true, illustration: 'next', find: () => (shown('bossVictory') || shown('endOverlay') ? firstVisible('game-next-retry-help') : null) },
    'game-guide-replay': { interactive: true, find: () => (visible(launcher) ? launcher : null) },
  };
  // The HUD spans two grid rows, so a fixed proxy box stands in for it.
  function hudProxy() {
    const bar = doc.querySelector('.game-toolbar');
    const row = doc.querySelector('.stage-progress-row');
    if (!visible(bar) || !visible(row)) return null;
    const a = bar.getBoundingClientRect();
    const b = row.getBoundingClientRect();
    if (!ui.proxy) { ui.proxy = h('div', { class: 'mach-proxy', 'aria-hidden': 'true' }); doc.body.append(ui.proxy); }
    const left = Math.min(a.left, b.left);
    const top = Math.min(a.top, b.top);
    ui.proxy.style.cssText = 'left:' + left + 'px;top:' + top + 'px;width:' + (Math.max(a.right, b.right) - left) + 'px;height:' + (Math.max(a.bottom, b.bottom) - top) + 'px';
    return ui.proxy;
  }
  function finalBossShown() {
    const button = byId('nextStageButton');
    return shown('bossVictory') && !!button && /HOÀN THÀNH HÀNH TRÌNH/.test(button.textContent || '');
  }
  function situation() {
    const snap = bridge.snapshot();
    return { 'quiz-no-hearts': snap.hearts === 0 && (shown('quizOverlay') || shown('bossQuestionArea')), 'boss-final': finalBossShown() };
  }
  function resolve(index) {
    const step = steps[index];
    const behavior = BEHAVIOR[step.target] || {};
    const ctx = situation();
    const variant = (step.variants || []).find((candidate) => ctx[candidate.when]) || null;
    const target = behavior.find ? behavior.find() : null;
    const illustration = !target && behavior.illustration ? behavior.illustration : null;
    return {
      index, step, target, illustration,
      practice: step.kind === 'practice' ? behavior.practice || 'jump' : null,
      interactive: !!behavior.interactive,
      missing: !target && !illustration && !behavior.optional,
      title: step.title, say: variant ? variant.say : step.say,
      pose: (variant && variant.pose) || step.pose, motion: (variant && variant.motion) || step.motion,
      counter: UI.module + ' · ' + String(index + 1).padStart(2, '0') + ' / ' + String(steps.length).padStart(2, '0'),
      canBack: !S.contextual && index > 0,
      last: !S.contextual && index === steps.length - 1,
    };
  }
  function chooseSide(rect) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(368, vw - 24);
    const space = { top: rect.top, bottom: vh - rect.bottom, left: rect.left, right: vw - rect.right };
    const fits = { bottom: space.bottom >= 316, top: space.top >= 316, right: space.right >= width + 16, left: space.left >= width + 16 };
    const middle = rect.top + rect.height / 2;
    const order = middle < vh * 0.4 ? ['bottom', 'right', 'left', 'top'] : middle > vh * 0.6 ? ['top', 'left', 'right', 'bottom'] : ['left', 'right', 'bottom', 'top'];
    return order.find((side) => fits[side]) || (space.bottom > space.top ? 'bottom' : 'top');
  }
  // Left/right pose follows the target's real position; the artwork is never mirrored in CSS.
  function owlFor(pose, rect, side) {
    if (pose === 'point-left') return { pose, side: 'left' };
    if (pose !== 'point-right' || !rect) return { pose, side: 'left' };
    const width = Math.min(368, window.innerWidth - 24);
    let dx;
    if (side === 'left') dx = 1;
    else if (side === 'right') dx = -1;
    else {
      const cx = rect.left + rect.width / 2;
      const left = Math.min(Math.max(cx - width / 2, 8), window.innerWidth - width - 8);
      dx = (cx - (left + width / 2)) / width;
    }
    if (dx < -0.2) return { pose: 'point-left', side: 'left' };
    if (dx > 0.2) return { pose, side: 'right' };
    return { pose, side: 'left' };
  }

  // ---------- card content (shared by the Driver popover and the standalone cues) ----------
  function textButton(label, onClick, extra) {
    return h('button', { type: 'button', class: 'mach-btn ' + (extra || ''), text: label, on: { click: onClick } });
  }
  function closeButton(onClick) {
    return h('button', { type: 'button', class: 'mach-close', 'aria-label': UI.close, title: UI.close, text: '×', on: { click: onClick } });
  }
  function illustrationFor(kind) {
    const rows = ['A', 'B', 'C', 'D'].map((letter) => h('div', { class: 'mach-mock-row' }, h('i', { text: letter }), h('b')));
    const mock = {
      quiz: h('div', { class: 'mach-mock-card' }, h('div', { class: 'mach-mock-top' }, h('span', { text: 'GIAI ĐOẠN 01' }), h('span', { text: '♥ GIỮ LẠI TRÁI TIM' })), h('div', { class: 'mach-mock-q' }), rows, h('div', { class: 'mach-mock-btn', text: 'TIẾP TỤC CHẠY →' })),
      boss: h('div', { class: 'mach-mock-card' }, h('div', { class: 'mach-mock-top' }, h('span', { text: 'BOSS · 3 / 3 HP' }), h('span', { class: 'mach-mock-hp' }, h('i'), h('i'), h('i'))), h('div', { class: 'mach-mock-q' }), rows, h('div', { class: 'mach-mock-fb' })),
      next: h('div', { class: 'mach-mock-card' }, h('div', { class: 'mach-mock-btn', text: 'GIAI ĐOẠN TIẾP THEO ↗' }), h('div', { class: 'mach-mock-btn is-alt', text: 'CHƠI LẠI ↗' })),
    }[kind];
    const figure = h('div', { class: 'mach-illus-art', 'aria-hidden': 'true', inert: true }, mock);
    return h('figure', { class: 'mach-illus' }, h('p', { class: 'mach-illus-label', text: UI.illustration }), figure);
  }
  // model: { pose, counter, title, say, note, illustration, extra, live, back, next, secondary[], skip, close }
  function buildInner(model, slots) {
    slots = slots || {};
    const art = h('div', { class: 'mach-art' }, model.pose ? owlImage(model.pose) : null);
    const eyebrow = slots.progress || h('span');
    eyebrow.classList.add('mach-eyebrow');
    eyebrow.textContent = model.counter || '';
    const title = slots.title || h('h2', { id: IDS.title });
    title.classList.add('mach-title');
    title.textContent = model.title;
    const say = slots.description || h('p', { id: IDS.desc });
    say.classList.add('mach-say');
    say.textContent = model.say;
    const head = h('div', { class: 'mach-head' }, art, h('div', { class: 'mach-head-text' }, eyebrow, title));
    const liveRegion = model.live ? h('p', { class: 'mach-live', role: 'status', 'aria-live': 'polite' }) : null;
    const body = h('div', { class: 'mach-body' }, say, model.note ? h('p', { class: 'mach-note', role: 'status', text: model.note }) : null, model.illustration || null, model.extra || null, liveRegion);
    const nav = h('div', { class: 'mach-nav' }, model.back || null, model.next || null);
    const secondary = (model.secondary || []).length ? h('div', { class: 'mach-secondary' }, model.secondary) : null;
    const foot = h('div', { class: 'mach-foot' }, nav, secondary, h('div', { class: 'mach-skipbar' }, model.skip));
    return { inner: h('div', { class: 'mach-inner' }, head, body, foot, model.close || null), art, nextButton: model.next, liveRegion };
  }
  // Skip-this-guide is always present and enabled; skip-step is only offered where a practice can be abandoned.
  function standardButtons(view) {
    const labels = G.buttons;
    const secondary = [];
    if (view.practice && !S.contextual) secondary.push(textButton(labels.skipStep, skipStep, 'is-link'));
    if (!S.contextual) {
      secondary.push(textButton(labels.skipModule, () => skipAll('module'), 'is-link'));
      secondary.push(textButton(labels.pause, pauseGuide, 'is-link'));
    }
    return {
      next: textButton(view.practice ? labels.practiceDone : view.last ? UI.finish : labels.next, advance, 'is-primary'),
      back: view.canBack ? textButton(labels.back, goBack, 'is-ghost') : null,
      secondary,
      skip: textButton(labels.skipGuide, () => skipAll('guide'), 'is-skip'),
    };
  }

  // ---------- standalone cue and cards (practice, loading, paused, failed) ----------
  function removeCard() { if (ui.card) { ui.card.remove(); ui.card = null; } }
  function removeCue() { if (ui.cue) { ui.cue.remove(); ui.cue = null; } }
  function removeProxy() { if (ui.proxy) { ui.proxy.remove(); ui.proxy = null; } }
  function clearRing() { if (ui.ring) { ui.ring.classList.remove('mach-ring'); ui.ring = null; } }
  function ring(target) {
    clearRing();
    if (target && target.classList) { target.classList.add('mach-ring'); ui.ring = target; }
  }
  function mountCard(kind, model) {
    const built = buildInner(model);
    const root = h('section', {
      class: 'mach-cue', role: 'dialog', tabindex: '-1', 'data-mach-guide-ui': '', 'data-kind': kind, 'data-owl': 'left',
      'aria-labelledby': IDS.title, 'aria-describedby': IDS.desc,
    }, built.inner);
    doc.body.append(root);
    return { root, built };
  }
  function showLoading() {
    removeCard();
    const { root } = mountCard('loading', {
      pose: 'neutral', title: UI.launcher, say: G.systemCopy.preparing || '',
      skip: textButton(G.buttons.skipGuide, () => skipAll('guide'), 'is-skip'), close: closeButton(closeGuide),
    });
    ui.card = root;
  }
  function showResumeCard() {
    removeCard();
    S.phase = 'paused';
    const at = S.resume >= 0 ? S.resume : 0;
    const { root, built } = mountCard('paused', {
      pose: 'neutral', title: UI.launcher, say: G.systemCopy.paused || '',
      next: textButton(G.buttons.resume, () => { removeCard(); startRun(at); }, 'is-primary'),
      secondary: [textButton(G.buttons.replay, () => { removeCard(); startRun(0); }, 'is-link')],
      skip: textButton(G.buttons.skipGuide, () => skipAll('guide'), 'is-skip'), close: closeButton(dismissCard),
    });
    ui.card = root;
    animateIn(built.inner, 'read');
    root.focus({ preventScroll: true });
  }
  function showFailedCard(reason) {
    removeCard();
    S.phase = 'failed';
    const list = h('ol', { class: 'mach-howto-list' }, steps.map((step) => h('li', {}, h('strong', { text: step.title + '. ' }), h('span', { text: step.say }))));
    const { root } = mountCard('failed', {
      pose: 'neutral', title: UI.launcher, say: G.systemCopy.gameFailed || '',
      extra: h('details', { class: 'mach-howto', open: true }, h('summary', { text: UI.howto }), list),
      next: textButton(UI.retry, () => { const at = S.index >= 0 ? S.index : 0; removeCard(); startRun(at); }, 'is-primary'),
      skip: textButton(G.buttons.skipGuide, () => skipAll('guide'), 'is-skip'), close: closeButton(dismissCard),
    });
    ui.card = root;
    root.setAttribute('data-reason', reason);
    root.focus({ preventScroll: true });
  }
  function dismissCard() {
    removeCard();
    if (S.phase === 'paused' || S.phase === 'failed') S.phase = 'idle';
    restoreFocus();
  }

  // ---------- presenting steps ----------
  function leavePractice() {
    runAll('practice', [() => bridge.endGuidePractice(), removeCue, clearRing]);
  }
  function decoratePopover(popover, view, placement) {
    try {
      const wrapper = popover.wrapper;
      wrapper.setAttribute('data-mach-guide-ui', '');
      wrapper.setAttribute('data-owl', placement.side);
      wrapper.setAttribute('tabindex', '-1');
      wrapper.removeAttribute('aria-modal');
      popover.closeButton.classList.add('mach-close');
      popover.closeButton.setAttribute('aria-label', UI.close);
      popover.closeButton.setAttribute('title', UI.close);
      // Driver's own Next/Back/x buttons stay (their hooks are overridden); the extra controls are ours.
      popover.nextButton.textContent = view.practice ? G.buttons.practiceDone : view.last ? UI.finish : G.buttons.next;
      popover.nextButton.classList.add('mach-btn', 'is-primary');
      popover.previousButton.textContent = G.buttons.back;
      popover.previousButton.classList.add('mach-btn', 'is-ghost');
      const extras = standardButtons(view);
      const built = buildInner({
        pose: placement.pose, counter: view.counter, title: view.title, say: view.say,
        note: view.missing ? G.systemCopy.missingTarget : '', illustration: view.illustration ? illustrationFor(view.illustration) : null,
        secondary: extras.secondary, skip: extras.skip, close: popover.closeButton,
      }, { title: popover.title, description: popover.description, progress: popover.progress });
      built.inner.querySelector('.mach-nav').append(popover.footerButtons);
      popover.footer.remove();
      popover.title.style.display = '';
      popover.description.style.display = '';
      Array.from(wrapper.children).forEach((child) => { if (child !== popover.arrow) child.remove(); });
      wrapper.append(built.inner);
      animateIn(built.inner, view.motion);
      // Driver focuses the first button right after rendering; the dialog itself is the better first stop for a reader.
      window.requestAnimationFrame(() => { if (wrapper.isConnected && S.phase === 'step') wrapper.focus({ preventScroll: true }); });
    } catch (error) { warn('decorate', error); }
  }
  function showDriverStep(view) {
    removeCard();
    leavePractice();
    const driver = ensureDriver();
    const rect = view.target ? view.target.getBoundingClientRect() : null;
    const side = rect ? chooseSide(rect) : 'bottom';
    const placement = owlFor(view.pose, rect, side);
    // setConfig replaces the whole config, so it is always given the complete object.
    driver.setConfig(Object.assign(driverConfig(), { stagePadding: view.target ? 6 : 0, overlayOpacity: view.target ? 0.62 : 0.5 }));
    S.phase = 'step';
    driver.highlight({
      element: view.target || undefined,
      disableActiveInteraction: !view.interactive,
      popover: {
        title: esc(view.title), description: esc(view.say), side, align: 'center', popoverClass: 'mach-guide',
        showButtons: view.canBack ? ['next', 'previous', 'close'] : ['next', 'close'], disableButtons: [],
        showProgress: true, progressText: esc(view.counter),
        nextBtnText: esc(view.last ? UI.finish : G.buttons.next), prevBtnText: esc(G.buttons.back),
        onPopoverRender: (popover) => decoratePopover(popover, view, placement),
      },
    });
  }
  // On a phone the arena is short, so the cue keeps only Back / continue / Skip in view and tucks the other options away.
  function compactSecondary(links) {
    if (!links.length || window.innerWidth > 800) return links;
    return [h('details', { class: 'mach-more' }, h('summary', { text: UI.more }), h('div', { class: 'mach-more-list' }, links))];
  }
  function showPracticeCue(view, run) {
    removeCard();
    leavePractice();
    if (S.driver && S.driver.isActive()) S.driver.destroy();
    const extras = standardButtons(view);
    extras.secondary = compactSecondary(extras.secondary);
    const { root, built } = mountCard('practice', {
      pose: view.pose, counter: view.counter, title: view.title, say: view.say,
      note: view.missing ? G.systemCopy.missingTarget : G.systemCopy.practice, live: true,
      back: extras.back, next: extras.next, secondary: extras.secondary, skip: extras.skip, close: closeButton(closeGuide),
    });
    ui.cue = root;
    ring(view.target);
    S.phase = 'practice';
    S.verified = false;
    animateIn(built.inner, view.motion);
    const kind = view.practice;
    const accepted = bridge.beginGuidePractice(kind, (event) => {
      if (!live(run) || S.phase !== 'practice' || S.verified) return;
      if ((kind === 'jump' && event.type === 'landed') || (kind === 'duck' && event.type === 'duck-end')) {
        S.verified = true;
        setPose(built.art, 'confirm');
        nod(built.art);
        if (built.liveRegion) built.liveRegion.textContent = kind === 'jump' ? UI.jumped : UI.ducked;
        built.nextButton.classList.add('is-verified');
      }
    });
    if (!accepted) warn('practice', new Error('bridge refused practice'));
    root.focus({ preventScroll: true });
  }
  async function present(index, run) {
    await frames(2, S.ac.signal);
    if (!live(run)) return;
    S.index = index;
    const view = resolve(index);
    post('guide:step', { stepId: view.step.id });
    if (view.practice) showPracticeCue(view, run); else showDriverStep(view);
    S.busy = false;
  }

  // ---------- run control ----------
  function captureFocus() {
    const active = doc.activeElement;
    return active && active !== doc.body && active.isConnected && !(active.closest && active.closest('[data-mach-guide-ui]')) ? active : null;
  }
  function restoreFocus() {
    const target = S.returnFocus;
    S.returnFocus = null;
    // Never pull focus into the game while the exhibit (parent) is the thing the user is operating.
    if (typeof doc.hasFocus === 'function' && !doc.hasFocus()) return;
    const next = target && target.isConnected && visible(target) && !target.disabled ? target : launcher;
    try { next.focus({ preventScroll: true }); } catch (error) { warn('focus', error); }
  }
  function teardownUi() {
    runAll('teardown', [
      () => { if (S.ac) S.ac.abort(); },
      () => bridge.endGuidePractice(),
      () => { if (S.driver && S.driver.isActive()) S.driver.destroy(); },
      removeCue, removeCard, removeProxy, clearRing,
      () => { ui.animations.forEach((animation) => animation.cancel()); ui.animations.clear(); },
    ]);
  }
  // Ends whatever is on screen and gives the game back; the hold is released even if a cleanup step threw.
  function endRun() {
    const had = S.active || !!ui.card || !!ui.cue;
    S.active = false;
    S.run += 1;
    S.busy = false;
    S.phase = 'idle';
    try {
      teardownUi();
    } finally {
      try { bridge.releaseGuidePause(); } catch (error) { warn('release', error); }
      if (had) restoreFocus();
    }
    return had;
  }
  function startRun(index, options) {
    const opts = options || {};
    S.started = true;
    runAll('replace', [() => { if (S.ac) S.ac.abort(); }, () => bridge.endGuidePractice(), () => { if (S.driver && S.driver.isActive()) S.driver.destroy(); }, removeCue, removeCard, removeProxy, clearRing]);
    S.run += 1;
    const run = S.run;
    S.ac = new AbortController();
    S.index = index;
    S.active = true;
    S.contextual = !!opts.contextual;
    S.ended = false;
    S.enabled = true;
    S.resume = -1;
    S.busy = true;
    S.verified = false;
    if (!S.returnFocus) S.returnFocus = captureFocus();
    try { bridge.pauseForGuide(); } catch (error) { warn('hold', error); }
    S.phase = 'loading';
    showLoading();
    const signal = S.ac.signal;
    withSignal(loadDriver(), signal)
      .then(() => (live(run) ? present(index, run) : null))
      .catch((error) => { if (live(run) && !signal.aborted) failRun(error && error.reason ? error.reason : 'load'); });
  }
  function failRun(reason) {
    const at = S.index;
    endRun();
    S.index = at;
    S.resume = at;
    // Not held and not modal: the game stays playable and the written how-to-play is on screen.
    showFailedCard(reason);
    post('guide:failed', { reason });
  }
  function markDone(step) {
    S.done.add(step.id);
    post('guide:step-done', { stepId: step.id });
  }
  function gotoIndex(index) {
    const run = S.run;
    S.busy = true;
    S.index = index;
    S.verified = false;
    present(index, run).catch((error) => { if (live(run) && !(error && error.aborted)) failRun('load'); });
  }
  function advance() {
    if (!S.active || S.busy || S.phase === 'loading') return;
    markDone(steps[S.index]);
    if (S.contextual || S.index >= steps.length - 1) { finishGuide(true); return; }
    gotoIndex(S.index + 1);
  }
  function goBack() {
    if (!S.active || S.busy || S.contextual || S.index <= 0 || S.phase === 'loading') return;
    gotoIndex(S.index - 1);
  }
  function skipStep() {
    if (!S.active || S.busy || S.phase === 'loading') return;
    post('guide:step-skipped', { stepId: steps[S.index].id });
    if (S.index >= steps.length - 1) { finishGuide(true); return; }
    gotoIndex(S.index + 1);
  }
  function finishGuide(alreadyMarked) {
    if (!S.active) return;
    const hint = S.contextual;
    if (!alreadyMarked) markDone(steps[S.index]);
    endRun();
    if (hint) {
      // A one-off hint: the guide stays armed for the other situations.
      post('guide:closed', { mode: 'guide-only' });
      return;
    }
    S.enabled = false;
    S.ended = true;
    S.resume = -1;
    post('guide:done');
  }
  // x and Esc: stop now, remember where we were so the launcher can offer to continue.
  function closeGuide() {
    if (!S.active) { if (ui.card) dismissCard(); return; }
    const at = S.contextual ? -1 : S.index;
    endRun();
    S.resume = at;
    post('guide:closed', { mode: 'guide-only' });
  }
  function pauseGuide() {
    if (!S.active) return;
    const at = S.index;
    endRun();
    S.resume = at;
    post('guide:closed', { mode: 'guide-only' });
    showResumeCard();
  }
  function skipAll(scope) {
    endRun();
    S.enabled = false;
    S.ended = true;
    S.resume = -1;
    post('guide:skipped', { scope });
  }

  // ---------- exhibit messages ----------
  function onParentCancel(mode, resumable) {
    const at = S.index;
    const hint = S.contextual;
    endRun();
    if (mode === 'dialog-closed') { S.enabled = false; S.ended = true; S.resume = -1; return; }
    S.enabled = resumable;
    S.ended = !resumable;
    S.resume = resumable && !hint ? at : -1;
    // The exhibit waits for this acknowledgement before it accepts new guide events.
    post('guide:closed', { mode: 'guide-only' });
  }
  function setReduced(next) {
    S.reducedPref = next;
    S.reduced = next || !!(mq && mq.matches);
    doc.documentElement.toggleAttribute('data-mach-reduced', S.reduced);
    if (S.reduced) { ui.animations.forEach((animation) => animation.cancel()); ui.animations.clear(); }
    if (S.driver) {
      try { S.driver.setConfig(driverConfig()); if (S.driver.isActive()) S.driver.refresh(); } catch (error) { warn('motion', error); }
    }
  }
  function onMessage(event) {
    if (event.source !== window.parent || event.origin !== cfg.origin) return;
    const data = event.data;
    if (!data || typeof data !== 'object' || Array.isArray(data) || data.nonce !== cfg.nonce) return;
    const keys = Object.keys(data);
    const exactly = (list) => keys.length === list.length && list.every((key) => keys.includes(key));
    if (data.type === 'guide:start') {
      if (!exactly(['type', 'nonce', 'stepId']) || typeof data.stepId !== 'string' || !stepAt.has(data.stepId)) return;
      // A start that arrives after the user already did something (or after a skip) is stale.
      if (!S.started && !S.ended) startRun(stepAt.get(data.stepId));
    } else if (data.type === 'guide:cancel') {
      if (!exactly(['type', 'nonce', 'mode', 'resumable']) || (data.mode !== 'guide-only' && data.mode !== 'dialog-closed') || typeof data.resumable !== 'boolean') return;
      onParentCancel(data.mode, data.resumable);
    } else if (data.type === 'guide:motion') {
      if (exactly(['type', 'nonce', 'reduced']) && typeof data.reduced === 'boolean') setReduced(data.reduced);
    }
  }

  // ---------- launcher, keyboard, contextual hints ----------
  function contextualStart() {
    const want = shown('quizOverlay') ? 'game-quiz-help' : shown('bossVictory') || shown('endOverlay') ? 'game-next-retry-help' : shown('bossPanel') ? 'game-boss-help' : null;
    const found = want ? steps.findIndex((step) => step.target === want) : -1;
    return found >= 0 ? found : 0;
  }
  function onLauncher() {
    if (S.active) { startRun(0); return; }
    if (ui.card) { ui.card.focus({ preventScroll: true }); return; }
    if (S.resume >= 0) { showResumeCard(); return; }
    startRun(contextualStart());
  }
  // Capture phase: when a guide layer is open, Esc is ours and never reaches the game (which would leave the presentation).
  function onKeydown(event) {
    if (event.key !== 'Escape' && event.code !== 'Escape') return;
    if (!S.active && !ui.card) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (S.active) closeGuide(); else dismissCard();
  }
  let hintTimer = 0;
  // Only while the guide is still switched on (closed or paused, never skipped or finished) and only once the game has
  // stopped on its own (quiz, boss intro, boss victory, end screen).
  function hintCheck() {
    hintTimer = 0;
    if (!S.enabled || S.ended || S.active || ui.card) return;
    const want = shown('quizOverlay') ? 'game-quiz-help' : shown('bossVictory') || shown('endOverlay') ? 'game-next-retry-help' : shown('bossBrief') && shown('bossPanel') ? 'game-boss-help' : null;
    if (!want || S.hinted.has(want)) return;
    const index = steps.findIndex((step) => step.target === want);
    if (index < 0 || S.done.has(steps[index].id)) return;
    S.hinted.add(want);
    startRun(index, { contextual: true });
  }
  function onResize() {
    if (ui.frameId) return;
    ui.frameId = window.requestAnimationFrame(() => {
      ui.frameId = 0;
      if (S.phase !== 'step' || !S.driver || !S.driver.isActive()) return;
      if (ui.proxy) hudProxy();
      S.driver.refresh();
    });
  }
  let observer = null;
  function watchHints() {
    if (typeof window.MutationObserver !== 'function') return;
    observer = new window.MutationObserver(() => { if (!hintTimer) hintTimer = window.setTimeout(hintCheck, 0); });
    ['quizOverlay', 'bossPanel', 'bossVictory', 'endOverlay'].forEach((id) => {
      const el = byId(id);
      if (el) observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    });
  }
  function disposeAll() {
    endRun();
    S.enabled = false;
    if (observer) observer.disconnect();
    if (hintTimer) window.clearTimeout(hintTimer);
    window.removeEventListener('message', onMessage);
    window.removeEventListener('keydown', onKeydown, true);
    window.removeEventListener('resize', onResize);
  }

  // ---------- boot ----------
  const owl = launcher.querySelector('.guide-launcher-owl');
  if (owl) { owl.addEventListener('error', () => owl.remove()); owl.src = G.assetBase + 'owl-dock.webp'; }
  launcher.hidden = false;
  launcher.addEventListener('click', onLauncher);
  window.addEventListener('message', onMessage);
  window.addEventListener('keydown', onKeydown, true);
  window.addEventListener('resize', onResize);
  window.addEventListener('pagehide', disposeAll);
  if (mq && mq.addEventListener) mq.addEventListener('change', () => setReduced(S.reducedPref));
  setReduced(S.reducedPref);
  watchHints();
  // Ready only after every listener above is attached, so the exhibit's start message cannot arrive early.
  post('guide:ready');
})();
