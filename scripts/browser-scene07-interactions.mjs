import assert from 'node:assert/strict'
import {launch} from './owl-guide-qa/browser.mjs'
import {writeFile} from 'node:fs/promises'
const wait=ms=>new Promise(r=>setTimeout(r,ms)),out='.studio/qa/scene07',report=[]
const {page,browser,errors}=await launch({width:1440,height:900})
page.on('console',message=>{if(message.type()==='warn')console.log(message.text())})
page.on('pageerror',error=>console.log(error.stack))
const check=(name,value)=>{assert.ok(value,name);report.push({name,pass:true})}
async function frame(p){await page.evaluate(p=>{const e=document.querySelector('.flow-insertion');scrollTo(0,e.offsetTop+(e.offsetHeight-innerHeight)*p)},p);await wait(1200)}
async function audio(){return page.evaluate(()=>({...document.querySelector('.flow-stage').dataset}))}
async function menuPause(){await page.click('[aria-label="Mở mục lục"]');await page.click('.menu-settings button:nth-child(2)');await page.click('[aria-label="Đóng bảng"]');await wait(700)}
async function label(kind){return page.$eval(`.flow-stage [data-kind="${kind}"]`,e=>e.getAttribute('aria-label'))}
try{
 await page.goto('http://127.0.0.1:5180/',{waitUntil:'networkidle2'})
 await page.evaluate(()=>[...document.querySelectorAll('.mach-guide-welcome button')].find(e=>e.textContent.includes('Bỏ qua'))?.click());await page.focus('.thread-handle');await page.keyboard.press('Enter');await wait(1200)
 await page.evaluate(()=>document.querySelector('.mach-guide-cue [data-action="dismiss"]')?.click())
 await frame(.31);const before=await label('work');const button=await page.$('.flow-stage [data-kind="work"]'),box=await button.boundingBox();await page.mouse.move(box.x+36,box.y+36);await page.mouse.down();await page.mouse.move(box.x+180,box.y+36,{steps:10});await page.mouse.up();check('worker physical drag changes human role',before!==await label('work'))
 await page.focus('.flow-stage [data-kind="work"]');await page.keyboard.press('Home');check('worker keyboard Home restores thao tác',(await label('work')).includes('Thao tác'))
 await page.keyboard.press('End');check('worker keyboard End gives giám sát',(await label('work')).includes('Giám sát'))
 await page.click('.flow-sound-dock button');await page.waitForFunction(()=>document.querySelector('.flow-sound-dock button')?.getAttribute('aria-pressed')==='true',{timeout:15000});await wait(350);let d=await audio();console.log('audio diagnostics',d);check('Tone context running and sound ON after user gesture',d.audioContext==='running'&&await page.$eval('.flow-sound-dock button',e=>e.getAttribute('aria-pressed')==='true'));check('real audio output nonzero',+d.audioRms>0)
 await menuPause();d=await audio();check('pause silences scene output',+d.audioRms<.0001);await page.screenshot({path:`${out}/paused-a.png`});await wait(1200);await page.screenshot({path:`${out}/paused-b.png`})
 await menuPause();await wait(500);check('resume restores scene output',+(await audio()).audioRms>0)
 await frame(.57);await page.focus('.flow-stage [data-kind="key"]');await page.keyboard.press('Home');check('glass key PRIVATE',(await label('key')).includes('PRIVATE'));await page.keyboard.press('ArrowRight');check('glass key SHARED',(await label('key')).includes('SHARED'));await page.keyboard.press('ArrowRight');check('glass key CONTROLLED ACCESS',(await label('key')).includes('CONTROLLED ACCESS'))
 await frame(.82);await page.focus('.flow-stage [data-kind="splitter"]');await page.keyboard.press('Home');const first=await label('splitter');await page.keyboard.press('End');check('splitter routes value qualitatively',first!==await label('splitter'))
 await frame(.97);check('finale preserves three human portraits',await page.evaluate(()=>[...document.querySelectorAll('.flow-portrait')].every(e=>+getComputedStyle(e).opacity>.8)))
 await frame(.16);check('reverse hides QHSX reveal',await page.$eval('.flow-stage',e=>e.dataset.reveal==='false'))
 await page.click('.flow-sound-dock button');await wait(500);check('mute silences output',+(await audio()).audioRms<.0001)
 await frame(1);await page.mouse.wheel({deltaY:1200});await wait(1000);check('native exit reaches synthesis',await page.$eval('.experience',e=>e.classList.contains('scene-8')))
 await page.click('[aria-label="Mở mục lục"]');await page.evaluate(()=>[...document.querySelectorAll('.chapter-menu button')].find(e=>e.textContent.includes('Ba đời sống'))?.click());await wait(1600);check('native menu direct entry reaches Scene07',await page.$eval('.experience',e=>e.classList.contains('scene-7')))
 await page.setViewport({width:390,height:844});await wait(1800);console.log('mobile layout',await page.$eval('.flow-insertion',e=>({layout:e.dataset.layout,pin:e.querySelector('.flow-stage').closest('.pin-spacer')?.outerHTML.slice(0,180),media:matchMedia('(max-width:767px)').matches})));check('mobile no pin',await page.$eval('.flow-stage',e=>!e.closest('.pin-spacer')));check('mobile retains Scene07 after resize',await page.$eval('.experience',e=>e.classList.contains('scene-7')))
 const mobile=await page.$('.flow-static-act[data-flow-act="2"] [data-kind="key"]');await mobile.scrollIntoView();await mobile.click();check('mobile tap changes glass key',await mobile.evaluate(e=>e.getAttribute('aria-label').includes('PRIVATE')))
 await page.setViewport({width:1440,height:900});await wait(1400);check('desktop pin returns after resize',await page.$eval('.flow-stage',e=>!!e.closest('.pin-spacer')))
 await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await wait(1200);check('reduced motion uses vertical unpinned story',await page.$eval('.flow-insertion',e=>e.dataset.layout==='vertical'&&!e.querySelector('.flow-stage').closest('.pin-spacer')))
 check('one WebGL canvas and no overflow',await page.evaluate(()=>document.querySelectorAll('canvas').length===1&&document.documentElement.scrollWidth===innerWidth));check('no browser errors',errors.length===0)
}catch(e){report.push({name:'failure',error:e.message});await page.screenshot({path:`${out}/interaction-failure.png`});throw e}
finally{await writeFile(`${out}/interactions.json`,JSON.stringify({report,errors},null,2));console.log(JSON.stringify({report,errors},null,2));await browser.close()}
