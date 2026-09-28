// Run with the documented in-app Browser runtime: await verifyRefinement({tab,viewport,cdp,out}).
// Uses actual keyboard, wheel and pointer input; no application-state injection.
import assert from 'node:assert/strict'
import {writeFile} from 'node:fs/promises'
export async function verifyRefinement({tab,viewport,cdp,out}) {
  const checks=[]
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))
  const button=name=>tab.playwright.getByRole('button',{name,exact:true})
  const chapter=async name=>{
    await button('Mở mục lục').press('Enter')
    await button(name).waitFor({state:'visible'})
    await button(name).press('Enter');await pause(1300)
  }
  const shot=async name=>{
    const result=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false})
    const bytes=Buffer.from(result.data,'base64');await writeFile(`${out}/${name}.png`,bytes)
    return [bytes.readUInt32BE(16),bytes.readUInt32BE(20)]
  }
  await viewport.set({width:1440,height:900});await pause(500)
  await button('Kéo sợi đỏ qua vòng. Hoặc nhấn Enter để tiếp tục.').press('Enter');await pause(1300)
  assert.deepEqual(await shot('00-after'),[1440,900])
  await chapter('03 Tự động hóa ↗')
  await shot('03-after-desktop')
  await viewport.set({width:1280,height:720});await pause(700)
  assert.ok(await tab.playwright.getByRole('heading',{name:'Từ thao tác sang tri thức.'}).isVisible(),'Resize preserves active scene')
  const copy=await tab.playwright.getByRole('paragraph').filter({hasText:'Con người không biến mất.'}).evaluate(el=>el.getBoundingClientRect().bottom)
  const slider=await tab.playwright.getByRole('slider',{name:'MỨC TỰ ĐỘNG HÓA'}).evaluate(el=>el.getBoundingClientRect().top)
  assert.ok(slider-copy>20,'Laptop slider does not overlap copy')
  await shot('03-laptop');checks.push('1280×720: resize retains chapter; copy and slider do not overlap')
  await viewport.set({width:1440,height:900});await pause(600)
  assert.ok(await tab.playwright.getByRole('heading',{name:'Từ thao tác sang tri thức.'}).isVisible())
  await chapter('07 Buồng chính sách ↗')
  const token=button('01 Kỹ năng số ⠿'),socket=button('Vị trí 1: trống')
  const center=locator=>locator.evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})
  const a=await center(token),b=await center(socket)
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',...a})
  await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,...a})
  try {
    for(let i=1;i<=12;i++)await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:a.x+(b.x-a.x)*i/12,y:a.y+(b.y-a.y)*i/12})
    await pause(250)
    assert.match(await socket.getAttribute('class'),/receiving/,'Socket previews the drop')
    await shot('07-drop-target')
  } finally {
    await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',buttons:0,clickCount:1,...b})
  }
  await pause(100)
  await button('Vị trí 1: Kỹ năng số. Nhấn để tháo.').waitFor({state:'visible'})
  await button('02 Quyền dữ liệu ⠿').press('Enter')
  await button('03 Quản trị dữ liệu ⠿').press('Space')
  await pause(100)
  assert.equal(await tab.playwright.getByRole('button',{name:/^Vị trí \d:.*Nhấn để tháo\.$/}).count(),3)
  await button('Vị trí 1: Kỹ năng số. Nhấn để tháo.').press('Enter')
  await token.press('Enter');await pause(100)
  assert.equal(await tab.playwright.getByRole('button',{name:/^Vị trí \d:.*Nhấn để tháo\.$/}).count(),3)
  await shot('07-after');checks.push('Drop preview, real drag, no duplicate click, Enter/Space install, remove/reinstall')
  await viewport.set({width:390,height:844});await pause(700)
  assert.ok(await tab.playwright.getByRole('heading',{name:'Ba đòn bẩy. Một hệ thống.'}).isVisible())
  await shot('07-mobile-results')
  const result=await tab.playwright.getByText('MẠNH Ở',{exact:true}).evaluate(el=>{const p=el.parentElement;return {size:getComputedStyle(p).fontSize,bottom:p.parentElement.getBoundingClientRect().bottom}})
  const tokenTop=await token.evaluate(el=>el.getBoundingClientRect().top)
  assert.ok(parseFloat(result.size)>=11 && result.bottom<tokenTop,'Readable mobile results stay above tokens')
  checks.push('390×844: readable result rows; no overlap with token tray; chapter retained')
  await viewport.set({width:1440,height:900});await pause(500)
  for(const name of ['05 Phòng biện chứng ↗','03 Tự động hóa ↗']){
    await chapter(name)
    assert.match(await tab.playwright.getByRole('main').getAttribute('class'),/unlocked/,'Menu navigation unlocks the journey')
    await tab.reload();await pause(1600)
    await button('Kéo sợi đỏ qua vòng. Hoặc nhấn Enter để tiếp tục.').waitFor({state:'visible'})
    assert.equal(await tab.playwright.getByRole('main').evaluate(()=>document.documentElement.scrollTop),0,'Reload resets the locked entry to the top')
  }
  await button('Kéo sợi đỏ qua vòng. Hoặc nhấn Enter để tiếp tục.').press('Enter');await pause(1300)
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseWheel',x:1100,y:650,deltaY:1400,deltaX:0});await pause(1500)
  assert.match(await tab.playwright.getByRole('main').getAttribute('class'),/scene-1 unlocked/,'Native wheel moves to the first scene after reload')
  checks.push('Mid-journey reload returns to entry; menu can skip entry; native wheel works after reload')
  const errors=await tab.dev.logs({levels:['error'],limit:50})
  assert.equal(errors.length,0,JSON.stringify(errors))
  const report={checks,errors};await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));return report
}

