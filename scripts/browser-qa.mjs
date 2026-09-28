import assert from 'node:assert/strict'
import { readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
// Use the browser automation already installed with the local Chrome tool.
const cache=join(process.env.LOCALAPPDATA,'npm-cache','_npx')
const bundle=readdirSync(cache).map(d=>join(cache,d,'node_modules/chrome-devtools-mcp/build/src/third_party/index.js')).find(existsSync)
if(!bundle) throw new Error('Set up the Chrome DevTools tool before browser QA.')
const {puppeteer}=await import(pathToFileURL(bundle))
const browser=await puppeteer.launch({executablePath:join(process.env.LOCALAPPDATA,'Google/Chrome/Application/chrome.exe'),headless:true,args:['--no-sandbox','--enable-webgl','--ignore-gpu-blocklist']})
const page=await browser.newPage(), errors=[]
page.on('pageerror',e=>errors.push(e.message))
page.on('console',m=>{if(m.type()==='error') errors.push(m.text())})
const out='.studio/qa/rebuild';mkdirSync(out,{recursive:true})
const wait=ms=>new Promise(r=>setTimeout(r,ms))
const report={url:process.env.QA_URL||'http://127.0.0.1:5173',wheel:[],checks:[],errors}
const mapOnly=process.argv.includes('--map-only')
const scene=()=>page.$eval('.experience',e=>Number(e.className.match(/scene-(\d)/)[1]))
const capture=async name=>{await wait(1200);await page.screenshot({path:`${out}/${name}.png`});console.log('Captured',name)}
try {
  await page.setViewport({width:1440,height:900,deviceScaleFactor:1})
  await page.goto(report.url,{waitUntil:'networkidle0'});await page.waitForSelector('canvas');await wait(1200)
  await capture('00-entry')
  const handle=await page.$('.thread-handle'),eyelet=await page.$('.eyelet-target'),hb=await handle.boundingBox(),eb=await eyelet.boundingBox()
  await page.mouse.move(hb.x+hb.width/2,hb.y+hb.height/2);await page.mouse.down();await page.mouse.move(eb.x+eb.width/2,eb.y+eb.height/2,{steps:20});await page.mouse.up()
  assert.match(await page.$eval('.experience',e=>e.className),/unlocked/)
  report.checks.push('Opening gesture: real pointer drag through eyelet')
  await page.reload({waitUntil:'networkidle0'});await page.waitForSelector('.thread-handle')
  await page.focus('.thread-handle');await page.keyboard.press('Enter');await wait(1300)
  await capture('00-hero')
  if(process.argv.includes('--motion-only')){
    await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}])
    await page.click('.menu-trigger');await wait(500);await page.click('.chapter-menu button:nth-child(4)');await wait(400)
    await page.focus('#automation');await page.keyboard.press('Home');await wait(150)
    const clip=await page.evaluate(()=>({x:700,y:scrollY+180,width:700,height:560}))
    const low=await page.screenshot({clip,path:`${out}/03-pose-low.png`})
    await capture('03-reduced-low')
    await page.keyboard.press('End');await wait(150)
    const high=await page.screenshot({clip,path:`${out}/03-pose-high.png`})
    assert.ok(low.length>10000 && high.length>10000,'Pose crops contain the rendered object')
    assert.notDeepEqual(low,high,'Robot pose responds immediately with reduced motion')
    assert.equal(await page.$eval('#automation',e=>e.value),'100')
    await capture('03-reduced-high');assert.deepEqual(errors,[])
    writeFileSync(`${out}/motion-report.json`,JSON.stringify({checks:['Reduced-motion automation: keyboard 0–100 changes actual 3D pose immediately'],errors},null,2))
    await browser.close();process.exit(0)
  }
  const stops=[0,.08,.18,.30,.41,.53,.70,.82,.92,1]
  const max=await page.evaluate(()=>document.documentElement.scrollHeight-innerHeight)
  await page.mouse.move(980,490)
  for(const i of mapOnly?[6]:[1,2,3,4,5,6,7,8]) {
    const desired=max*(stops[i]+(stops[i+1]-stops[i])*.32)
    const before=await page.evaluate(()=>scrollY)
    await page.mouse.wheel({deltaY:desired-before});await wait(1600)
    const actual=await scene();assert.equal(actual,i,`Native wheel reaches scene ${i}`)
    report.wheel.push({expected:i,actual,y:await page.evaluate(()=>scrollY)})
    await capture(`${String(i).padStart(2,'0')}-desktop`)
  }
  if(mapOnly){
    await page.setViewport({width:1920,height:1080,deviceScaleFactor:1});await capture('06-wide')
    await page.setViewport({width:390,height:844,deviceScaleFactor:1,isMobile:true,hasTouch:true});await page.waitForSelector('.thread-handle');await page.tap('.thread-handle');await wait(200)
    await page.click('.menu-trigger');await wait(500);await page.click('.chapter-menu button:nth-child(7)');await wait(1700)
    await capture('06-mobile');assert.equal(await scene(),6);assert.deepEqual(errors,[])
    writeFileSync(`${out}/map-report.json`,JSON.stringify({checks:['Final geography desktop/mobile screenshots; no console errors'],errors},null,2))
    await browser.close();process.exit(0)
  }
  await page.mouse.wheel({deltaY:max});await wait(1300)
  assert.equal(await page.$eval('.final-actions',e=>getComputedStyle(e).opacity),'1','Finale remains visible at page end')
  report.checks.push('Native wheel reaches all nine scenes; finale visible at document end')
  if(process.argv.includes('--quick')) { writeFileSync(`${out}/quick-report.json`,JSON.stringify(report,null,2));process.exitCode=errors.length?1:0 }
  else {
    // The same trusted wheel goes backwards; menu navigation and controls are real clicks.
    const go=async i=>{await page.click('.menu-trigger');await page.waitForSelector('dialog[open]');await wait(500);await page.click(`.chapter-menu button:nth-child(${i+1})`);await wait(1700);assert.equal(await scene(),i)}
    await go(5);await page.click('.lab-presets button:nth-child(2)');await wait(400)
    assert.match(await page.$eval('.lab-status',e=>e.textContent),/MÂU THUẪN/)
    await capture('05-contradiction');await page.click('.lab-presets button:nth-child(4)');await wait(2000)
    assert.match(await page.$eval('.lab-status',e=>e.textContent),/PHÙ HỢP/)
    report.checks.push('Lab mismatch and restructuring')
    report.frameSample=await page.evaluate(async()=>{
      const gaps=[];let last=performance.now();
      await new Promise(resolve=>{const frame=t=>{gaps.push(t-last);last=t;if(gaps.length<90)requestAnimationFrame(frame);else resolve()};requestAnimationFrame(frame)})
      gaps.shift();gaps.sort((a,b)=>a-b)
      return {medianMs:Math.round(gaps[Math.floor(gaps.length/2)]*10)/10,p95Ms:Math.round(gaps[Math.floor(gaps.length*.95)]*10)/10}
    })
    await go(6);assert.match(await page.$eval('svg[aria-labelledby="map-title map-description"]',e=>e.textContent),/Hoàng Sa.*Trường Sa/s)
    await page.click('.source-marker');await page.waitForSelector('dialog[open]');await capture('06-source')
    await page.keyboard.press('Escape');assert.equal(await page.$('dialog[open]'),null)
    assert.equal(await page.evaluate(()=>document.activeElement?.className),'source-marker')
    for(let i=0;i<3;i++)await page.click('[aria-label="Bằng chứng tiếp theo"]')
    await capture('06-evidence-4');report.checks.push('Both archipelagos; four evidence topics; source dialog Escape and focus return')
    await go(7)
    const token=await page.$('.lever-token'),socket=await page.$('.socket-0'),a=await token.boundingBox(),b=await socket.boundingBox()
    await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:18});await page.mouse.up()
    assert.equal(await page.$$eval('.policy-socket.filled',e=>e.length),1)
    await page.click('.lever-token:nth-child(2)');await page.click('.lever-token:nth-child(3)')
    assert.equal(await page.$$eval('.policy-socket.filled',e=>e.length),3)
    await capture('07-policies');report.checks.push('Policy token real drag, click install, three socket feedback')
    await page.setViewport({width:1920,height:1080,deviceScaleFactor:1});await go(0);await capture('00-wide');await go(6);await capture('06-wide')
    await page.setViewport({width:390,height:844,deviceScaleFactor:1,isMobile:true,hasTouch:true})
    for(let i=0;i<=8;i++){await go(i);await capture(`${String(i).padStart(2,'0')}-mobile`);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow')}
    report.checks.push('390×844 every scene and 1920×1080 hero/map')
    await go(1)
    const cdp=await page.createCDPSession(),touch=(type,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x:200,y,radiusX:3,radiusY:3}]})
    const beforeTouch=await page.evaluate(()=>scrollY)
    await touch('touchStart',690)
    for(let y=660;y>=190;y-=30){await touch('touchMove',y);await wait(16)}
    await touch('touchEnd',190);await wait(800)
    assert.ok(await page.evaluate(()=>scrollY)>beforeTouch+200,'Native mobile swipe scrolls the document')
    report.checks.push('Native touch swipe scrolls mobile; canvas does not trap gestures')
    await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await go(5);await capture('05-reduced')
    assert.equal(await page.$eval('.lab-overlay',e=>getComputedStyle(e).opacity),'1')
    report.checks.push('Reduced-motion scene navigation')
    await page.evaluate(()=>document.querySelector('canvas')?.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext());await wait(400)
    assert.ok(await page.$('.world-fallback'));report.checks.push('WebGL context-loss readable fallback')
    writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));assert.deepEqual(errors,[])
  }
  console.log(JSON.stringify(report,null,2))
} finally {await browser.close()}
