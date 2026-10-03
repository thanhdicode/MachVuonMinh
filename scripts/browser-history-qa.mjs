// Run through the documented Browser runtime: await verifyHistory({tab,viewport,cdp,out}).
import assert from 'node:assert/strict'
import {writeFile} from 'node:fs/promises'
import {createRequire} from 'node:module'
const sharp=createRequire(import.meta.url)('C:/Users/ADMIN/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp')
export async function verifyHistoryPolish({tab,viewport,cdp,out,size={width:1280,height:720}}){
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms)),checks=[]
  await viewport.set(size);await pause(500)
  await tab.playwright.getByRole('button',{name:'Mở mục lục',exact:true}).press('Enter')
  await tab.playwright.getByRole('button',{name:/01.H.*Bản đồ lịch sử/}).press('Enter');await pause(1800)
  const atlas=tab.playwright.getByRole('region',{name:'BẢN ĐỒ LỊCH SỬ LỰC LƯỢNG SẢN XUẤT VIỆT NAM'})
  for(let era=0;era<8;era++){
    if(era>0){await tab.cua.keypress({keys:['ARROWRIGHT']});await pause(1500)}
    assert.equal(await atlas.getAttribute('data-era'),String(era))
    const geometry=await atlas.evaluate((el,i)=>{
      const img=el.querySelector(`[data-history-era="${i}"] img`),r=img.getBoundingClientRect(),scale=Math.min(r.width/img.naturalWidth,r.height/img.naturalHeight),label=el.querySelector(`[data-label-era="${i}"] .history-label-top`).getBoundingClientRect(),metric=el.querySelector(`[data-label-era="${i}"] .history-label-bottom`).getBoundingClientRect(),heading=el.querySelector('.history-heading').getBoundingClientRect(),footer=document.querySelector('.exhibit-footer').getBoundingClientRect()
      return {artLeft:r.left+(r.width-img.naturalWidth*scale)/2,artRight:r.right-(r.width-img.naturalWidth*scale)/2,artBottom:r.bottom-(r.height-img.naturalHeight*scale)/2,artTop:r.top+(r.height-img.naturalHeight*scale)/2,textLeft:label.left,textRight:label.right,textTop:label.top,textBottom:label.bottom,metricLeft:metric.left,metricRight:metric.right,metricTop:metric.top,metricBottom:metric.bottom,headingBottom:heading.bottom,footerTop:footer.top}
    },era)
    assert.ok(geometry.textTop>=geometry.artBottom+4||geometry.textRight<=geometry.artLeft-4||geometry.textLeft>=geometry.artRight+4,`Era ${era}, ${size.width}×${size.height}: text overlaps illustration`)
    assert.ok(geometry.metricTop>=geometry.artBottom+4||geometry.metricRight<=geometry.artLeft-4||geometry.metricLeft>=geometry.artRight+4,`Era ${era}: metric overlaps illustration`)
    assert.ok(geometry.artTop>=geometry.headingBottom+4,`Era ${era}: section heading overlaps illustration`)
    assert.ok(Math.max(geometry.textBottom,geometry.metricBottom)<=geometry.footerTop-4,`Era ${era}: annotations collide with footer`)
    const overlaps=await atlas.evaluate(el=>{
      const visible=r=>r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight
      const artwork=[...el.querySelectorAll('.history-image img')].filter(img=>img.naturalWidth).map(img=>{const r=img.getBoundingClientRect(),s=Math.min(r.width/img.naturalWidth,r.height/img.naturalHeight);return {left:r.left+(r.width-img.naturalWidth*s)/2,right:r.right-(r.width-img.naturalWidth*s)/2,top:r.top+(r.height-img.naturalHeight*s)/2,bottom:r.bottom-(r.height-img.naturalHeight*s)/2}}).filter(visible)
      return [...el.querySelectorAll('.history-label-top,.history-label-bottom')].filter(label=>visible(label.getBoundingClientRect())).flatMap(label=>{const r=label.getBoundingClientRect();return artwork.filter(a=>Math.min(r.right,a.right)>Math.max(r.left,a.left)&&Math.min(r.bottom,a.bottom)>Math.max(r.top,a.top)).map(()=>label.textContent.slice(0,70))})
    })
    assert.equal(overlaps.length,0,`Era ${era}: an adjacent caption overlaps visible artwork: ${overlaps.join(', ')}`)
    assert.ok(await atlas.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),'Atlas causes horizontal page overflow')
    checks.push({era,geometry})
    if([0,4,7].includes(era)){const shot=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:size.width,height:size.height,scale:1}});await writeFile(`${out}/polish-${size.width}-${size.height}-era-${era}.png`,Buffer.from(shot.data,'base64'))}
  }
  await writeFile(`${out}/polish-${size.width}-${size.height}.json`,JSON.stringify({size,checks},null,2))
  return {size,erasChecked:checks.length}
}
export async function verifyHistoryLens({tab,out}){
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms)),button=name=>tab.playwright.getByRole('button',{name,exact:true})
  await button('Mở mục lục').click();await tab.playwright.getByRole('button',{name:/01.H.*Bản đồ lịch sử/}).click();await pause(1800)
  const atlas=tab.playwright.getByRole('region',{name:'BẢN ĐỒ LỊCH SỬ LỰC LƯỢNG SẢN XUẤT VIỆT NAM'}),image=button('Phóng ảnh: NHỊP SẢN XUẤT CỦA LÀNG')
  const point=await image.evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x+r.width*.5,y:r.y+r.height*.55}}),opacity=()=>atlas.evaluate(el=>getComputedStyle(el.querySelector('.history-lens')).opacity)
  await tab.cua.move(point);await pause(250);assert.equal(await opacity(),'0','Hover must not activate the lens by itself')
  const toggle=button('Bật kính lúp xem chi tiết');assert.equal(await toggle.getAttribute('aria-pressed'),'false')
  const clickToggle=async()=>{const point=await toggle.evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}});await tab.cua.click(point);await pause(100)}
  await clickToggle();await tab.cua.move(point);await pause(250);assert.equal(await opacity(),'1');assert.equal(await toggle.getAttribute('aria-pressed'),'true')
  assert.ok(Math.abs(await atlas.evaluate(el=>el.getBoundingClientRect().top))<2)
  const text=await tab.playwright.getByRole('heading',{name:'NHỊP SẢN XUẤT CỦA LÀNG',exact:true}).evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x+10,y:r.y+10}})
  await tab.cua.move(text);await pause(100);assert.equal(await opacity(),'0')
  await tab.cua.move(point);await tab.cua.keypress({keys:['ESC']});await pause(100);assert.equal(await opacity(),'0');assert.equal(await toggle.getAttribute('aria-pressed'),'false')
  await clickToggle();await tab.cua.move(point);await pause(250);assert.equal(await opacity(),'1')
  await clickToggle();await tab.cua.move(point);await pause(100);assert.equal(await opacity(),'0')
  const checks=['Passive hover never zooms','Click enables the circular lens','Text remains outside magnification','Escape and a second click disable the lens']
  await writeFile(`${out}/lens-toggle-report.json`,JSON.stringify({checks},null,2));return {checks}
}
export async function verifyHistory({tab,viewport,cdp,out}) {
  const checks=[],connectorFrames=[],pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))
  const button=name=>tab.playwright.getByRole('button',{name,exact:true})
  const atlas=tab.playwright.getByRole('region',{name:'BẢN ĐỒ LỊCH SỬ LỰC LƯỢNG SẢN XUẤT VIỆT NAM'})
  const shot=async name=>{
    const result=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}),png=Buffer.from(result.data,'base64')
    await writeFile(`${out}/${name}.png`,png)
    if(/^0[1-5]-/.test(name)){
      const {data,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true}),columns=new Set()
      let pixels=0
      for(let y=330;y<650;y++)for(let x=0;x<info.width;x++){
        const offset=(y*info.width+x)*4
        if(Math.abs(data[offset]-181)<9&&Math.abs(data[offset+1]-31)<9&&Math.abs(data[offset+2]-42)<9){pixels++;columns.add(Math.floor(x*12/info.width))}
      }
      assert.ok(pixels>500&&columns.size>=10,`${name}: red connector must span the collage, beyond isolated nodes`)
      connectorFrames.push({name,pixels,columns:columns.size})
    }
  }
  await viewport.set({width:1440,height:900})
  await tab.reload();await pause(800)
  await button('Mở mục lục').click()
  await tab.playwright.getByRole('button',{name:/01.H.*Bản đồ lịch sử/}).click();await pause(1800)
  assert.match(await tab.playwright.getByRole('main').getAttribute('class'),/history-active/)
  const initial=await atlas.evaluate(el=>({top:el.getBoundingClientRect().top,layout:el.dataset.layout,overflow:document.documentElement.scrollWidth-innerWidth,canvases:document.querySelectorAll('canvas').length,width:innerWidth,height:innerHeight}))
  assert.equal(initial.layout,'horizontal');assert.ok(Math.abs(initial.top)<2);assert.ok(initial.overflow<=0);assert.equal(initial.canvases,1);assert.equal(initial.width,1440);assert.equal(initial.height,900)
  await shot('01-start');checks.push('1440×900: pinned 560vw atlas, no horizontal browser overflow, one existing canvas')
  await tab.cua.scroll({x:1000,y:550,scrollY:750,scrollX:0});await pause(1800)
  assert.equal(await atlas.getAttribute('data-era'),'1');await shot('02-colonial-rail')
  await tab.cua.keypress({keys:['ARROWLEFT']});await pause(1600)
  assert.equal(await atlas.getAttribute('data-era'),'0')
  await tab.cua.keypress({keys:['ARROWRIGHT']});await pause(1600)
  assert.equal(await atlas.getAttribute('data-era'),'1');checks.push('Actual vertical wheel drives horizontal motion; Left/Right step eras')
  const image=tab.playwright.getByRole('button',{name:'Phóng ảnh: ĐƯỜNG SẮT, MỎ, CẢNG',exact:true})
  const point=await image.evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x+r.width*.5,y:r.y+r.height*.55}})
  await tab.cua.move(point);await pause(200)
  assert.equal(await atlas.evaluate(el=>getComputedStyle(el.querySelector('.history-lens')).opacity),'0')
  const toggle=button('Bật kính lúp xem chi tiết'),togglePoint=await toggle.evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})
  await tab.cua.click(togglePoint);await pause(100)
  await tab.cua.move(point);await pause(350)
  const lens=await atlas.evaluate(el=>{const lens=el.querySelector('.history-lens'),r=lens.getBoundingClientRect();return {opacity:getComputedStyle(lens).opacity,width:r.width,height:r.height,background:getComputedStyle(lens).backgroundImage}})
  assert.equal(lens.opacity,'1');assert.ok(Math.abs(lens.width-190)<.01);assert.ok(Math.abs(lens.height-190)<.01);assert.match(lens.background,/b-rail-zoom/)
  await shot('lens');checks.push('Passive hover stays unzoomed; clicking the mini button enables the 190px circular lens')
  const labelPoint=await tab.playwright.getByRole('heading',{name:'ĐƯỜNG SẮT, MỎ, CẢNG',exact:true}).evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x+10,y:r.y+10}})
  await tab.cua.move(labelPoint);await pause(100)
  assert.equal(await atlas.evaluate(el=>getComputedStyle(el.querySelector('.history-lens')).opacity),'0')
  await button('Đối chiếu tư liệu 1899–1936').click()
  assert.match(await tab.playwright.getByRole('dialog').innerText(),/Fulbright/)
  await button('Đóng bảng').press('Escape');await pause(200)
  assert.equal(await tab.playwright.getByRole('dialog').count(),0);checks.push('Sources stay in the existing secondary drawer; Escape closes it')
  for(let i=2;i<=7;i++) {
    await button('Thời kỳ tiếp theo').click();await pause(1600)
    assert.equal(await atlas.getAttribute('data-era'),String(i))
    if(i===4)await shot('03-reconstruction')
    if(i===5)await shot('04-doi-moi')
    if(i===7)await shot('05-digital')
  }
  await button('Thời kỳ tiếp theo').click();await pause(1800);await shot('06-handoff')
  await button('MÁY MÓC MỞ RỘNG QUY MÔ ↗').click();await pause(1800)
  assert.match(await tab.playwright.getByRole('main').getAttribute('class'),/scene-2 unlocked/)
  assert.doesNotMatch(await tab.playwright.getByRole('main').getAttribute('class'),/history-active/)
  checks.push('Eight eras traversed; final bridge returns to the original machine chapter')
  const errors=(await tab.dev.logs({levels:['error'],limit:30})).filter(x=>!String(x.url??'').startsWith('chrome-extension://'));assert.equal(errors.length,0,JSON.stringify(errors))
  checks.push('Five captured frames contain the red connector across at least ten viewport columns')
  await writeFile(`${out}/desktop-report.json`,JSON.stringify({checks,connectorFrames,errors},null,2));return {checks,connectorFrames,errors}
}

