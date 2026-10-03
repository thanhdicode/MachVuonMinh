import assert from 'node:assert/strict'
import {writeFile} from 'node:fs/promises'
import {enterMural} from './browser-history-mural-qa.mjs'
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))
const methods=['WebAudio.contextCreated','WebAudio.contextChanged','WebAudio.audioNodeCreated']
const read=tab=>tab.playwright.evaluate(()=>{
  const button=document.querySelector('.history-sound')
  return {enabled:button.getAttribute('aria-pressed'),context:button.dataset.audioContext,rms:+button.dataset.audioRms,peak:+button.dataset.audioPeak,era:button.dataset.audioEra}
})
const clickSound=async tab=>{
  const point=await tab.playwright.evaluate(()=>{const r=document.querySelector('.history-sound').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})
  await tab.cua.click(point)
}
export async function verifyMuralAudio({tab,viewport,cdp,out}){
  await viewport.set({width:1366,height:768});await tab.reload()
  await cdp.send('WebAudio.enable',{})
  const baseline=await cdp.readEvents({methods,timeoutMs:0})
  await enterMural(tab)
  const initial=await read(tab),before=await cdp.readEvents({afterSequence:baseline.cursor,methods,timeoutMs:0})
  assert.equal(initial.enabled,'false');assert.equal(initial.context,'uninitialized');assert.equal(initial.rms,0)
  assert.equal(before.events.filter(e=>e.method==='WebAudio.contextCreated').length,0)
  const rootTop=await tab.playwright.evaluate(()=>document.querySelector('.history-bridge').getBoundingClientRect().top)
  if(rootTop>1){await tab.cua.scroll({x:1100,y:500,scrollY:rootTop+4,scrollX:0});await pause(400)}
  await clickSound(tab)
  const activation=[]
  for(let i=0;i<8;i++){activation.push(await read(tab));await pause(50)}
  await pause(1000)
  const running=await read(tab),started=await cdp.readEvents({afterSequence:before.cursor,methods,timeoutMs:0})
  const context=started.events.find(e=>e.method==='WebAudio.contextCreated')?.params.context
  assert.ok(context);assert.equal(running.context,'running');assert.equal(running.enabled,'true');assert.ok(running.rms>.0005)
  assert.ok(started.events.some(e=>e.params?.node?.nodeType==='Oscillator'),'Activation cue is scheduled in the gesture path')
  assert.ok(started.events.some(e=>e.params?.node?.nodeType==='Analyser'),'Meter sits on the shared output bus')
  assert.ok(started.events.filter(e=>e.params?.node?.nodeType==='Gain').length>=3)
  const eras=[]
  for(let era=1;era<=5;era++){
    await tab.playwright.getByRole('button',{name:'Thời kỳ tiếp theo',exact:true}).press('Enter');await pause(1600)
    const state=await read(tab);assert.equal(state.era,String(era));assert.equal(state.context,'running');assert.ok(state.rms>.0005)
    eras.push(state)
  }
  await clickSound(tab);await pause(1400)
  const muted=await read(tab);assert.equal(muted.enabled,'false');assert.equal(muted.rms,0);assert.equal(muted.peak,0)
  const beforeResume=await cdp.readEvents({afterSequence:started.cursor,methods,timeoutMs:0})
  await clickSound(tab);await pause(1500)
  const resumed=await read(tab),afterResume=await cdp.readEvents({afterSequence:beforeResume.cursor,methods,timeoutMs:0})
  assert.equal(resumed.enabled,'true');assert.equal(resumed.context,'running');assert.ok(resumed.rms>.0005);assert.equal(resumed.era,'5')
  assert.equal(afterResume.events.filter(e=>e.method==='WebAudio.contextCreated').length,0,'Re-enable reuses the persistent AudioContext')
  assert.ok(afterResume.events.some(e=>e.params?.node?.nodeType==='AudioBufferSource'))
  assert.equal(await tab.playwright.locator('.history-audio-error').count(),0)
  await clickSound(tab);await pause(1100)
  const result={initial,activation,running,eras,muted,resumed,contextId:context.contextId,physicalListening:'Pending human confirmation of cue and era timbre; analyser measures browser output only.'}
  await writeFile(`${out}/audio-browser.json`,JSON.stringify(result,null,2))
  return {gestureGate:true,cueScheduled:true,nonzeroOutput:true,era02:true,era06:true,muteZero:true,persistentResume:true,physicalListening:'pending'}
}
