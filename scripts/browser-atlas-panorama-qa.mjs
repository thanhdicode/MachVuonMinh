// Run using the documented in-app Browser runtime against a production preview.
import assert from 'node:assert/strict'
import {writeFile} from 'node:fs/promises'
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))
async function captureViewport(tab,cdp){
  const clip=await tab.playwright.evaluate(()=>({x:scrollX,y:scrollY,width:innerWidth,height:innerHeight,scale:1}))
  return cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,clip})
}
export async function enterAtlas(tab){
  await tab.playwright.getByRole('button',{name:'Mở mục lục',exact:true}).press('Enter')
  await tab.playwright.getByRole('button',{name:/01.H.*Bản đồ lịch sử/}).press('Enter')
  await pause(1500)
}
export async function verifyPanorama({tab,viewport,cdp,out,size}){
  await viewport.set(size);await pause(350);await tab.reload();await enterAtlas(tab)
  const checks=[]
  for(let era=0;era<8;era++){
    if(era){await tab.playwright.getByRole('button',{name:'Thời kỳ tiếp theo',exact:true}).press('Enter');await pause(1500)}
    const g=await tab.playwright.evaluate(i=>{
      const root=document.querySelector('.history-bridge'),stage=root.querySelector(`[data-label-era="${i}"]`)
      const box=x=>{const r=x.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}}
      const visible=x=>{for(let n=x;n&&n!==root.parentElement;n=n.parentElement){const s=getComputedStyle(n);if(s.display==='none'||s.visibility==='hidden'||+s.opacity<.05)return false}const r=box(x);return r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight}
      const body=[...root.querySelectorAll('.history-body')].filter(visible),title=innerWidth<1440?root.querySelector('.history-curator h3'):stage.querySelector('h3')
      const art=[...root.querySelectorAll('.history-image img')].filter(x=>x.naturalWidth).map(img=>{const r=box(img),s=Math.min(r.width/img.naturalWidth,r.height/img.naturalHeight),[ax,ay]=getComputedStyle(img).objectPosition.split(' ').map(v=>Number.parseFloat(v)/100),w=img.naturalWidth*s,h=img.naturalHeight*s,clip=Number.parseFloat(getComputedStyle(img.closest('figure')).getPropertyValue('--art-clip'))||0;return {left:Math.max(r.left+(r.width-w)*ax,r.left+clip),right:r.left+(r.width-w)*ax+w,top:r.top+(r.height-h)*ay,bottom:r.top+(r.height-h)*ay+h}}).filter(r=>r.right>r.left&&r.right>0&&r.left<innerWidth)
      const collision=(a,b)=>Math.min(a.right,b.right)>Math.max(a.left,b.left)+2&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top)+2
      const facts=box(stage.querySelector('.history-label-bottom')),caption=box(body[0]),headline=box(title),loupe=box(root.querySelector('.history-loupe-dock'))
      return {era:root.dataset.era,layout:root.dataset.layout,bodyCount:body.length,caption,headline,facts,titleLines:headline.height/Number.parseFloat(getComputedStyle(title).lineHeight),collisions:art.filter(r=>collision(caption,r)||collision(facts,r)).length,loupeCollision:collision(facts,loupe),threadZ:+getComputedStyle(root.querySelector('.history-path-layer')).zIndex,collageZ:+getComputedStyle(root.querySelector('.history-track')).zIndex,threadWidth:getComputedStyle(root.querySelector('.history-red-path')).strokeWidth,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,curator:visible(root.querySelector('.history-curator')),worldWidth:root.querySelector('.atlas-world').getBoundingClientRect().width/innerWidth,images:stage.querySelector('img').naturalWidth,filter:getComputedStyle(stage.querySelector('figure')).filter,activeOpacity:+getComputedStyle(stage.querySelector('figure')).opacity,artHeight:stage.querySelector('figure').getBoundingClientRect().height}
    },era)
    assert.equal(g.era,String(era));assert.equal(g.layout,'horizontal');assert.equal(g.bodyCount,1)
    assert.ok(g.threadZ<g.collageZ,'Red thread must stay behind the collage');assert.equal(g.threadWidth,'3px')
    assert.equal(g.collisions,0,`${size.width} era ${era}: body/facts overlap artwork`);assert.equal(g.loupeCollision,false)
    for(const b of [g.caption,g.headline,g.facts]){assert.ok(b.left>=0&&b.right<=size.width+1);assert.ok(b.top>=0&&b.bottom<=size.height-30)}
    assert.equal(await tab.playwright.evaluate(()=>getComputedStyle(document.querySelector('.history-ending')).visibility),'hidden','Exit copy must wait for its own beat')
    assert.ok(g.titleLines<=2.05,`Era ${era}: title exceeds two lines`);assert.ok(g.images>0);assert.ok(g.activeOpacity>.98)
    assert.ok(g.overflow<=1);assert.equal(g.curator,size.width<1440);assert.ok(g.worldWidth>=5.6&&g.worldWidth<=7.2)
    checks.push(g)
    const shot=await captureViewport(tab,cdp)
    await writeFile(`${out}/${size.width}-${size.height}-era-${era}.png`,Buffer.from(shot.data,'base64'))
  }
  await writeFile(`${out}/${size.width}-${size.height}.json`,JSON.stringify(checks,null,2));return {size,eras:checks.length}
}

