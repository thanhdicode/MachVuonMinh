import assert from 'node:assert/strict'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { launch } from './browser.mjs'
import { OUT } from './app.mjs'

const source = readFileSync('src/minigame/assets/game-audio.js', 'utf8')
const { browser, page, errors } = await launch()
try {
  const base = process.env.QA_URL || 'http://127.0.0.1:5180/'
  await page.setRequestInterception(true)
  page.on('request', (request) => request.url().endsWith('/favicon.ico') ? request.respond({ status: 204 }) : request.continue())
  await page.goto(base + 'minigame/runner/images/hero-run.png')
  await page.click('body')
  const levels = await page.evaluate(async (source) => {
    const Native = window.AudioContext, gains = []
    window.AudioContext = class extends Native { createGain() { const gain = super.createGain(); gains.push(gain); return gain } }
    new Function(source)()
    const audio = window.MACH_GAME_AUDIO.create({ baseUrl: '/minigame/runner/' })
    await audio.unlock(); audio.setMode('quiz', 0)
    const analyser = gains[0].context.createAnalyser(); analyser.fftSize = 2048; gains[0].connect(analyser)
    const samples = new Float32Array(2048), levels = {}
    for (const kind of ['jump', 'land', 'duck', 'hit', 'correct', 'wrong', 'boss', 'transition', 'win', 'click']) {
      audio.play(kind)
      let peak = 0, rms = 0
      for (let i = 0; i < 40; i++) {
        await new Promise((resolve) => setTimeout(resolve, 10)); analyser.getFloatTimeDomainData(samples)
        let sum = 0; for (const value of samples) { peak = Math.max(peak, Math.abs(value)); sum += value * value }
        rms = Math.max(rms, Math.sqrt(sum / samples.length))
      }
      levels[kind] = { peak, rms, peakDb: 20 * Math.log10(Math.max(peak, 1e-8)), rmsDb: 20 * Math.log10(Math.max(rms, 1e-8)) }
      audio.setMode('paused', 0); audio.setMode('quiz', 0)
    }
    audio.setEnabled(false); await new Promise((resolve) => setTimeout(resolve, 80)); analyser.getFloatTimeDomainData(samples)
    levels.mutePeak = Math.max(...samples.map(Math.abs)); audio.dispose()
    return levels
  }, source)
  console.log(JSON.stringify({ levels, errors }, null, 2))
  assert.equal(errors.length, 0)
  assert.ok(Object.entries(levels).filter(([name]) => name !== 'mutePeak').every(([, level]) => level.peak > .02 && level.peak < .5))
  assert.equal(levels.mutePeak, 0)
  const dir = join(OUT, 'runner-redesign'); mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'audio-levels.json'), JSON.stringify({ levels, errors, pass: true }, null, 2) + '\n')
} finally { await browser.close() }
