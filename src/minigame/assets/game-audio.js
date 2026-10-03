(function (window, document) {
  'use strict'

  const STORAGE_KEY = 'mach-runner:audio-enabled:v1'
  const MAX_VOICES = 8
  // Leave headroom for eight bounded voices; short effects remain clearly audible.
  const MASTER_GAIN = 0.5
  const SILENT_MODES = new Set(['ready', 'paused', 'ended', 'game-over'])
  const MUSIC_MODES = new Set(['running', 'quiz', 'transition', 'boss-intro', 'boss-question', 'boss-feedback', 'boss-victory'])
  const SCORE = [
    [220, 264, 330, 396, 440, 330, 264, 330],
    [165, 220, 247.5, 330, 247.5, 220, 165, 220],
    [196, 247.5, 294, 392, 294, 247.5, 220, 294],
    [220, 275, 330, 440, 550, 440, 330, 275],
    [247.5, 330, 396, 495, 660, 495, 396, 330],
  ]
  const EFFECTS = Object.freeze({
    jump:       { file: 'jump.ogg',       hz: 520, end: 760, duration: 0.11, gain: 0.15, cooldown: 0.07 },
    land:       { file: 'land.ogg',       hz: 150, end: 90,  duration: 0.10, gain: 0.18, cooldown: 0.08 },
    duck:       { file: 'duck.ogg',       hz: 280, end: 210, duration: 0.08, gain: 0.11, cooldown: 0.10 },
    hit:        { file: 'hit.ogg',        hz: 110, end: 55,  duration: 0.18, gain: 0.2, cooldown: 0.18 },
    correct:    { file: 'correct.ogg',    hz: 440, end: 660, duration: 0.16, gain: 0.16, cooldown: 0.12 },
    wrong:      { file: 'wrong.ogg',      hz: 220, end: 130, duration: 0.18, gain: 0.16, cooldown: 0.14 },
    boss:       { file: 'boss.ogg',       hz: 82,  end: 123, duration: 0.28, gain: 0.2, cooldown: 0.22 },
    transition: { file: 'transition.ogg', hz: 330, end: 495, duration: 0.22, gain: 0.14, cooldown: 0.18 },
    win:        { file: 'win.ogg',        hz: 495, end: 880, duration: 0.30, gain: 0.18, cooldown: 0.24 },
    click:      { file: 'click.ogg',      hz: 720, end: 600, duration: 0.055,gain: 0.09, cooldown: 0.04 },
  })

  function preference() {
    try { return window.localStorage.getItem(STORAGE_KEY) !== 'false' } catch (_) { return true }
  }

  function create(options) {
    const baseUrl = options && typeof options.baseUrl === 'string' ? options.baseUrl.replace(/\/?$/, '/') : '/minigame/runner/'
    let enabled = preference()
    let context = null
    let master = null
    let disposed = false
    let mode = 'ready'
    let stage = 0
    let hidden = !!document.hidden
    let unlockPromise = null
    let ready = Promise.resolve()
    let effectFailures = 0
    let musicStep = 0
    let musicClock = 0
    const buffers = new Map()
    const voices = new Map()
    const lastPlayed = new Map()

    function setParam(param, value, time) {
      if (param && typeof param.setValueAtTime === 'function') param.setValueAtTime(value, time)
      else if (param) param.value = value
    }

    function setMaster(value) {
      if (!master || !context) return
      try {
        master.gain.cancelScheduledValues?.(context.currentTime)
        setParam(master.gain, value, context.currentTime)
      } catch (_) {}
    }

    function removeVoice(node) {
      voices.delete(node)
      try { node.disconnect?.() } catch (_) {}
    }

    function stopVoice(node) {
      voices.delete(node)
      try { node.onended = null; node.stop?.(context ? context.currentTime : 0) } catch (_) {}
      try { node.disconnect?.() } catch (_) {}
    }

    function reserveVoice() {
      while (voices.size >= MAX_VOICES) stopVoice(voices.keys().next().value)
    }

    function track(node, kind) {
      reserveVoice()
      voices.set(node, kind)
      node.onended = () => removeVoice(node)
    }

    function silence() {
      for (const node of [...voices.keys()]) stopVoice(node)
      musicClock = 0
    }

    async function loadEffects() {
      if (!context || typeof fetch !== 'function') { effectFailures += Object.keys(EFFECTS).length; return }
      await Promise.all(Object.entries(EFFECTS).map(async ([kind, effect]) => {
        try {
          const response = await fetch(baseUrl + 'audio/' + effect.file)
          if (!response || !response.ok) throw new Error('audio fetch failed')
          const bytes = await response.arrayBuffer()
          const buffer = await context.decodeAudioData(bytes)
          if (buffer) buffers.set(kind, buffer)
          else throw new Error('audio decode returned no buffer')
        } catch (_) { effectFailures += 1 }
      }))
    }

    function playBuffer(kind, effect, buffer) {
      const source = context.createBufferSource()
      const gain = context.createGain()
      source.buffer = buffer
      setParam(gain.gain, Math.min(0.2, effect.gain), context.currentTime)
      source.connect(gain); gain.connect(master)
      track(source, kind)
      source.start(context.currentTime)
      return true
    }

    function playTone(kind, effect) {
      const now = context.currentTime
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = kind === 'hit' || kind === 'boss' ? 'square' : 'triangle'
      setParam(oscillator.frequency, effect.hz, now)
      oscillator.frequency.exponentialRampToValueAtTime?.(Math.max(20, effect.end), now + effect.duration)
      setParam(gain.gain, 0.0001, now)
      gain.gain.exponentialRampToValueAtTime?.(Math.min(0.2, effect.gain), now + 0.008)
      gain.gain.exponentialRampToValueAtTime?.(0.0001, now + effect.duration)
      oscillator.connect(gain); gain.connect(master)
      track(oscillator, kind)
      oscillator.start(now); oscillator.stop(now + effect.duration + 0.01)
      return true
    }

    function play(kind) {
      try {
        const effect = EFFECTS[kind]
        if (!effect || disposed || !enabled || hidden || !context || context.state !== 'running' || (SILENT_MODES.has(mode) && !(mode === 'ended' && kind === 'win'))) return false
        const now = context.currentTime
        if (now - (lastPlayed.get(kind) ?? -Infinity) < effect.cooldown) return false
        lastPlayed.set(kind, now)
        return buffers.has(kind) ? playBuffer(kind, effect, buffers.get(kind)) : playTone(kind, effect)
      } catch (_) { return false }
    }

    function playMusicNote() {
      const notes = SCORE[stage]
      const frequency = notes[musicStep % notes.length]
      musicStep = (musicStep + 1) % notes.length
      const now = context.currentTime
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = stage < 2 ? 'triangle' : 'square'
      setParam(oscillator.frequency, frequency, now)
      setParam(gain.gain, 0.0001, now)
      gain.gain.linearRampToValueAtTime?.(0.06, now + 0.012)
      gain.gain.exponentialRampToValueAtTime?.(0.0001, now + 0.18)
      oscillator.connect(gain); gain.connect(master)
      track(oscillator, 'music')
      oscillator.start(now); oscillator.stop(now + 0.2)
    }

    function update(dt) {
      try {
        if (disposed || !enabled || hidden || !context || context.state !== 'running' || !MUSIC_MODES.has(mode)) return
        const seconds = Number.isFinite(dt) ? Math.max(0, Math.min(1, dt)) : 0
        musicClock += seconds
        const beat = 0.48 - stage * 0.025
        let notes = 0
        while (musicClock >= beat && notes < 3) { musicClock -= beat; playMusicNote(); notes += 1 }
      } catch (_) {}
    }

    async function unlock() {
      if (disposed) return false
      if (unlockPromise) return unlockPromise
      unlockPromise = (async () => {
        try {
          if (!context) {
            const AudioContext = window.AudioContext || window.webkitAudioContext
            if (typeof AudioContext !== 'function') return false
            context = new AudioContext()
            master = context.createGain()
            master.connect(context.destination)
            ready = loadEffects()
          }
          if (context.state !== 'running') await context.resume()
          if (context.state !== 'running') return false
          hidden = !!document.hidden
          setMaster(enabled && !hidden ? MASTER_GAIN : 0)
          await ready
          return true
        } catch (_) { return false }
        finally { unlockPromise = null }
      })()
      return unlockPromise
    }

    function setEnabled(value) {
      try {
        enabled = !!value
        try { window.localStorage.setItem(STORAGE_KEY, String(enabled)) } catch (_) {}
        if (!enabled) silence()
        setMaster(enabled && !hidden ? MASTER_GAIN : 0)
      } catch (_) {}
      return enabled
    }

    function setMode(nextMode, nextStage) {
      try {
        const previousMode = mode
        mode = typeof nextMode === 'string' ? nextMode : mode
        const value = Number(nextStage)
        const selected = Number.isFinite(value) ? Math.max(0, Math.min(4, Math.floor(value))) : stage
        if (selected !== stage) { stage = selected; musicStep = 0; musicClock = 0 }
        if (mode !== previousMode && SILENT_MODES.has(mode)) silence()
      } catch (_) {}
    }

    function suspendForLifecycle() {
      hidden = true
      silence()
      setMaster(0)
      try { context?.suspend?.().catch?.(() => {}) } catch (_) {}
    }

    function onVisibility() {
      if (document.hidden) suspendForLifecycle()
      else hidden = false
    }

    function snapshot() {
      return Object.freeze({
        enabled, unlocked: !!context && context.state === 'running', contextState: context ? context.state : 'none',
        activeVoices: voices.size, loadedEffects: buffers.size, effectFailures, mode, stage, musicStep, disposed,
      })
    }

    function dispose() {
      if (disposed) return
      disposed = true
      silence(); setMaster(0)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', suspendForLifecycle)
      try { context?.close?.().catch?.(() => {}) } catch (_) {}
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', suspendForLifecycle)
    return Object.freeze({ unlock, setEnabled, setMode, play, update, dispose, snapshot, get ready() { return ready } })
  }

  window.MACH_GAME_AUDIO = Object.freeze({ create })
})(window, document)
