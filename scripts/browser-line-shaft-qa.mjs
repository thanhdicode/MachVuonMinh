import assert from 'node:assert/strict'
import {mkdir,writeFile} from 'node:fs/promises'
import {enterMachine} from './browser-machine-qa.mjs'
const pause=ms=>new Promise(r=>setTimeout(r,ms))
export async function hallFrame(tab,p){
  const delta=await tab.playwright.evaluate(p=>{const r=document.querySelector('.machine-insertion');return r.offsetTop+(r.offsetHeight-innerHeight)*p-window.scrollY},p)
  await tab.cua.scroll({x:500,y:420,scrollY:delta,scrollX:0});await pause(1400)
  return tab.playwright.evaluate(()=>{
    const s=document.querySelector('.machine-stage'),c=s.querySelector('.hall-caption[aria-hidden="false"]'),visible=e=>getComputedStyle(e).visibility!=='hidden'&&+getComputedStyle(e).opacity>.05
    const text=[s.querySelector('.machine-code'),c,s.querySelector('.hall-technical-labels'),s.querySelector('.hall-cadence')].filter(visible).map(e=>e.textContent).join(' ')
    return {p:+s.dataset.progress,beat:+s.dataset.beat,caption:c.textContent,words:text.trim().split(/\s+/).length,font:c.querySelector('h2')?+getComputedStyle(c.querySelector('h2')).fontSize.replace('px',''):0,captionBox:c.getBoundingClientRect().toJSON(),pin:!!s.closest('.pin-spacer'),pinVh:(+s.dataset.end-+s.dataset.start)/innerHeight*100,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,canvasCount:document.querySelectorAll('canvas').length,oldHumans:document.querySelectorAll('.machine-person').length,stageZ:getComputedStyle(s).zIndex,underlay:getComputedStyle(s.querySelector('.hall-room-underlay')).display}
  })
}
export async function captureHall({tab,viewport,out,size}){
  await mkdir(out,{recursive:true});await viewport.set(size);await pause(700);await enterMachine(tab)
  const frames=[]
  for(const p of [.02,.2,.35,.61,.73,.82,.92,.98]){
    const f=await hallFrame(tab,p)
    assert.ok(Math.abs(f.p-p)<.007);assert.equal(f.pin,true);assert.ok(Math.abs(f.pinVh-280)<1)
    assert.equal(f.overflow,0);assert.equal(f.canvasCount,1);assert.equal(f.oldHumans,0);assert.ok(f.font<=28.1)
    if(p<.78)assert.ok(f.words<=25,JSON.stringify(f))
    assert.equal(f.underlay,'none','Fallback plate must not cover live mechanism')
    await writeFile(`${out}/${size.width}-${size.height}-${Math.round(p*100)}.jpg`,await tab.screenshot({fullPage:false}));frames.push(f)
  }
  await writeFile(`${out}/${size.width}-${size.height}.json`,JSON.stringify({size,frames},null,2));return {size,frames:frames.length,maxEarlyWords:Math.max(...frames.filter(f=>f.p<.78).map(f=>f.words))}
}
export async function captureHallStatic({tab,viewport,cdp,out,reduced=false}){
  await mkdir(out,{recursive:true});await viewport.set(reduced?{width:1440,height:900}:{width:390,height:844})
  if(reduced)await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
  await pause(700);await enterMachine(tab);const frames=[]
  for(let i=0;i<4;i++){
    const d=await tab.playwright.evaluate(i=>document.querySelector(`[data-static-beat="${i}"]`).getBoundingClientRect().top-125,i)
    await tab.cua.scroll({x:250,y:420,scrollY:d,scrollX:0});await pause(1000)
    const f=await tab.playwright.evaluate(i=>({beat:i,pin:!!document.querySelector('.machine-stage').closest('.pin-spacer'),display:getComputedStyle(document.querySelector('.machine-static-story')).display,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,heading:document.querySelector(`[data-static-beat="${i}"] h2`).textContent}),i)
    assert.equal(f.pin,false);assert.equal(f.display,'block');assert.equal(f.overflow,0)
    await writeFile(`${out}/${reduced?'reduced':'390-844'}-${i}.jpg`,await tab.screenshot({fullPage:false}));frames.push(f)
  }
  await writeFile(`${out}/${reduced?'reduced':'390-844'}.json`,JSON.stringify(frames,null,2))
  if(reduced)await cdp.send('Emulation.setEmulatedMedia',{features:[]})
  return {reduced,frames:4}
}
