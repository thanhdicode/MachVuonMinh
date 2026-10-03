import assert from 'node:assert/strict'
import {writeFile} from 'node:fs/promises'
const pause=ms=>new Promise(r=>setTimeout(r,ms))
export async function enterMural(tab){
  await pause(650)
  await tab.playwright.getByRole('button',{name:'Mở mục lục',exact:true}).press('Enter')
  await tab.playwright.getByRole('button',{name:/01.H.*Bản đồ lịch sử/}).press('Enter');await pause(1500)
}
async function shot(tab,cdp,path){
  const clip=await tab.playwright.evaluate(()=>({x:scrollX,y:scrollY,width:innerWidth,height:innerHeight,scale:1}))
  const data=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,clip})
  await writeFile(path,Buffer.from(data.data,'base64'))
}
export async function verifyMural({tab,viewport,cdp,out,size}){
  await viewport.set(size);await tab.reload();await enterMural(tab)
  const checks=[]
  for(let era=0;era<8;era++){
    if(era){await tab.playwright.getByRole('button',{name:'Thời kỳ tiếp theo',exact:true}).press('Enter');await pause(1400)}
    const g=await tab.playwright.evaluate(i=>{
      const root=document.querySelector('.history-bridge'),stage=root.querySelector(`[data-label-era="${i}"]`)
      const visible=n=>{for(let p=n;p;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||+s.opacity<.05)return false}return n.getBoundingClientRect().height>0}
      const boxes=[...root.querySelectorAll('.history-curator h3,.history-curator .history-body,.history-fact-rail')].map(n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}})
      const art=stage.querySelector('.history-image img'),r=art.getBoundingClientRect(),scale=Math.min(r.width/art.naturalWidth,r.height/art.naturalHeight),w=art.naturalWidth*scale,h=art.naturalHeight*scale
      const actual={left:r.left+(r.width-w)/2,right:r.left+(r.width+w)/2,top:r.bottom-h,bottom:r.bottom}
      const overlap=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>2&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2
      const fitted=[...root.querySelectorAll('.history-image img')].filter(n=>n.naturalWidth).map(n=>{const r=n.getBoundingClientRect(),s=Math.min(r.width/n.naturalWidth,r.height/n.naturalHeight),w=n.naturalWidth*s,h=n.naturalHeight*s;const clip=Number.parseFloat(getComputedStyle(n.closest('figure')).getPropertyValue('--art-clip'))||0;return {left:Math.max(r.left+(r.width-w)/2,r.left+clip),right:r.left+(r.width+w)/2,top:r.bottom-h,bottom:r.bottom}}).filter(b=>b.right>b.left)
      const title=root.querySelector('.history-curator h3'),leader=root.querySelector('.history-leader path').getAttribute('d'),anchor=root.dataset.anchor?.split(',').map(Number)
      return {era:root.dataset.era,layout:root.dataset.layout,bodyCount:[...root.querySelectorAll('.history-body')].filter(visible).length,boxes,collisions:boxes.slice(0,2).filter(b=>fitted.some(a=>overlap(a,b))).length,art:actual,anchor,leader,titleLines:title.getBoundingClientRect().height/Number.parseFloat(getComputedStyle(title).lineHeight),panorama:root.querySelectorAll('.atlas-panorama img').length,loaded:root.querySelector('.atlas-panorama img').naturalWidth,source:root.querySelector('.atlas-panorama img').currentSrc,oldMaps:root.querySelectorAll('.history-backdrop,.history-archives').length,rewind:root.textContent.includes('Quay lại'),railHeight:root.querySelector('.history-rail-line').getBoundingClientRect().height,overflow:document.documentElement.scrollWidth-innerWidth,masterRoot:getComputedStyle(root.querySelector('.atlas-world')).transform,heading:title.textContent}
    },era)
    assert.equal(g.era,String(era));assert.equal(g.layout,'horizontal');assert.equal(g.bodyCount,1);assert.equal(g.panorama,1);assert.ok(g.loaded>=4096);assert.equal(g.oldMaps,0);assert.equal(g.rewind,false);assert.equal(g.railHeight,2);assert.ok(g.overflow<=0)
    assert.equal(g.collisions,0,`${size.width} era ${era}: caption/art collision`);assert.ok(g.titleLines<=2.05)
    for(const b of g.boxes){assert.ok(b.left>=0&&b.right<=size.width);assert.ok(b.top>=0&&b.bottom<=size.height-24)}
    assert.ok(/^M[-\d.e ]+V[-\d.e ]+H[-\d.e ]+$/.test(g.leader),'Exactly one orthogonal elbow')
    assert.ok(g.anchor[0]>=g.art.left-1&&g.anchor[0]<=g.art.right+1&&g.anchor[1]>=g.art.top&&g.anchor[1]<=g.art.bottom)
    checks.push(g);await shot(tab,cdp,`${out}/${size.width}-${size.height}-era-${era}.png`)
  }
  await writeFile(`${out}/${size.width}-${size.height}.json`,JSON.stringify(checks,null,2));return {size,eras:checks.length,panorama:true,orthogonalLeaders:true,collisions:0}
}
export async function verifyMuralMobile({tab,viewport,cdp,out}){
  await viewport.set({width:390,height:844});await tab.reload();await enterMural(tab)
  const checks=[]
  for(let era=0;era<8;era++){
    const d=await tab.playwright.evaluate(i=>document.querySelector(`[data-label-era="${i}"]`).getBoundingClientRect().top-140,era)
    if(era){await tab.cua.scroll({x:320,y:500,scrollY:d,scrollX:0});await pause(850)}
    const g=await tab.playwright.evaluate(()=>{const root=document.querySelector('.history-bridge');const visible=n=>{for(let p=n;p;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||+s.opacity<.05)return false}return n.getBoundingClientRect().height>0};return {era:root.dataset.era,layout:root.dataset.layout,pinned:!!root.closest('.pin-spacer'),bodies:[...root.querySelectorAll('.history-body')].filter(visible).length,pano:root.querySelector('.atlas-panorama img').currentSrc,loaded:root.querySelector('.atlas-panorama img').naturalHeight,overflow:document.documentElement.scrollWidth-innerWidth,width:root.querySelector('.atlas-world').getBoundingClientRect().width}})
    assert.equal(g.era,String(era));assert.equal(g.layout,'vertical');assert.equal(g.pinned,false);assert.equal(g.bodies,1);assert.ok(g.pano.includes('mobile'));assert.equal(g.loaded,8192);assert.ok(g.overflow<=0);assert.ok(g.width<390)
    checks.push(g);await shot(tab,cdp,`${out}/390-844-era-${era}.png`)
  }
  await writeFile(`${out}/390-844.json`,JSON.stringify(checks,null,2));return {mobileEras:8,oneVerticalBackground:true}
}
export async function verifyDirectHandoff({tab,viewport,cdp,out}){
  await viewport.set({width:1440,height:900});await tab.reload();await enterMural(tab)
  const d=await tab.playwright.evaluate(()=>document.querySelector('.history-bridge').closest('.pin-spacer').getBoundingClientRect().bottom-innerHeight-1)
  await tab.cua.scroll({x:1200,y:700,scrollY:d,scrollX:0});await pause(2000)
  const g=await tab.playwright.evaluate(()=>{const root=document.querySelector('.history-bridge'),image=root.querySelector('.atlas-machine-hall'),s=getComputedStyle(image);return {handoff:root.dataset.handoff,progress:getComputedStyle(root).getPropertyValue('--atlas-handoff'),loaded:image.naturalWidth,opacity:+s.opacity,bridge:root.querySelector('.history-direct-transition button').textContent,rewind:!!root.querySelector('.history-ending')}})
  assert.equal(g.handoff,'true');assert.ok(+g.progress>.98);assert.ok(g.loaded>0);assert.ok(g.opacity>.98);assert.equal(g.rewind,false)
  await shot(tab,cdp,`${out}/1440-900-handoff.png`);await tab.cua.scroll({x:1200,y:700,scrollY:1000,scrollX:0});await pause(1500)
  const next=await tab.playwright.evaluate(()=>({nav:document.querySelector('.nav-end').textContent,atlasTop:document.querySelector('.history-bridge').getBoundingClientRect().top,machineTop:document.querySelector('.machine-insertion').getBoundingClientRect().top}))
  assert.ok(next.nav.startsWith('02'));await writeFile(`${out}/handoff.json`,JSON.stringify({g,next},null,2));return {directHandoff:true,next}
}
export async function verifyMuralTools({tab,viewport,cdp,out}){
  await viewport.set({width:1366,height:768});await tab.reload();await enterMural(tab)
  const point=await tab.playwright.evaluate(()=>{const img=document.querySelector('[data-label-era="0"] .history-image img'),r=img.getBoundingClientRect(),s=Math.min(r.width/img.naturalWidth,r.height/img.naturalHeight);return {x:r.left+r.width/2,y:r.bottom-img.naturalHeight*s*.45}})
  const opacity=()=>tab.playwright.evaluate(()=>+getComputedStyle(document.querySelector('.history-lens')).opacity)
  const button=tab.playwright.locator('.history-inspect')
  await tab.cua.move(point);await pause(250);assert.equal(await opacity(),0)
  await button.press('Enter');await tab.cua.move(point);await pause(400)
  assert.equal(await button.getAttribute('aria-pressed'),'true');assert.ok(await opacity()>.95)
  const lens=await tab.playwright.evaluate(()=>{const r=document.querySelector('.history-lens').getBoundingClientRect();return {w:r.width,h:r.height,x:r.x+r.width/2,y:r.y+r.height/2,src:document.querySelector('.history-lens').dataset.loupeSrc}})
  assert.ok(Math.abs(lens.w-190)<.1&&Math.abs(lens.h-190)<.1);assert.ok(Math.abs(lens.x-point.x)<2&&Math.abs(lens.y-point.y)<2);assert.ok(lens.src.endsWith('a-village-zoom.webp'))
  await shot(tab,cdp,`${out}/loupe-1366.png`)
  const copy=await tab.playwright.evaluate(()=>{const r=document.querySelector('.history-curator .history-body').getBoundingClientRect();return {x:r.left+20,y:r.top+20}})
  await tab.cua.move(copy);await pause(200);assert.equal(await opacity(),0)
  await tab.cua.keypress({keys:['ESC']});await pause(200);assert.equal(await button.getAttribute('aria-pressed'),'false')
  const source=tab.playwright.locator('.history-fact-rail .history-source')
  assert.equal(await tab.playwright.evaluate(()=>getComputedStyle(document.querySelector('.history-direct-transition button')).pointerEvents),'none')
  const sourcePoint=await tab.playwright.evaluate(()=>{const r=document.querySelector('.history-fact-rail .history-source').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})
  await tab.cua.click(sourcePoint);assert.ok(await tab.playwright.getByRole('dialog').count()>0)
  assert.ok((await tab.playwright.getByRole('dialog').innerText()).includes('TƯ LIỆU'))
  await tab.playwright.getByRole('button',{name:'Đóng bảng',exact:true}).press('Enter')
  assert.equal(await tab.playwright.evaluate(()=>document.activeElement===document.querySelector('.history-fact-rail .history-source')),true)
  await viewport.set({width:390,height:844});await tab.reload();await enterMural(tab)
  const distance=await tab.playwright.evaluate(()=>document.querySelector('[data-label-era="0"] .history-mobile-inspect').getBoundingClientRect().top-450)
  await tab.cua.scroll({x:300,y:550,scrollY:distance,scrollX:0});await pause(700)
  const inspect=tab.playwright.locator('[data-label-era="0"] .history-mobile-inspect');await inspect.press('Enter');await pause(500)
  const overlay=await tab.playwright.evaluate(()=>{const n=document.querySelector('.history-zoom'),r=n.getBoundingClientRect();return {width:r.width,height:r.height,loaded:n.querySelector('img').naturalWidth,open:n.open}})
  assert.equal(overlay.open,true);assert.equal(overlay.width,390);assert.equal(overlay.height,844);assert.equal(overlay.loaded,2048)
  await shot(tab,cdp,`${out}/390-844-zoom.png`);await tab.cua.keypress({keys:['ESC']})
  assert.equal(await tab.playwright.evaluate(()=>document.activeElement===document.querySelector('[data-label-era="0"] .history-mobile-inspect')),true)
  await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
  await viewport.set({width:1440,height:900});await tab.reload();await enterMural(tab)
  assert.equal(await tab.playwright.locator('.history-bridge').getAttribute('data-layout'),'vertical')
  assert.equal(await tab.playwright.evaluate(()=>!!document.querySelector('.history-bridge').closest('.pin-spacer')),false)
  await cdp.send('Emulation.setEmulatedMedia',{features:[]})
  await viewport.set({width:899,height:768});await tab.reload();await enterMural(tab)
  assert.equal(await tab.playwright.locator('.history-bridge').getAttribute('data-layout'),'vertical')
  await viewport.set({width:900,height:768});await pause(1000)
  assert.equal(await tab.playwright.locator('.history-bridge').getAttribute('data-layout'),'horizontal')
  const result={passiveLoupeOff:true,clickLoupe:true,escape:true,lens,sourceFocus:true,mobileZoom:overlay,mobileFocus:true,reducedMotionNoPin:true,resize899to900:true}
  await writeFile(`${out}/tools.json`,JSON.stringify(result,null,2));return result
}
