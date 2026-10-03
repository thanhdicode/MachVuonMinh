import assert from 'node:assert/strict'
import {writeFile} from 'node:fs/promises'
import {enterAtlas} from './browser-atlas-panorama-qa.mjs'
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))
const methods=['WebAudio.contextCreated','WebAudio.contextChanged','WebAudio.audioNodeCreated','WebAudio.audioNodeWillBeDestroyed']
export async function verifyAtlasAudio({tab,viewport,cdp,out}){
  await viewport.set({width:1366,height:768});await pause(400);await tab.reload()
  await cdp.send('WebAudio.enable',{})
  const baseline=await cdp.readEvents({methods,timeoutMs:0})
  await enterAtlas(tab)
  const initial=await cdp.readEvents({afterSequence:baseline.cursor,methods,timeoutMs:0})
  assert.equal(initial.events.filter(e=>e.method==='WebAudio.contextCreated').length,0,'No audio context before a sound gesture')
  // Semantic key activation can focus a partially visible control during smooth entry.
  const entry=await tab.playwright.evaluate(()=>document.querySelector('.history-bridge').getBoundingClientRect().top)
  if(entry>1){await tab.cua.scroll({x:1000,y:500,scrollY:entry+4,scrollX:0});await pause(500)}
  assert.ok(await tab.playwright.evaluate(()=>document.querySelector('main').classList.contains('history-active')))
  const soundPoint=await tab.playwright.evaluate(()=>{const r=document.querySelector('.history-sound').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}});await tab.cua.click(soundPoint);await pause(1400)
  const started=await cdp.readEvents({afterSequence:initial.cursor,methods,timeoutMs:0})
  const context=started.events.find(e=>e.method==='WebAudio.contextCreated')?.params.context
  assert.ok(context);assert.ok(started.events.some(e=>e.params?.context?.contextState==='running'))
  assert.ok(started.events.some(e=>e.params?.node?.nodeType==='AudioBufferSource'))
  assert.ok(started.events.filter(e=>e.params?.node?.nodeType==='Gain').length>=2)
  const realtime=await cdp.send('WebAudio.getRealtimeData',{contextId:context.contextId});assert.ok(realtime.realtimeData.currentTime>0)
  await tab.playwright.getByRole('button',{name:'Thời kỳ tiếp theo',exact:true}).press('Enter');await pause(1900)
  const changed=await cdp.readEvents({afterSequence:started.cursor,methods,timeoutMs:0})
  assert.equal(await tab.playwright.evaluate(()=>document.querySelector('.history-bridge').dataset.era),'1')
  assert.ok(changed.events.some(e=>e.params?.node?.nodeType==='AudioBufferSource'),'New era starts its own looping buffer')
  await tab.cua.click(soundPoint);await pause(1100)
  assert.equal(await tab.playwright.locator('.history-sound').getAttribute('aria-pressed'),'false')
  assert.equal(await tab.playwright.locator('.history-audio-error').count(),0)
  await writeFile(`${out}/audio-browser.json`,JSON.stringify({initial,started,realtime,changed,muted:true,automationVerification:'tests/history-audio.test.mjs'},null,2))
  return {gestureGate:true,realBufferPlayback:true,twoGainChannels:true,eraChange:true,mute:true}
}