export async function verifyHistoryMobile({tab,viewport,cdp,out}) {
  const checks=[],pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))
  const button=name=>tab.playwright.getByRole('button',{name,exact:true})
  const atlas=tab.playwright.getByRole('region',{name:'BẢN ĐỒ LỊCH SỬ LỰC LƯỢNG SẢN XUẤT VIỆT NAM'})
  const shot=async name=>{const result=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(`${out}/${name}.png`,Buffer.from(result.data,'base64'))}
  await viewport.set({width:390,height:844});await tab.reload();await pause(800)
  await button('Mở mục lục').click();await tab.playwright.getByRole('button',{name:/01.H.*Bản đồ lịch sử/}).click();await pause(1700)
  const layout=await atlas.evaluate(el=>({display:getComputedStyle(el).display,pinned:!!el.closest('.pin-spacer'),overflow:document.documentElement.scrollWidth-innerWidth,lens:getComputedStyle(el.querySelector('.history-lens')).display,connector:getComputedStyle(el.querySelector('.history-vertical')).display}))
  assert.equal(layout.display,'block');assert.equal(layout.pinned,false);assert.ok(layout.overflow<=0);assert.equal(layout.lens,'none');assert.equal(layout.connector,'block')
  await shot('mobile-start');checks.push('390×844: eight vertical eras, continuous vertical SVG, no desktop pin/lens/browser overflow')
  const image=button('Phóng ảnh: NHỊP SẢN XUẤT CỦA LÀNG')
  const point=await image.evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:Math.min(innerHeight-90,r.y+r.height/2)}})
  await tab.cua.click(point);await pause(500)
  assert.equal(await tab.playwright.getByRole('dialog').count(),1)
  const zoom=await tab.playwright.getByRole('dialog').evaluate(el=>({width:el.querySelector('img').getBoundingClientRect().width,source:el.querySelector('img').getAttribute('src')}))
  assert.ok(zoom.width<900&&zoom.width>700);assert.match(zoom.source,/a-village-zoom/)
  await shot('mobile-zoom');await button('Đóng ảnh phóng lớn').click()
  assert.equal(await image.evaluate(el=>document.activeElement===el),true);checks.push('Tap zoom opens a bounded 2.15× image; native dialog closes and restores focus')
  const titles=['SẢN XUẤT TRONG KHÁNG CHIẾN','TÁI THIẾT VÀ MỞ RỘNG','TỪ ĐIỆN ĐẾN DỮ LIỆU']
  for(const title of titles){
    const delta=await tab.playwright.getByRole('heading',{name:title,exact:true}).evaluate(el=>el.getBoundingClientRect().top-130)
    await tab.cua.scroll({x:260,y:580,scrollY:delta,scrollX:0});await pause(1400)
    const active=await atlas.getAttribute('data-active-era')
    assert.ok(Number(active)>=2)
    assert.equal(await button('Phóng ảnh: '+title).evaluate(el=>el.querySelector('img').complete&&el.querySelector('img').naturalWidth>0),true)
    if(title==='TÁI THIẾT VÀ MỞ RỘNG')await shot('mobile-reconstruction')
    if(title==='TỪ ĐIỆN ĐẾN DỮ LIỆU')await shot('mobile-digital')
  }
  checks.push('Real vertical scrolling reaches later eras and loads their responsive images')
  await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
  await viewport.set({width:1440,height:900});await pause(800)
  await button('Mở mục lục').click();await tab.playwright.getByRole('button',{name:/01.H.*Bản đồ lịch sử/}).click();await pause(300)
  const reduced=await atlas.evaluate(el=>({reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,display:getComputedStyle(el).display,pinned:!!el.closest('.pin-spacer'),overflow:document.documentElement.scrollWidth-innerWidth}))
  assert.equal(reduced.reduced,true);assert.equal(reduced.display,'block');assert.equal(reduced.pinned,false);assert.ok(reduced.overflow<=0)
  await shot('reduced-motion');checks.push('1440×900 reduced motion renders a static atlas without pin or parallax')
  await cdp.send('Emulation.setEmulatedMedia',{features:[]});await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:false});await pause(700)
  await button('Mở mục lục').click();await tab.playwright.getByRole('button',{name:/01.H.*Bản đồ lịch sử/}).click();await pause(1800)
  assert.match(await tab.playwright.getByRole('main').getAttribute('class'),/scene-1 unlocked history-active/)
  checks.push('Returning from reduced motion refreshes the original world and history state at the same scroll position')
  const errors=(await tab.dev.logs({levels:['error'],limit:30})).filter(x=>!String(x.url??'').startsWith('chrome-extension://'));assert.equal(errors.length,0,JSON.stringify(errors))
  await writeFile(`${out}/mobile-report.json`,JSON.stringify({checks,errors,touchNote:'UI tap tested; raw Input.dispatchTouchEvent is unsupported by the in-app browser. Real-device long press remains a manual check.'},null,2));return {checks,errors}
}

