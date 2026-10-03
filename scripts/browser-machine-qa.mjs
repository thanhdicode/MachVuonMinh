import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'

const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))
export async function enterMachine(tab){
  if(await tab.playwright.getByRole('button',{name:'Kéo sợi đỏ qua vòng. Hoặc nhấn Enter để tiếp tục.',exact:true}).count()) await tab.playwright.getByRole('button',{name:'Kéo sợi đỏ qua vòng. Hoặc nhấn Enter để tiếp tục.',exact:true}).press('Enter')
  await tab.playwright.getByRole('button',{name:'Mở mục lục',exact:true}).click()
  await tab.playwright.getByRole('button',{name:'02 Cơ giới hóa ↗',exact:true}).click()
  await pause(1400)
}
export async function machineFrame(tab,p){
  const delta=await tab.playwright.evaluate(p=>{const root=document.querySelector('.machine-insertion');return root.offsetTop+(root.offsetHeight-innerHeight)*p-window.scrollY},p)
  await tab.cua.scroll({x:600,y:420,scrollY:delta,scrollX:0});await pause(1600)
  return tab.playwright.evaluate(()=>{
    const stage=document.querySelector('.machine-stage'),caption=stage.querySelector('.machine-caption[aria-hidden="false"]'),h=caption?.querySelector('h2'),body=caption?.querySelector('p'),box=el=>el?.getBoundingClientRect().toJSON(),svg=stage.querySelector('svg'),frame=svg.getBoundingClientRect(),scale=Math.min(frame.width/1600,frame.height/900),left=frame.left+(frame.width-1600*scale)/2,top=frame.top+(frame.height-900*scale)/2
    const textBox=box(h)||box(body),zoom=+stage.dataset.progress<.34?1.5:1.5-.5*Math.min(1,(+stage.dataset.progress-.34)/.28),machineLeft=left+((560-720)*zoom+720+(zoom-1)*510)*scale,workerTop=top+410*scale
    return {p:+stage.dataset.progress,beat:+stage.dataset.beat,scene:document.querySelector('main').className,pinned:!!stage.closest('.pin-spacer'),caption:caption?.textContent,heading:box(h),body:box(body),headingLines:h?h.getBoundingClientRect().height/+getComputedStyle(h).lineHeight.replace('px',''):0,workers:+getComputedStyle(stage.querySelector('.machine-workers')).opacity,system:+getComputedStyle(stage.querySelector('.machine-system-bracket')).opacity,captionOverlapsWorld:textBox?textBox.right>machineLeft+1&&textBox.bottom>workerTop:false,canvasCount:document.querySelectorAll('canvas').length,pageWidth:document.documentElement.clientWidth,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,background:getComputedStyle(stage.querySelector('.machine-backdrop')).backgroundColor}
  })
}
export async function captureMachine({tab,viewport,out,size}){
  await mkdir(out,{recursive:true});await viewport.set(size);await pause(600);await enterMachine(tab)
  const frames=[]
  for(const p of [.06,.22,.54,.77,.94,.99]){
    const frame=await machineFrame(tab,p)
    assert.ok(Math.abs(frame.p-p)<.007,`Scrub did not settle: ${JSON.stringify(frame)}`)
    assert.equal(frame.canvasCount,1);assert.equal(frame.pinned,true);assert.equal(frame.overflow,0)
    assert.equal(frame.captionOverlapsWorld,false,`Caption intersects machine/worker zone: ${JSON.stringify(frame)}`)
    if(p<.82)assert.equal(frame.system,0,'Thesis bracket must be earned')
    if(p===.22)assert.ok(frame.headingLines<=2.05,'First headline exceeds two lines')
    if(p===.77)assert.ok(frame.workers>.98,'Workers must be visible during coordination')
    await writeFile(`${out}/${size.width}-${size.height}-${Math.round(p*100)}.jpg`,await tab.screenshot({fullPage:false}));frames.push(frame)
  }
  await writeFile(`${out}/${size.width}-${size.height}.json`,JSON.stringify({size,frames},null,2));return {size,frames:frames.length}
}
export async function captureMachineStatic({tab,viewport,cdp,out,reduced=false}){
  await mkdir(out,{recursive:true})
  await viewport.set(reduced?{width:1440,height:900}:{width:390,height:844})
  if(reduced)await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
  await pause(600);await enterMachine(tab)
  const frames=[]
  for(let i=0;i<4;i++){
    const delta=await tab.playwright.evaluate(i=>document.querySelector(`[data-static-beat="${i}"]`).getBoundingClientRect().top-125,i)
    await tab.cua.scroll({x:250,y:420,scrollY:delta,scrollX:0});await pause(1000)
    const frame=await tab.playwright.evaluate(i=>({beat:i,heading:document.querySelector(`[data-static-beat="${i}"] h2`).textContent,pinned:!!document.querySelector('.machine-stage').closest('.pin-spacer'),staticDisplay:getComputedStyle(document.querySelector('.machine-static-story')).display,canvas:getComputedStyle(document.querySelector('.world-canvas')).visibility,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth}),i)
    assert.equal(frame.pinned,false);assert.equal(frame.staticDisplay,'block');assert.equal(frame.overflow,0)
    await writeFile(`${out}/${reduced?'reduced':'390-844'}-beat-${i}.jpg`,await tab.screenshot({fullPage:false}));frames.push(frame)
  }
  await writeFile(`${out}/${reduced?'reduced':'390-844'}.json`,JSON.stringify(frames,null,2))
  if(reduced)await cdp.send('Emulation.setEmulatedMedia',{features:[]})
  return {reduced,frames:frames.length}
}
