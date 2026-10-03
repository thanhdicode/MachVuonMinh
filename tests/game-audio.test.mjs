import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

const source = await readFile('src/minigame/assets/game-audio.js', 'utf8')

function harness({ stored = null, fetchFails = false, decodeFails = false } = {}) {
  const listeners = new Map()
  const storage = new Map(stored === null ? [] : [['mach-runner:audio-enabled:v1', stored]])
  const contexts = []
  const fetches = []

  class Param {
    value = 0
    values = []
    setValueAtTime(value) { this.value = value; this.values.push(value) }
    linearRampToValueAtTime(value) { this.value = value; this.values.push(value) }
    exponentialRampToValueAtTime(value) { this.value = value; this.values.push(value) }
    cancelScheduledValues() {}
  }

  class Context {
    constructor() {
      this.currentTime = 1
      this.state = 'suspended'
      this.destination = {}
      this.nodes = []
      contexts.push(this)
    }
    async resume() { this.state = 'running' }
    async suspend() { this.state = 'suspended' }
    async close() { this.state = 'closed' }
    createGain() { const node = { kind: 'gain', gain: new Param(), connect() {}, disconnect() {} }; this.nodes.push(node); return node }
    createOscillator() { return this.#source('oscillator') }
    createBufferSource() { return this.#source('buffer') }
    #source(kind) {
      const node = {
        kind, frequency: new Param(), playbackRate: new Param(), onended: null, stopped: false,
        connect() {}, disconnect() {}, start() { this.started = true },
        stop(time = 0) { if (this.stopped) return; this.stopped = true; this.stopAt = time },
      }
      this.nodes.push(node)
      return node
    }
    async decodeAudioData(bytes) { if (decodeFails) throw new Error('decode failed'); return { bytes: bytes.byteLength } }
  }

  const document = {
    hidden: false,
    addEventListener(type, listener) { const set = listeners.get(type) || new Set(); set.add(listener); listeners.set(type, set) },
    removeEventListener(type, listener) { listeners.get(type)?.delete(listener) },
  }
  const campaign = Object.freeze({ score: 17, hearts: 2, stage: 3 })
  const window = {
    AudioContext: Context,
    MACH_GAME_STATE: campaign,
    localStorage: {
      getItem(key) { return storage.get(key) ?? null },
      setItem(key, value) { storage.set(key, String(value)) },
    },
    addEventListener(type, listener) { const set = listeners.get(type) || new Set(); set.add(listener); listeners.set(type, set) },
    removeEventListener(type, listener) { listeners.get(type)?.delete(listener) },
  }
  const fetch = async (url) => {
    fetches.push(url)
    if (fetchFails) throw new Error('offline')
    return { ok: true, async arrayBuffer() { return new Uint8Array([1, 2, 3]).buffer } }
  }
  vm.runInNewContext(source, { window, document, fetch, console })
  const fire = (type) => { for (const listener of listeners.get(type) || []) listener() }
  return { api: window.MACH_GAME_AUDIO, campaign, contexts, document, fetches, fire, storage }
}

test('creates and resumes one AudioContext only through unlock while preserving mute preference', async () => {
  const h = harness({ stored: 'false' })
  const audio = h.api.create({ baseUrl: '/minigame/runner/' })
  assert.equal(h.contexts.length, 0)
  assert.equal(audio.snapshot().enabled, false)
  assert.equal(await audio.unlock(), true)
  assert.equal(await audio.unlock(), true)
  assert.equal(h.contexts.length, 1)
  assert.equal(h.contexts[0].state, 'running')
  assert.ok(h.fetches.every((url) => url.startsWith('/minigame/runner/audio/')))
  audio.setEnabled(true)
  assert.equal(h.storage.get('mach-runner:audio-enabled:v1'), 'true')
})

test('mute, paused mode, hidden documents and pagehide stop every active voice without automatic resume', async () => {
  const h = harness()
  const audio = h.api.create({ baseUrl: '/minigame/runner/' })
  await audio.unlock()
  audio.setMode('running', 0)
  audio.play('jump')
  assert.equal(audio.snapshot().activeVoices, 1)
  audio.setEnabled(false)
  assert.equal(audio.snapshot().activeVoices, 0)
  audio.setEnabled(true)
  audio.play('land')
  audio.setMode('paused', 0)
  assert.equal(audio.snapshot().activeVoices, 0)
  audio.setMode('running', 0)
  audio.play('duck')
  h.document.hidden = true
  h.fire('visibilitychange')
  assert.equal(audio.snapshot().activeVoices, 0)
  assert.equal(h.contexts[0].state, 'suspended')
  h.document.hidden = false
  h.fire('visibilitychange')
  assert.equal(h.contexts[0].state, 'suspended')
  await audio.unlock()
  audio.play('hit')
  h.fire('pagehide')
  assert.equal(audio.snapshot().activeVoices, 0)
})

test('dispose silences voices, removes lifecycle listeners and closes the context', async () => {
  const h = harness()
  const audio = h.api.create({ baseUrl: '/minigame/runner/' })
  await audio.unlock()
  audio.play('boss')
  audio.dispose()
  assert.equal(audio.snapshot().activeVoices, 0)
  assert.equal(audio.snapshot().disposed, true)
  assert.equal(h.contexts[0].state, 'closed')
  assert.equal(await audio.unlock(), false)
  h.fire('pagehide')
})

test('the one completion cue can finish after ending; repeated frame sync never cuts it off', async () => {
  const h = harness(), audio = h.api.create({ baseUrl: '/minigame/runner/' })
  await audio.unlock()
  assert.equal(audio.play('win'), false)
  audio.setMode('running', 4)
  audio.play('jump')
  audio.setMode('ended', 4)
  assert.equal(audio.snapshot().activeVoices, 0)
  assert.equal(audio.play('jump'), false)
  assert.equal(audio.play('win'), true)
  for (let i = 0; i < 10; i++) { audio.setMode('ended', 4); audio.update(.016) }
  assert.equal(audio.snapshot().activeVoices, 1)
  audio.setEnabled(false)
  assert.equal(audio.snapshot().activeVoices, 0)
})

test('failed fetch and decode never escape, and generated effects remain usable', async () => {
  for (const options of [{ fetchFails: true }, { decodeFails: true }]) {
    const h = harness(options)
    const audio = h.api.create({ baseUrl: '/minigame/runner/' })
    assert.equal(await audio.unlock(), true)
    audio.setMode('running', 0)
    assert.doesNotThrow(() => audio.play('correct'))
    assert.ok(audio.snapshot().effectFailures > 0)
    assert.equal(audio.snapshot().activeVoices, 1)
  }
})

test('update alone advances five quiet stage scores and the voice pool never exceeds eight', async () => {
  const h = harness()
  const audio = h.api.create({ baseUrl: '/minigame/runner/' })
  await audio.unlock()
  for (let stage = 0; stage < 5; stage += 1) {
    audio.setMode('running', stage)
    audio.update(0.5)
    h.contexts[0].currentTime += 0.5
  }
  const musicNodes = h.contexts[0].nodes.filter((node) => node.kind === 'oscillator')
  assert.ok(musicNodes.length >= 5)
  for (const kind of ['jump', 'land', 'duck', 'hit', 'correct', 'wrong', 'boss', 'transition', 'win', 'click']) {
    h.contexts[0].currentTime += 0.3
    audio.play(kind)
  }
  assert.ok(audio.snapshot().activeVoices <= 8)
  const gainNodes = h.contexts[0].nodes.filter((node) => node.kind === 'gain')
  assert.ok(gainNodes[0].gain.values.every((value) => value <= 0.5), 'master retains headroom for the bounded voice pool')
  const gains = gainNodes.slice(1).flatMap((node) => [node.gain.value, ...node.gain.values])
  assert.ok(gains.every((value) => value <= 0.2))
  assert.deepEqual(h.campaign, { score: 17, hearts: 2, stage: 3 })
})
