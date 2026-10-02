import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import vm from 'node:vm'

const out = '.studio/qa/minigame'
await mkdir(out, { recursive: true })
const profile = await mkdtemp(join(tmpdir(), 'mach-minigame-qa-'))
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless', '--no-first-run', '--no-default-browser-check', '--disable-background-networking',
  '--disable-sync', '--disable-extensions', '--enable-webgl', '--ignore-gpu-blocklist',
  '--use-angle=swiftshader', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { windowsHide: true, stdio: 'ignore' })
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
let ws, sequence = 0
const pending = new Map(), errors = [], requests = []
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence
  pending.set(id, { resolve, reject })
  ws.send(JSON.stringify({ id, method, params }))
})
async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails))
  return response.result.value
}
const inGame = expression => evaluate(`(() => {const w=document.querySelector('.mini-game-frame').contentWindow; const d=w.document;return (${expression});})()`)
async function until(test, label, timeout = 15000) {
  const end = Date.now() + timeout
  while (Date.now() < end) { if (await test()) return; await wait(100) }
  throw new Error(`Timed out: ${label}`)
}
const capture = async name => {
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  await writeFile(`${out}/${name}.png`, Buffer.from(data, 'base64'))
}
const key = async (key, code, windowsVirtualKeyCode) => {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode })
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode })
}
const source = await readFile('src/minigame/assets/game.js', 'utf8')
const questionContext = { window: {} }
vm.runInNewContext(await readFile('src/minigame/assets/questions.js', 'utf8'), questionContext)
vm.runInNewContext(await readFile('src/minigame/assets/document-questions.js', 'utf8'), questionContext)
const bank = vm.runInNewContext(source.slice(source.indexOf('  const questions = ['), source.indexOf('  const bosses = [')) + '\nquestions', questionContext)
assert.deepEqual(Array.from(bank, list => list.length), [18, 15, 16, 15, 13])
const answerCorrect = async boss => {
  const question = await inGame(`d.getElementById('${boss ? 'bossQuestion' : 'quizQuestion'}').textContent`)
  const original = bank.flat().find(item => item.q === question)
  assert.ok(original, question)
  const correct = original.a[original.correct]
  assert.ok(await inGame(`(() => {const button=[...d.querySelectorAll('#${boss ? 'bossAnswers' : 'answers'} .answer')].find(el=>el.textContent.slice(1).trim()===${JSON.stringify(correct)});button?.click();return !!button})()`))
}
try {
  let port
  await until(async () => {try {port=(await readFile(join(profile, 'DevToolsActivePort'),'utf8')).split('\n')[0];return !!port} catch {return false}}, 'Chrome startup')
  const pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
  ws = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }) })
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data)
    if (message.id) {const result=pending.get(message.id);pending.delete(message.id);message.error?result.reject(new Error(JSON.stringify(message.error))):result.resolve(message.result)}
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails)
    if (message.method === 'Network.requestWillBeSent') requests.push(message.params.request.url)
  })
  await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: process.env.QA_URL || 'http://127.0.0.1:4173' })
  await until(() => evaluate("!!document.querySelector('.thread-handle')"), 'presentation ready')
  await evaluate("document.querySelector('.menu-trigger').click()")
  await until(() => evaluate("!!document.querySelector('.chapter-menu button:nth-child(9)')"), 'chapter menu')
  await evaluate("document.querySelector('.chapter-menu button:nth-child(9)').click()")
  await until(() => evaluate("!!document.querySelector('.final-game-trigger')"), 'final scene')
  await wait(2000); await capture('finale-desktop')
  const scroll = await evaluate('scrollY')
  assert.equal(await evaluate("document.querySelectorAll('.world-canvas canvas').length"), 1)
  const open = async () => {
    await evaluate("document.querySelector('.final-game-trigger').focus();document.querySelector('.final-game-trigger').click()")
    await until(() => evaluate("!!document.querySelector('.mini-game-dialog[open]') && document.querySelector('.mini-game-frame')?.contentDocument?.getElementById('startButton')?.disabled === false"), 'game dialog')
    await wait(400)
  }
  await open(); await capture('game-desktop')
  if(!process.argv.includes('--layout-only')){
  assert.equal(await inGame("d.getElementById('hearts').getAttribute('aria-label')"), 'Còn 3 trái tim')
  assert.equal(await inGame("d.activeElement.id"), 'startButton')
  assert.equal(await evaluate('scrollY'), scroll)
  await inGame("d.getElementById('startButton').click()")
  await until(() => inGame("!d.getElementById('quizOverlay').classList.contains('hidden')"), 'collision question')
  await wait(150)
  const before = await inGame("({score:Number(d.getElementById('score').textContent),image:d.getElementById('gameCanvas').toDataURL(),question:d.getElementById('quizQuestion').textContent})")
  await wait(1100)
  const after = await inGame("({score:Number(d.getElementById('score').textContent),image:d.getElementById('gameCanvas').toDataURL(),question:d.getElementById('quizQuestion').textContent})")
  assert.equal(after.score, before.score, 'Distance freezes during collision question')
  assert.equal(after.image, before.image, 'Canvas freezes during collision question')
  assert.equal(after.question, before.question)
  assert.ok(await inGame("d.getElementById('quizOverlay').parentElement.id === 'canvasWrap'"), 'Question pops up inside game arena')
  await capture('question-desktop')
  await key('p', 'KeyP', 80)
  await key(' ', 'Space', 32)
  await key('ArrowDown', 'ArrowDown', 40)
  assert.equal(await inGame("d.getElementById('gameCanvas').toDataURL()"), before.image, 'Movement keys and pause do not resume collision question')
  await answerCorrect(false)
  await wait(250); await capture('question-feedback-desktop')
  assert.equal(await inGame("d.getElementById('gameCanvas').toDataURL()"), before.image, 'Answer feedback keeps scene frozen')
  await inGame("d.getElementById('continueButton').click()")
  await wait(500)
  assert.ok(await inGame("Number(d.getElementById('score').textContent)") > before.score, 'Continue resumes distance')
  await inGame("d.getElementById('pauseButton').click()")
  await wait(100)
  const paused = await inGame("d.getElementById('gameCanvas').toDataURL()")
  await wait(400)
  assert.equal(await inGame("d.getElementById('gameCanvas').toDataURL()"), paused, 'Manual pause freezes game')
  await inGame("d.getElementById('resumeButton').click()")
  const end = Date.now() + 35000
  while (Date.now() < end) {
    if (await inGame("!d.getElementById('bossPanel').classList.contains('hidden')")) break
    if (await inGame("!d.getElementById('quizOverlay').classList.contains('hidden') && d.querySelector('#answers .answer:not(:disabled)') !== null")) {await answerCorrect(false);await inGame("d.getElementById('continueButton').click()")}
    await wait(150)
  }
  assert.ok(await inGame("!d.getElementById('bossPanel').classList.contains('hidden')"), 'First boss reached')
  assert.equal(await inGame("d.getElementById('stageNumber').textContent"), '01 / 05')
  await inGame("d.getElementById('fightButton').click()")
  const bossImage = await inGame("d.getElementById('gameCanvas').toDataURL()")
  await wait(400)
  assert.notEqual(await inGame("d.getElementById('gameCanvas').toDataURL()"), bossImage, 'Boss moves while asking')
  for (let turn=0;turn<3;turn++) {
    await answerCorrect(true)
    await wait(580)
    if(turn===0)await capture('boss-impact-desktop')
    await inGame("d.getElementById('bossContinueButton').click()")
    await wait(100)
  }
  assert.ok(await inGame("!d.getElementById('bossVictory').classList.contains('hidden')"), 'Boss defeated by correct answers')
  assert.equal(await inGame("d.getElementById('stageNumber').textContent"), '01 / 05', 'No stage advance before confirmation')
  await inGame("d.getElementById('nextStageButton').click()")
  assert.equal(await inGame("d.getElementById('stageNumber').textContent"), '02 / 05')
  const transitionScore=await inGame("d.getElementById('score').textContent")
  await wait(250);await capture('portal-desktop')
  assert.equal(await inGame("d.getElementById('score').textContent"),transitionScore,'Portal does not advance distance')
  await inGame("d.getElementById('pauseButton').click()")
  await wait(100)
  const gatePaused=await inGame("d.getElementById('gameCanvas').toDataURL()")
  await wait(250)
  assert.equal(await inGame("d.getElementById('gameCanvas').toDataURL()"),gatePaused,'Portal freezes on manual pause')
  await inGame("d.getElementById('resumeButton').click()")
  await until(()=>inGame("d.querySelector('.game-panel').dataset.mode==='running'"),'Portal finishes')
  await inGame("d.getElementById('pauseButton').focus()")
  await key('Escape','Escape',27)
  await until(() => evaluate("!document.querySelector('.mini-game-dialog')"), 'Escape returns to finale')
  assert.equal(await evaluate('scrollY'), scroll)
  assert.equal(await evaluate('document.activeElement.className'), 'final-game-trigger')
  await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false })
  await wait(700); await open(); await capture('game-wide')
  await evaluate("document.querySelector('.mini-game-toolbar button').click()")
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
  await wait(700); await capture('finale-mobile'); await open(); await capture('game-mobile')
  assert.ok(await inGame('d.documentElement.scrollWidth <= w.innerWidth'), 'Game has no mobile horizontal overflow')
  assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Host has no horizontal overflow')
  assert.equal(await inGame("d.getElementById('gameCanvas').width"), await inGame("Math.round(d.getElementById('canvasWrap').getBoundingClientRect().width)"), 'Mobile canvas DPR capped at 1')
  await inGame("d.getElementById('startButton').click()")
  await until(() => inGame("!d.getElementById('quizOverlay').classList.contains('hidden')"), 'mobile question')
  await wait(700); await capture('question-mobile')
  }
  // Test-only instrumentation of the existing srcDoc; production ships no debug state.
  await evaluate(`(() => {const f=document.querySelector('.mini-game-frame');f.srcdoc=f.srcdoc.replace('reset();resize();requestAnimationFrame(frame);','window.__qa={state,effects,FX_LIMIT,questions,STAGE_ENDS,STAGE_LENGTHS,spawnObstacle,playerBox,obstacleBox,overlaps,collision,startBoss,askBossQuestion,renderQuestion,answerQuestion,continueAfterQuiz,continueBoss,advanceStage,updateEffects,updateHud,reset,draw,update,jump,duck,end,pause,burst,visualStage};reset();resize();requestAnimationFrame(frame);');})()`)
  await until(() => inGame("!!w.__qa && !d.getElementById('startButton').disabled"), 'test harness and sprites')
  const layoutReports=[]
  for(const [width,height] of [[1440,900],[1280,720],[390,844],[375,667],[320,568],[844,390],[640,360]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<801})
    await wait(150)
    if(width===1440||width===390){await inGame('w.__qa.reset()');await wait(100);await capture('arena-'+width+'x'+height)}
    const result=await inGame(`(() => {
      const qa=w.__qa,s=qa.state,failures=[];
      const check=(context,q)=>{
        const panel=d.getElementById(context==='boss'?'bossPanel':'quizOverlay');
        const body=d.getElementById(context==='boss'?'bossQuestionArea':'quizOverlay');
        if(context==='collision'){
          const p=panel.getBoundingClientRect(),a=d.getElementById('canvasWrap').getBoundingClientRect();
          if(panel.parentElement.id!=='canvasWrap'||p.left<a.left-1||p.right>a.right+1||p.top<a.top-1||p.bottom>a.bottom+1)failures.push({context,reason:'popup outside arena'});
        }
        if(panel.scrollHeight>panel.clientHeight+2)failures.push({q:q.q,context,reason:'panel overflow',height:panel.clientHeight,scroll:panel.scrollHeight});
        for(const node of body.querySelectorAll('h2,.answer,.quiz-feedback,.primary-button:not(.hidden)')){
          const r=node.getBoundingClientRect(),p=panel.getBoundingClientRect();
          if(r.bottom>p.bottom+1||r.top<p.top-1||r.right>w.innerWidth+1||r.bottom>w.innerHeight+1||node.scrollHeight>node.clientHeight+2)failures.push({q:q.q,context,reason:'content clipped',tag:node.className,rect:r.toJSON(),panel:p.toJSON(),client:node.clientHeight,scroll:node.scrollHeight});
        }
      };
      qa.reset();
      if(d.querySelector('.field-guide'))failures.push({phase:'ready',reason:'intro rail still exists'});
      const arena=d.getElementById('canvasWrap').getBoundingClientRect(),game=d.querySelector('.game-panel').getBoundingClientRect();
      if(Math.abs(arena.width-(game.width-2))>2)failures.push({phase:'ready',reason:'arena does not fill screen width'});
      const basic=(phase)=>{
        for(const selector of ['.game-toolbar','.stage-progress-row','.canvas-wrap','.game-footer','.field-guide','.overlay:not(.hidden) .overlay-card']){
          const node=d.querySelector(selector);if(!node||w.getComputedStyle(node).display==='none'||node.closest('.hidden'))continue;
          const r=node.getBoundingClientRect();
          if(r.right>w.innerWidth+1||r.bottom>w.innerHeight+1||r.top<0||node.scrollHeight>node.clientHeight+2)failures.push({phase,reason:'screen component clipped',selector});
        }
      };
      basic('ready');
      d.getElementById('startOverlay').classList.add('hidden');
      for(let stage=0;stage<5;stage++)for(const q of qa.questions[stage]){
        s.stage=stage;s.mode='quiz';s.questionDecks[stage]=[q];qa.renderQuestion('collision');
        d.getElementById('quizOverlay').classList.remove('hidden');d.getElementById('bossPanel').classList.add('hidden');
        d.getElementById('quizFeedback').textContent='Chưa đúng. Mất 1 trái tim. '+q.explain;
        d.getElementById('continueButton').classList.remove('hidden');qa.updateHud();check('collision',q);
        d.getElementById('quizOverlay').classList.add('hidden');qa.startBoss();s.questionDecks[stage]=[q];qa.askBossQuestion();
        d.getElementById('bossFeedback').textContent='Boss phản công! Bạn mất 1 trái tim. '+q.explain;
        d.getElementById('bossContinueButton').classList.remove('hidden');check('boss',q);
      }
      return {width:w.innerWidth,height:w.innerHeight,scrollHeight:d.documentElement.scrollHeight,clientHeight:d.documentElement.clientHeight,scrollY:w.scrollY,failures};
    })()`)
    layoutReports.push({viewport:[width,height],...result})
    if(result.failures.length)console.log('Layout failures',width,height,JSON.stringify(result.failures.slice(0,3)))
    if(width===390)await capture('boss-mobile')
    if(width===1280)await capture('docx-question-desktop')
    if(width<=375||height<500)await capture('fit-'+width+'x'+height)
  }
  await writeFile(`${out}/layout-report.json`,JSON.stringify(layoutReports,null,2))
  assert.ok(layoutReports.every(item=>item.failures.length===0&&item.scrollY===0&&item.scrollHeight===item.clientHeight),'Every question and answer fits without scrolling at all reviewed sizes')
  const campaign=await inGame(`(() => {
    const qa=w.__qa,s=qa.state,report=[];qa.reset();d.getElementById('startOverlay').classList.add('hidden');
    for(let stage=0;stage<5;stage++){
      s.stage=stage;s.score=qa.STAGE_ENDS[stage];s.world=s.score*60;s.hearts=3;qa.startBoss();qa.askBossQuestion();
      qa.answerQuestion((s.activeQuestion.correct+1)%4);
      const wrong={hearts:s.hearts,hp:s.boss.hp,effect:s.effect.kind};qa.continueBoss();
      for(let i=0;i<3;i++){qa.answerQuestion(s.activeQuestion.correct);qa.continueBoss()}
      const win={mode:s.mode,hp:s.boss.hp,hearts:s.hearts,stage:s.stage,cleared:s.cleared[stage]};qa.advanceStage();
      const transitionMode=s.mode;
      if(s.mode==='transition'){s.clock+=1400;qa.updateEffects(0)}
      report.push({stage,wrong,win,next:s.stage,mode:s.mode,nextHearts:s.hearts,transitionMode});
    }
    return {report,ended:s.mode,endStamp:d.getElementById('endStamp').textContent};
  })()`)
  for(const item of campaign.report){assert.deepEqual(item.wrong,{hearts:2,hp:3,effect:'hit'});assert.equal(item.win.hp,0);assert.equal(item.win.mode,'boss-victory');assert.equal(item.win.hearts,2);assert.equal(item.nextHearts,2);assert.ok(item.win.cleared)}
  assert.equal(campaign.ended,'ended');assert.equal(campaign.endStamp,'ĐÃ ĐÁNH BẠI CẢ 5 BOSS')
  await writeFile(`${out}/campaign-report.json`,JSON.stringify(campaign,null,2))
  // Cosmetic checks use controlled scenarios, without changing production code.
  const fxReports=[]
  for(const [width,height] of [[1440,900],[390,844]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<801});await wait(150)
    const jump=await inGame(`(() => {const q=w.__qa,s=q.state;q.reset();d.getElementById('startOverlay').classList.add('hidden');s.mode='running';s.runTime=44;s.speed=760;s.immunity=100;q.updateHud();q.jump();return {particles:q.effects.particles.length,airborne:s.player.y<0}})()`)
    assert.ok(jump.airborne&&jump.particles>0,'Jump emits dust')
    await wait(220);await capture('fx-jump-'+width)
    await until(()=>inGame('w.__qa.state.player.y===0'),'Landing')
    assert.ok(await inGame('w.__qa.effects.landingAt>0 && w.__qa.effects.particles.length>0'),'Landing emits dust')
    await capture('fx-landing-'+width)
    const freeze=await inGame(`(() => {const q=w.__qa;q.collision();return {score:q.state.score,clock:q.state.clock,particles:JSON.stringify(q.effects.particles)}})()`)
    await wait(500)
    assert.deepEqual(await inGame('({score:w.__qa.state.score,clock:w.__qa.state.clock,particles:JSON.stringify(w.__qa.effects.particles)})'),freeze,'Collision freezes physics and particles')
    await inGame('w.__qa.answerQuestion((w.__qa.state.activeQuestion.correct+1)%4)');await wait(100);await capture('fx-heart-'+width)
    assert.ok(await inGame("d.getElementById('heartLoss').classList.contains('fx-break') && d.querySelector('#answers .fx-wrong')!==null"),'Wrong answer animates lost heart and selected answer')
    await inGame('(() => {w.__qa.continueAfterQuiz();w.__qa.startBoss();w.__qa.askBossQuestion();w.__qa.answerQuestion(w.__qa.state.activeQuestion.correct)})()')
    await wait(520);await capture('fx-boss-impact-'+width)
    assert.ok(await inGame('w.__qa.state.effect.impacted && w.__qa.effects.particles.some(p=>p.kind===\'spark\')'),'Boss impact emits sparks')
    await inGame('(() => {w.__qa.state.boss.hp=0;w.__qa.state.cleared[w.__qa.state.stage]=true;w.__qa.state.mode=\'boss-victory\';w.__qa.advanceStage()})()')
    await wait(350);await capture('fx-portal-'+width)
    const gate=await inGame('({mode:w.__qa.state.mode,score:w.__qa.state.score,obstacles:w.__qa.state.obstacles.length})')
    assert.equal(gate.mode,'transition');assert.equal(gate.obstacles,0)
    await until(()=>inGame("w.__qa.state.mode==='running'"),'Gate resumes running')
    assert.ok(await inGame('w.__qa.effects.particles.length<=w.__qa.FX_LIMIT'),'Particle pool stays bounded')
    await inGame('w.__qa.end(true)');assert.ok(await inGame("d.getElementById('celebration').children.length>0"),'Win emits confetti')
    await wait(650);await capture('fx-win-'+width)
    assert.ok(await inGame('d.documentElement.scrollHeight===w.innerHeight && d.documentElement.scrollWidth<=w.innerWidth'),'Effects do not add scrolling')
    await wait(3300);assert.equal(await inGame("d.getElementById('celebration').children.length"),0,'Confetti cleans up after animation')
    fxReports.push({viewport:[width,height],jump,gate,freeze:'passed',impact:'passed',confettiCleanup:'passed'})
  }
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
  const reduced=await inGame(`(() => {const q=w.__qa,s=q.state;q.reset();d.getElementById('startOverlay').classList.add('hidden');s.mode='running';q.jump();const particles=q.effects.particles.length;q.end(true);const confetti=d.getElementById('celebration').children.length;q.reset();s.mode='boss-victory';s.cleared[0]=true;q.advanceStage();return {particles,confetti,mode:s.mode,stage:s.stage}})()`)
  assert.deepEqual(reduced,{particles:0,confetti:0,mode:'running',stage:1},'Reduced motion skips optional particles and gate animation')
  await send('Emulation.setEmulatedMedia',{features:[]})
  await writeFile(`${out}/effects-report.json`,JSON.stringify({viewports:fxReports,reducedMotion:reduced},null,2))
  await evaluate("document.querySelector('.mini-game-toolbar button').click()")
  assert.equal(await evaluate('document.activeElement.className'), 'final-game-trigger')
  assert.ok(!requests.some(url => /fonts\.google|gstatic/.test(url)), 'No Google Fonts requests')
  assert.deepEqual(errors, [])
  await writeFile(`${out}/report.json`,JSON.stringify({ mode:process.argv.includes('--layout-only')?'layout/campaign/effects checks':'full integration checks',checks:['Production build opens from scene 08','77 questions / chapter counts 18, 15, 16, 15, 13; 17 from bo cau hoi.docx','49 local PNG sprites load','Seven viewports: all 77 collision popups/boss questions and feedback fit without scrolling','Wrong answers counterattack in all five bosses; three correct answers defeat each boss','Hearts persist on stage advance','Desktop/mobile: takeoff and landing dust, frozen particles during collision, heart/answer feedback, boss impact sparks, portal arrival, bounded particles, win confetti cleanup','Reduced motion skips optional particles, confetti and portal animation','Native gameplay checks included in full mode: collision freezes canvas and score, popup inside arena, continue resumes, pause, first boss animation, paused portal, Escape, focus, mobile DPR','No Google Fonts or uncaught exceptions'], errors },null,2))
  console.log('Mini game integration QA passed.')
} finally {
  if(ws?.readyState === 1) {try {await send('Browser.close')} catch {} ws.close()}
  chrome.kill(); await wait(300)
  await rm(profile,{recursive:true,force:true,maxRetries:4,retryDelay:300})
}
