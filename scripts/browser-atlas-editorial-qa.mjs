// Run through the documented Browser runtime; browser operations remain native.
import assert from 'node:assert/strict'
import {writeFile} from 'node:fs/promises'
import {createRequire} from 'node:module'
const sharp=createRequire(import.meta.url)('C:/Users/ADMIN/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp')
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))
async function enter(tab){
  await tab.playwright.getByRole('button',{name:'Mở mục lục',exact:true}).press('Enter')
  await tab.playwright.getByRole('button',{name:/01.H.*Bản đồ lịch sử/}).press('Enter');await pause(1500)
}
async function screenshot(cdp,out,name,size){
  const shot=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:size.width,height:size.height,scale:1}})
  const bytes=Buffer.from(shot.data,'base64');await writeFile(`${out}/${name}.png`,bytes);return bytes
}
export async function verifyAtlasEditorial({tab,viewport,cdp,out,size={width:1366,height:768}}){
  await viewport.set(size);await pause(500);await enter(tab)
  const checks=[]
  for(let era=0;era<8;era++){
    if(era){await tab.cua.keypress({keys:['ARROWRIGHT']});await pause(1400)}
    const g=await tab.playwright.evaluate(i=>{
      const atlas=document.querySelector('.history-bridge'),stage=atlas.querySelector(`[data-label-era="${i}"]`),box=x=>{const r=x.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}},visible=x=>getComputedStyle(x).visibility==='visible'&&getComputedStyle(x).opacity!=='0',intersects=(a,b)=>Math.min(a.right,b.right)>Math.max(a.left,b.left)+1&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top)+1
      const body=box(stage.querySelector('.history-body')),title=box(stage.querySelector('h3')),facts=box(stage.querySelector('.history-label-bottom')),dock=box(atlas.querySelector('.history-loupe-dock'))
      const images=[...atlas.querySelectorAll('.history-image img')].filter(img=>img.naturalWidth).map(img=>{const r=box(img),s=Math.min(r.width/img.naturalWidth,r.height/img.naturalHeight),w=img.naturalWidth*s,h=img.naturalHeight*s;return {left:r.left+(r.width-w)/2,right:r.right-(r.width-w)/2,top:r.top+(r.height-h)/2,bottom:r.bottom-(r.height-h)/2}}).filter(r=>r.right>0&&r.left<innerWidth)
      return {era:atlas.dataset.era,motion:atlas.dataset.motion,containerName:getComputedStyle(stage).containerName,containerType:getComputedStyle(stage).containerType,body,title,facts,dock,bodyLines:body.height/+getComputedStyle(stage.querySelector('.history-body')).lineHeight.replace('px',''),bodyImageCollision:images.some(r=>intersects(body,r)),factImageCollision:images.some(r=>intersects(facts,r)),dockCopyCollision:intersects(dock,body)||intersects(dock,title)||intersects(dock,facts),otherBodies:[...atlas.querySelectorAll('.history-body')].filter(x=>x!==stage.querySelector('.history-body')&&visible(x)).length,opacity:getComputedStyle(stage.querySelector('.history-figure')).opacity,nextOpacity:i<7?getComputedStyle(atlas.querySelector(`[data-label-era="${i+1}"] .history-figure`)).opacity:null,previousOpacity:i>0?getComputedStyle(atlas.querySelector(`[data-label-era="${i-1}"] .history-figure`)).opacity:null,lens:getComputedStyle(atlas.querySelector('.history-lens')).opacity,inspectable:stage.querySelector('.history-image').dataset.inspectable,source:stage.querySelector('.history-image').dataset.loupeSrc,footer:box(document.querySelector('.exhibit-footer')),pageWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,artHeight:stage.querySelector('.history-figure').getBoundingClientRect().height}
    },era)
    assert.equal(g.era,String(era));assert.equal(g.containerName,'history-era');assert.equal(g.containerType,'inline-size')
    assert.equal(g.motion,size.width>=1440?'wide':size.width>=1100?'standard':'compact')
    assert.equal(g.bodyImageCollision,false,`Era ${era}: body/image collision`);assert.equal(g.factImageCollision,false,`Era ${era}: fact/image collision`)
    assert.equal(g.dockCopyCollision,false,`Era ${era}: dock/copy collision`);assert.equal(g.otherBodies,0,'Competing era bodies visible')
    assert.ok(g.title.left>=0&&g.title.right<=size.width,'Active heading clipped');assert.ok(g.facts.bottom<=g.footer.top-3,`Era ${era}: metric/footer collision`)
    assert.equal(g.opacity,'1');if(g.nextOpacity!==null)assert.ok(+g.nextOpacity>=.25&&+g.nextOpacity<=.4);if(g.previousOpacity!==null)assert.ok(+g.previousOpacity>=.55&&+g.previousOpacity<=.7)
    assert.equal(g.lens,'0');assert.equal(g.inspectable,'true');assert.ok(g.source.endsWith('-zoom.webp'));assert.ok(g.scrollWidth<=g.pageWidth+1)
    if(size.height<=820)assert.ok(g.bodyLines<=3.05,`Era ${era}: ${g.bodyLines} body lines`)
    checks.push(g)
    if([0,4,5,7].includes(era)){
      const bytes=await screenshot(cdp,out,`editorial-${size.width}-${size.height}-era-${era}`,size)
      const {data,info}=await sharp(bytes).removeAlpha().raw().toBuffer({resolveWithObject:true}),columns=new Set();let red=0
      for(let y=160;y<Math.min(size.height-150,1000);y++)for(let x=0;x<info.width;x++){const p=(y*info.width+x)*info.channels;if(data[p]>100&&data[p]>data[p+1]*1.8&&data[p]>data[p+2]*1.55){red++;columns.add(Math.min(11,Math.floor(x/info.width*12)))}}
      assert.ok(red>500&&columns.size>=10,'Red connector missing across viewport');checks.at(-1).connector={red,columns:columns.size}
    }
  }
  const allErrors=await tab.dev.logs({levels:['error'],limit:30}),errors=allErrors.filter(x=>!String(x.url??'').startsWith('chrome-extension://')),extensionErrors=allErrors.filter(x=>String(x.url??'').startsWith('chrome-extension://'));assert.equal(errors.length,0,JSON.stringify(errors))
  await writeFile(`${out}/editorial-${size.width}-${size.height}.json`,JSON.stringify({size,checks,errors,extensionErrors},null,2));return {size,eras:checks.length,errors}
}
export async function verifyAtlasLoupe({tab,viewport,cdp,out}){
  await viewport.set({width:1440,height:900});await tab.goto('http://localhost:4173/');await pause(700);await enter(tab)
  const highResolutionLoads=async()=>{const r=await cdp.send('Runtime.evaluate',{expression:"performance.getEntriesByType('resource').filter(x=>x.name.endsWith('-zoom.webp')).length",returnByValue:true});return r.result.value}
  const button=tab.playwright.getByRole('button',{name:'Bật kính lúp xem chi tiết',exact:true}),lens=()=>tab.playwright.evaluate(()=>getComputedStyle(document.querySelector('.history-lens')).opacity)
  const point=await tab.playwright.evaluate(()=>{const r=document.querySelector('[data-label-era="0"] .history-image img').getBoundingClientRect();return {x:r.left+r.width*.5,y:r.top+r.height*.55}})
  await tab.cua.move(point);await pause(200);assert.equal(await lens(),'0');assert.equal(await button.getAttribute('aria-pressed'),'false')
  assert.equal(await highResolutionLoads(),0,'High resolution loaded before inspection')
  const center=await button.evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})
  await tab.cua.click(center);await pause(350);assert.equal(await button.getAttribute('aria-pressed'),'true')
  const angle=await button.evaluate(el=>{const m=getComputedStyle(el).transform.slice(7,-1).split(',').map(v=>+v);return Math.atan2(m[1],m[0])*180/Math.PI});assert.ok(angle>=10&&angle<=14)
  await tab.cua.move(point);await pause(300);assert.equal(await lens(),'1');await screenshot(cdp,out,'editorial-loupe-active',{width:1440,height:900})
  await tab.cua.move({x:point.x+8,y:point.y+8});await pause(200)
  assert.equal(await highResolutionLoads(),1,'High resolution must load only on first inspection')
  const text=await tab.playwright.evaluate(()=>{const r=document.querySelector('[data-label-era="0"] .history-body').getBoundingClientRect();return {x:r.left+20,y:r.top+10}})
  await tab.cua.move(text);await pause(200);assert.equal(await lens(),'0')
  await tab.cua.keypress({keys:['ESC']});await pause(400);assert.equal(await button.getAttribute('aria-pressed'),'false');assert.equal(await lens(),'0')
  assert.equal(await button.evaluate(el=>document.activeElement===el),true,'Escape must return focus to the dock')
  const dockReturn=await tab.playwright.evaluate(()=>{const b=document.querySelector('.history-inspect').getBoundingClientRect(),l=document.querySelector('.history-lens').getBoundingClientRect();return Math.hypot(b.left+b.width/2-l.left-l.width/2,b.top+b.height/2-l.top-l.height/2)});assert.ok(dockReturn<15,'Lens must return to the dock')
  await tab.cua.click(center);await pause(350);await tab.cua.click({x:center.x-5,y:center.y-7});await pause(400);assert.equal(await button.getAttribute('aria-pressed'),'false')
  const report={passiveHover:false,manualActivation:true,rotation:angle,lazyLoads:1,bodyExcluded:true,escapeAndSecondClick:true,dockReturn,focusReturns:true}
  await writeFile(`${out}/editorial-loupe.json`,JSON.stringify(report,null,2));return report
}
export async function verifyAtlasMobile({tab,viewport,cdp,out}){
  await viewport.set({width:390,height:844});await tab.goto('http://localhost:4173/');await pause(700);await enter(tab)
  const initial=await tab.playwright.evaluate(()=>({stages:document.querySelectorAll('.era-stage').length,bodies:[...document.querySelectorAll('.history-body')].filter(x=>getComputedStyle(x).visibility==='visible').length,pinned:!!document.querySelector('.history-bridge').closest('.pin-spacer'),overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,lens:getComputedStyle(document.querySelector('.history-lens')).display,buttons:[...document.querySelectorAll('.history-mobile-inspect')].filter(x=>getComputedStyle(x).display!=='none').length,dialogs:document.querySelectorAll('dialog[open]').length}))
  assert.equal(initial.stages,8);assert.equal(initial.bodies,8);assert.equal(initial.pinned,false);assert.equal(initial.overflow,0);assert.equal(initial.lens,'none');assert.equal(initial.buttons,8);assert.equal(initial.dialogs,0)
  await screenshot(cdp,out,'editorial-390-844',{width:390,height:844})
  const delta=await tab.playwright.evaluate(()=>document.querySelector('[data-label-era="0"] .history-mobile-inspect').getBoundingClientRect().top-450)
  await tab.cua.scroll({x:270,y:590,scrollY:delta,scrollX:0});await pause(800)
  const p=await tab.playwright.evaluate(()=>{const r=document.querySelector('[data-label-era="0"] .history-mobile-inspect').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})
  await tab.cua.click(p);await pause(500)
  const overlay=await tab.playwright.getByRole('dialog').evaluate(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,source:el.querySelector('img').getAttribute('src')}))
  assert.ok(Math.abs(overlay.width-390)<1&&Math.abs(overlay.height-844)<1);assert.match(overlay.source,/a-village-zoom/)
  await screenshot(cdp,out,'editorial-mobile-inspection',{width:390,height:844})
  await tab.playwright.getByRole('button',{name:'Đóng ảnh phóng lớn',exact:true}).click();assert.equal(await tab.playwright.evaluate(()=>document.activeElement===document.querySelector('[data-label-era="0"] .history-mobile-inspect')),true)
  await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await viewport.set({width:1440,height:900});await pause(700);await enter(tab)
  const staticAtlas=await tab.playwright.evaluate(()=>({layout:document.querySelector('.history-bridge').dataset.layout,pinned:!!document.querySelector('.history-bridge').closest('.pin-spacer'),pressed:document.querySelector('.history-inspect').getAttribute('aria-pressed')}))
  assert.equal(staticAtlas.layout,'vertical');assert.equal(staticAtlas.pinned,false);assert.equal(staticAtlas.pressed,'false');await screenshot(cdp,out,'editorial-reduced-motion',{width:1440,height:900})
  await cdp.send('Emulation.setEmulatedMedia',{features:[]});await pause(700);await enter(tab)
  assert.equal(await tab.playwright.getByRole('button',{name:'Bật kính lúp xem chi tiết',exact:true}).getAttribute('aria-pressed'),'false')
  const report={initial,overlay,staticAtlas,focusReturns:true,resizeRequiresOptIn:true};await writeFile(`${out}/editorial-mobile.json`,JSON.stringify(report,null,2));return report
}