export async function verifyMobileStrip({tab,viewport,cdp,out}){
  await viewport.set({width:390,height:844});await pause(350);await tab.reload();await enterAtlas(tab)
  const checks=[]
  for(let era=0;era<8;era++){
    const delta=await tab.playwright.evaluate(i=>document.querySelector(`[data-label-era="${i}"]`).getBoundingClientRect().top-125,era)
    if(era){await tab.cua.scroll({x:320,y:500,scrollY:delta,scrollX:0});await pause(750)}
    const g=await tab.playwright.evaluate(i=>{
      const root=document.querySelector('.history-bridge'),stage=root.querySelector(`[data-label-era="${i}"]`),body=stage.querySelector('.history-body'),r=body.getBoundingClientRect()
      const visible=x=>{for(let n=x;n;n=n.parentElement){const s=getComputedStyle(n);if(s.display==='none'||s.visibility==='hidden'||+s.opacity<.05)return false}return x.getBoundingClientRect().height>0}
      return {era:root.dataset.era,layout:root.dataset.layout,pinned:!!root.closest('.pin-spacer'),overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,bodies:[...root.querySelectorAll('.history-body')].filter(visible).length,bodyVisible:visible(body),body:{left:r.left,right:r.right,top:r.top,bottom:r.bottom},threadWidth:getComputedStyle(root.querySelector('.history-vertical path')).strokeWidth,image:stage.querySelector('img').naturalWidth,world:root.querySelector('.atlas-world').getBoundingClientRect().width}
    },era)
    assert.equal(g.era,String(era));assert.equal(g.layout,'vertical');assert.equal(g.pinned,false);assert.equal(g.bodies,1);assert.equal(g.bodyVisible,true);assert.equal(g.threadWidth,'2px');assert.ok(g.overflow<=0);assert.ok(g.world<390);assert.ok(g.image>0)
    checks.push(g)
    const shot=await captureViewport(tab,cdp)
    await writeFile(`${out}/390-844-era-${era}.png`,Buffer.from(shot.data,'base64'))
  }
  await writeFile(`${out}/390-844.json`,JSON.stringify(checks,null,2));return {mobileEras:checks.length}
}

export async function verifyLoupe({tab,viewport,cdp,out}){
  await viewport.set({width:1366,height:768});await pause(350);await tab.reload();await enterAtlas(tab)
  const opacity=()=>tab.playwright.evaluate(()=>+getComputedStyle(document.querySelector('.history-lens')).opacity)
  const point=await tab.playwright.evaluate(()=>{const img=document.querySelector('[data-label-era="0"] .history-image img'),r=img.getBoundingClientRect(),s=Math.min(r.width/img.naturalWidth,r.height/img.naturalHeight);return {x:r.left+img.naturalWidth*s*.5,y:r.bottom-img.naturalHeight*s*.45}})
  await tab.cua.move(point);await pause(250);assert.equal(await opacity(),0,'Hover must never activate the loupe')
  const button=tab.playwright.locator('.history-inspect')
  assert.equal(await button.getAttribute('aria-pressed'),'false');await button.press('Enter');await tab.cua.move(point);await pause(350)
  assert.equal(await button.getAttribute('aria-pressed'),'true');assert.ok(await opacity()>.95)
  const lens=await tab.playwright.evaluate(()=>{const r=document.querySelector('.history-lens').getBoundingClientRect();return {width:r.width,height:r.height,x:r.x+r.width/2,y:r.y+r.height/2,src:document.querySelector('.history-lens').dataset.loupeSrc}})
  assert.equal(lens.width,190);assert.equal(lens.height,190);assert.ok(Math.abs(lens.x-point.x)<2&&Math.abs(lens.y-point.y)<2);assert.ok(lens.src.endsWith('a-village-zoom.webp'))
  const shot=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(`${out}/loupe-1366.png`,Buffer.from(shot.data,'base64'))
  const copy=await tab.playwright.evaluate(()=>{const r=document.querySelector('.history-curator .history-body').getBoundingClientRect();return {x:r.left+20,y:r.top+20}})
  await tab.cua.move(copy);await pause(200);assert.equal(await opacity(),0,'Lens must leave text readable')
  await tab.cua.move(point);await pause(200);await button.press('Enter');await pause(350);assert.equal(await button.getAttribute('aria-pressed'),'false');assert.equal(await opacity(),0)
  await button.press('Enter');await tab.cua.move(point);await pause(250);await tab.cua.keypress({keys:['ESC']});await pause(350);assert.equal(await button.getAttribute('aria-pressed'),'false')
  return {passiveHover:false,clickToggle:true,escape:true,exactLens:true}
}

export async function verifyExit({tab,viewport,cdp,out,size}){
  await viewport.set(size);await tab.reload();await pause(650);await enterAtlas(tab)
  const delta=await tab.playwright.evaluate(()=>document.querySelector('.history-bridge').closest('.pin-spacer').getBoundingClientRect().bottom-innerHeight-1)
  await tab.cua.scroll({x:size.width*.8,y:size.height*.7,scrollY:delta,scrollX:0});await pause(2300)
  const check=await tab.playwright.evaluate(()=>{
    const root=document.querySelector('.history-bridge'),ending=root.querySelector('.history-ending')
    return {era:root.dataset.era,visible:getComputedStyle(ending).visibility,imageOpacity:Number(getComputedStyle(root.querySelector('figure')).opacity),paper:getComputedStyle(ending.querySelector('p')).backgroundColor,boxes:[...ending.querySelectorAll('h3,p,button')].map(n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}})}
  })
  assert.equal(check.era,'8');assert.equal(check.visible,'visible');assert.equal(check.imageOpacity,0)
  for(const box of check.boxes){assert.ok(box.left>=0&&box.right<=size.width,'Native exit copy must stay inside viewport');assert.ok(box.top>=0&&box.bottom<=size.height-30)}
  const shot=await captureViewport(tab,cdp);await writeFile(`${out}/${size.width}-${size.height}-exit.png`,Buffer.from(shot.data,'base64'))
  await writeFile(`${out}/${size.width}-${size.height}-exit.json`,JSON.stringify(check,null,2));return {size,exitInsideViewport:true,collageFaded:true}
}