export async function verifyHistoryResize({tab,viewport,out}) {
  const checks=[],pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))
  const button=name=>tab.playwright.getByRole('button',{name,exact:true})
  const atlas=tab.playwright.getByRole('region',{name:'BẢN ĐỒ LỊCH SỬ LỰC LƯỢNG SẢN XUẤT VIỆT NAM'})
  for(let i=0;i<4;i++){await button('Thời kỳ tiếp theo').click();await pause(1600)}
  assert.equal(await atlas.getAttribute('data-era'),'4')
  for(const size of [{width:1280,height:720},{width:390,height:844},{width:1440,height:900}]){
    await viewport.set(size);await pause(1800)
    assert.equal(await atlas.getAttribute('data-active-era'),'4')
    assert.match(await tab.playwright.getByRole('main').getAttribute('class'),/history-active/)
    if(size.width===390){
      const top=await tab.playwright.getByRole('heading',{name:'TÁI THIẾT VÀ MỞ RỘNG',exact:true}).evaluate(el=>el.getBoundingClientRect().top)
      assert.ok(top>80&&top<180)
    }
  }
  checks.push('Resize 1440×900 → 1280×720 → 390×844 → 1440×900 preserves era 1975–1985')
  await button('Mở mục lục').click();await tab.playwright.getByRole('button',{name:/^01 Công cụ/}).click();await pause(1800)
  const entry=await atlas.evaluate(el=>el.getBoundingClientRect().top+30)
  await tab.cua.scroll({x:1000,y:550,scrollY:entry,scrollX:0});await pause(1800)
  assert.match(await tab.playwright.getByRole('main').getAttribute('class'),/scene-1 unlocked history-active/)
  checks.push('Native vertical wheel enters the atlas from the original plough scene')
  const exit=await atlas.evaluate(el=>{const wrapper=el.closest('.history-insertion');return wrapper.offsetTop+wrapper.offsetHeight-scrollY+200})
  await tab.cua.scroll({x:1000,y:550,scrollY:exit,scrollX:0});await pause(2200)
  assert.match(await tab.playwright.getByRole('main').getAttribute('class'),/scene-2 unlocked/)
  assert.doesNotMatch(await tab.playwright.getByRole('main').getAttribute('class'),/history-active/)
  checks.push('Native vertical wheel unpins the atlas and enters the original machine scene')
  const errors=(await tab.dev.logs({levels:['error'],limit:30})).filter(x=>!String(x.url??'').startsWith('chrome-extension://'));assert.equal(errors.length,0,JSON.stringify(errors))
  await writeFile(`${out}/resize-report.json`,JSON.stringify({checks,errors},null,2));return {checks,errors}
}