export async function verifyWheelJourney({tab,cdp,out}) {
  const stops=[0,.08,.18,.30,.41,.53,.70,.82,.92,1],scenes=[]
  await tab.playwright.getByRole('button',{name:'Mở mục lục',exact:true}).press('Enter')
  await tab.playwright.getByRole('button',{name:'00 Khởi mạch ↗',exact:true}).press('Enter')
  await new Promise(r=>setTimeout(r,1500))
  for(let scene=0;scene<9;scene++){
    if(scene){
      const page=await tab.playwright.getByRole('main').evaluate(()=>({y:document.documentElement.scrollTop,max:document.documentElement.scrollHeight-document.documentElement.clientHeight}))
      const target=(stops[scene]+(stops[scene+1]-stops[scene])*.32)*page.max
      await cdp.send('Input.dispatchMouseEvent',{type:'mouseWheel',x:1350,y:700,deltaX:0,deltaY:target-page.y})
      await new Promise(r=>setTimeout(r,1600))
    }
    assert.match(await tab.playwright.getByRole('main').getAttribute('class'),new RegExp(`scene-${scene} unlocked`))
    const result=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false})
    const bytes=Buffer.from(result.data,'base64')
    assert.deepEqual([bytes.readUInt32BE(16),bytes.readUInt32BE(20)],[1440,900])
    await writeFile(`${out}/${String(scene).padStart(2,'0')}-final.png`,bytes)
    scenes.push(scene)
  }
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseWheel',x:1350,y:700,deltaX:0,deltaY:2000})
  await new Promise(r=>setTimeout(r,1500))
  assert.ok(await tab.playwright.getByRole('button',{name:'THỬ LẠI LAB ↗',exact:true}).isVisible())
  const errors=await tab.dev.logs({levels:['error'],limit:50})
  assert.equal(errors.length,0,JSON.stringify(errors))
  const result={scenes,nativeWheel:true,endVisible:true,errors}
  await writeFile(`${out}/wheel-report.json`,JSON.stringify(result,null,2));return result
}
