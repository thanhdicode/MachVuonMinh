import assert from 'node:assert/strict'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { openApp, OUT, unlockIntro, wait } from './app.mjs'

const dir = join(OUT, 'runner-redesign')
mkdirSync(dir, { recursive: true })
const storage = { 'mach-vuon-minh:guide:v2': JSON.stringify({ schemaVersion: 2, status: 'dismissed', route: null, moduleId: null, stepId: null, completedStepIds: [], completedModules: [], skippedStepIds: [], skippedModuleIds: [], lastExit: null }) }
const findFrame = (page) => page.frames().find((frame) => frame !== page.mainFrame() && frame.url() === 'about:srcdoc')
async function openGame(page) {
  await unlockIntro(page); await wait(500)
  await page.click('.mach-guide-dock__button'); await page.waitForSelector('.mach-guide-menu')
  await page.evaluate(() => [...document.querySelectorAll('.mach-guide-menu__modules button')].find((button) => button.textContent.includes('Minigame'))?.click())
  await page.waitForSelector('.mini-game-frame'); await page.waitForSelector('.mini-game-skip'); await page.click('.mini-game-skip')
  let frame = findFrame(page)
  await frame.waitForFunction(() => !document.querySelector('#startButton')?.disabled)
  assert.equal(await frame.evaluate(() => '__runnerQA' in window), false, 'production exposes no campaign test controls')
  // Instrument this browser document only, then reload the iframe. Production files stay untouched.
  const source = await frame.evaluate(() => [...document.scripts].find((script) => script.textContent.includes('const BASE_SPEED=320')).textContent)
  const tail = 'window.__runnerQA={state,effects,audio,sprites,obstacle,drawBoss,startBoss,collision,draw,STAGE_ENDS};\n})();'
  const instrumented = `window.__audioContexts=[];const NativeAudio=window.AudioContext;window.AudioContext=class extends NativeAudio{constructor(...args){super(...args);window.__audioContexts.push(this)}};\n` + source.replace(/\}\)\(\);\s*$/, tail)
  assert.notEqual(instrumented, source)
  await page.evaluate(({ source, instrumented }) => { const iframe = document.querySelector('.mini-game-frame'), original = iframe.srcdoc.replace(/\r\n/g, '\n'); if (!original.includes(source)) throw new Error('QA source does not match the iframe document'); iframe.srcdoc = original.replace(source, instrumented) }, { source, instrumented })
  await wait(150)
  frame = findFrame(page)
  await frame.waitForFunction(() => window.__runnerQA && !document.querySelector('#startButton')?.disabled)
  return frame
}
const hash = (frame) => frame.evaluate(() => document.querySelector('#gameCanvas').toDataURL())
const snap = (frame) => frame.evaluate(() => {
  const q = window.__runnerQA, r = document.querySelector('#gameCanvas').getBoundingClientRect()
  return { mode: q.state.mode, stage: q.state.stage, hearts: q.state.hearts, score: q.state.score, y: q.state.player.y, duck: q.state.player.duck, bossHp: q.state.boss?.hp, canvas: { width: r.width, height: r.height, dpr: document.querySelector('#gameCanvas').width / r.width }, audio: q.audio.snapshot(), contexts: window.__audioContexts.length }
})
async function capture(viewport) {
  const { browser, page, errors } = await openApp({ ...viewport, storage })
  const report = { name: viewport.name, checks: [], errors }
  const check = (name) => report.checks.push(name)
  try {
    const frame = await openGame(page)
    assert.equal((await snap(frame)).contexts, 0); check('silent before gesture')
    await page.screenshot({ path: join(dir, `${viewport.name}-ready.png`) })
    await frame.click('#startButton')
    await frame.waitForFunction(() => window.__runnerQA.audio.snapshot().loadedEffects === 10)
    assert.equal((await snap(frame)).contexts, 1)
    await page.screenshot({ path: join(dir, `${viewport.name}-run-1.png`) })
    const first = await hash(frame); await wait(130); const second = await hash(frame)
    assert.notEqual(first, second); check('runner and road animate')
    await page.screenshot({ path: join(dir, `${viewport.name}-run-2.png`) })
    await frame.focus('#gameCanvas'); await page.keyboard.down('ArrowUp'); await wait(80)
    assert.ok((await snap(frame)).y < -5); await page.keyboard.up('ArrowUp'); check('real keyboard jump')
    await frame.waitForFunction(() => window.__runnerQA.state.player.y === 0)
    await page.keyboard.down('ArrowDown'); assert.equal((await snap(frame)).duck, true)
    await page.keyboard.up('ArrowDown'); assert.equal((await snap(frame)).duck, false); check('duck release')
    if (viewport.touch) {
      const button = await frame.$('#jumpButton'), box = await button.boundingBox()
      await page.touchscreen.touchStart(box.x + box.width / 2, box.y + box.height / 2); await wait(80)
      assert.ok((await snap(frame)).y < -5); await page.touchscreen.touchEnd(); check('real touch jump')
      await frame.waitForFunction(() => window.__runnerQA.state.player.y === 0)
    }
    await frame.click('#pauseButton'); await wait(250)
    const paused = await snap(frame), p1 = await hash(frame); await wait(250); const p2 = await hash(frame)
    assert.equal(p1, p2); assert.equal((await snap(frame)).score, paused.score); assert.equal(paused.audio.activeVoices, 0); check('pause freezes pixels campaign and voices')
    await frame.focus('#soundButton'); await page.keyboard.press('Space')
    assert.equal((await snap(frame)).audio.enabled, false); assert.equal((await snap(frame)).mode, 'paused'); check('native sound keyboard control')
    await frame.click('#soundButton'); await frame.click('#resumeButton'); assert.equal((await snap(frame)).contexts, 1); check('resume reuses one context')
    const held = await frame.evaluate(() => { window.__machGameBridge.pauseForGuide(); return window.__machGameBridge.snapshot() })
    await wait(250)
    assert.deepEqual(await frame.evaluate(() => window.__machGameBridge.snapshot()), held); assert.equal((await snap(frame)).audio.activeVoices, 0)
    await frame.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')) }); await wait(50)
    await frame.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); window.__machGameBridge.releaseGuidePause() })
    await frame.waitForFunction(() => window.__runnerQA.audio.snapshot().unlocked); check('guide hold preserves campaign and recovers audio after hiding')
    await frame.evaluate(() => window.__runnerQA.collision())
    await frame.waitForSelector('#answers .answer')
    const correct = await frame.evaluate(() => window.__runnerQA.state.activeQuestion.correct)
    await frame.click(`#answers .answer:nth-child(${correct + 1})`)
    assert.equal((await snap(frame)).hearts, 3); await frame.click('#continueButton'); check('correct collision answer keeps heart')
    await frame.evaluate(() => window.__runnerQA.collision())
    const wrong = await frame.evaluate(() => (window.__runnerQA.state.activeQuestion.correct + 1) % 4)
    await frame.click(`#answers .answer:nth-child(${wrong + 1})`)
    assert.equal((await snap(frame)).hearts, 2)
    await page.screenshot({ path: join(dir, `${viewport.name}-quiz.png`) }); await frame.click('#continueButton'); check('wrong collision answer costs exactly one heart')
    // Accelerate only travel in the QA document. Boss questions, answers, UI and transitions run normally.
    for (let stage = 0; stage < 5; stage++) {
      await frame.evaluate(() => { const q = window.__runnerQA; q.state.world = q.STAGE_ENDS[q.state.stage] * 60 - .01; q.state.obstacles = [] })
      await frame.waitForFunction(() => window.__runnerQA.state.mode === 'boss-intro')
      if (stage === 0 || stage === 4) await page.screenshot({ path: join(dir, `${viewport.name}-boss-${stage + 1}.png`) })
      await frame.click('#fightButton')
      for (let turn = 0; turn < 3; turn++) {
        const index = await frame.evaluate(() => window.__runnerQA.state.activeQuestion.correct)
        await frame.click(`#bossAnswers .answer:nth-child(${index + 1})`)
        assert.equal((await snap(frame)).bossHp, 2 - turn)
        await wait(viewport.name === 'desktop' ? 120 : 30)
        await frame.click('#bossContinueButton')
      }
      assert.equal((await snap(frame)).hearts, 2)
      await frame.click('#nextStageButton')
      if (stage < 4) {
        await frame.waitForFunction(() => window.__runnerQA.state.mode === 'running')
        assert.equal((await snap(frame)).stage, stage + 1)
        await page.screenshot({ path: join(dir, `${viewport.name}-stage-${stage + 2}.png`) })
      }
    }
    assert.equal((await snap(frame)).mode, 'ended'); check('five bosses HP questions progression and victory')
    await page.screenshot({ path: join(dir, `${viewport.name}-complete.png`) })
    await frame.click('#restartButton'); assert.equal((await snap(frame)).hearts, 3); assert.equal((await snap(frame)).contexts, 1); check('restart resets campaign without extra context')
    // Explicit hidden event on this browser document tests game + engine handling without stealing tab focus.
    await frame.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')) })
    assert.equal((await snap(frame)).mode, 'paused'); assert.equal((await snap(frame)).audio.activeVoices, 0)
    await frame.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')) })
    assert.equal((await snap(frame)).mode, 'paused'); await frame.click('#resumeButton')
    await frame.waitForFunction(() => window.__runnerQA.audio.snapshot().unlocked); check('hidden silences; explicit resume restores audio')
    const fallbacks = await frame.evaluate(() => {
      const q = window.__runnerQA, canvas = document.querySelector('#gameCanvas'), ctx = canvas.getContext('2d'), matrix = ctx.getTransform(), before = JSON.stringify(q.state)
      const at = (x, y) => Array.from(ctx.getImageData(Math.floor(x * matrix.a), Math.floor(y * matrix.d), 1, 1).data).slice(0, 3)
      const saw = q.sprites.pixel_saw, boss = q.sprites.pixel_boss, blink = q.sprites.pixel_boss_blink, originalBoss = q.state.boss, effect = q.state.effect
      delete q.sprites.pixel_saw; q.obstacle({ kind: 'saw', x: 400, w: 50, h: 60 }); const sawColor = at(403, 276)
      delete q.sprites.pixel_boss; delete q.sprites.pixel_boss_blink; q.state.boss = { hp: 3 }; q.state.effect = null; q.drawBoss()
      const bossColor = at((canvas.width / matrix.a) * .78 - 74 + 6, 333 - 74)
      q.sprites.pixel_saw = saw; q.sprites.pixel_boss = boss; q.sprites.pixel_boss_blink = blink; q.state.boss = originalBoss; q.state.effect = effect; q.draw()
      return { sawColor, bossColor, preserved: before === JSON.stringify(q.state) }
    })
    assert.deepEqual(fallbacks.sawColor, [85, 95, 100]); assert.deepEqual(fallbacks.bossColor, [89, 98, 99]); assert.equal(fallbacks.preserved, true); check('missing saw and boss art stays visible; campaign unchanged')
    report.metrics = await snap(frame)
    assert.ok(report.metrics.canvas.dpr <= (viewport.touch ? 1 : 1.5) + .01); check('DPR cap')
    await frame.evaluate(() => window.dispatchEvent(new Event('pagehide')))
    assert.equal((await snap(frame)).audio.disposed, true); assert.equal((await snap(frame)).audio.activeVoices, 0); check('close disposes audio')
    assert.equal(errors.length, 0)
    report.pass = true
  } catch (error) { report.pass = false; report.failure = error.stack; await page.screenshot({ path: join(dir, `${viewport.name}-failure.png`) }).catch(() => {}) }
  finally { await browser.close() }
  writeFileSync(join(dir, `${viewport.name}.json`), JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report, null, 2))
  return report
}
const results = []
for (const viewport of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844, touch: true, scale: 2 },
  { name: 'landscape', width: 844, height: 390, touch: true },
  { name: 'reduced', width: 1280, height: 800, reduced: true },
].filter((viewport) => !process.env.QA_CASE || viewport.name === process.env.QA_CASE)) results.push(await capture(viewport))
const recorded = process.env.QA_CASE ? ['desktop', 'mobile', 'landscape', 'reduced'].map((name) => join(dir, `${name}.json`)).filter(existsSync).map((file) => JSON.parse(readFileSync(file, 'utf8'))) : results
writeFileSync(join(dir, 'result.json'), JSON.stringify({ url: process.env.QA_URL, results: recorded, pass: recorded.every((result) => result.pass) }, null, 2) + '\n')
if (results.some((result) => !result.pass)) process.exitCode = 1
