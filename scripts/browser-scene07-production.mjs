import assert from 'node:assert/strict'
import {writeFile} from 'node:fs/promises'
import {launch} from './owl-guide-qa/browser.mjs'

const wait=ms=>new Promise(r=>setTimeout(r,ms)),report=[]
const {page,browser,errors}=await launch({width:1440,height:900})
const check=(name,value)=>{assert.ok(value,name);report.push({name,pass:true})}
async function enter(p=.31){
 await page.goto('http://127.0.0.1:5181/',{waitUntil:'networkidle2'})
 await page.evaluate(()=>[...document.querySelectorAll('.mach-guide-welcome button')].find(e=>e.textContent.includes('Bỏ qua'))?.click())
 await page.focus('.thread-handle');await page.keyboard.press('Enter');await wait(1200)
 await page.evaluate(()=>document.querySelector('.mach-guide-cue [data-action="dismiss"]')?.click())
 await page.evaluate(p=>{const el=document.querySelector('.flow-insertion');scrollTo(0,el.offsetTop+(el.offsetHeight-innerHeight)*p)},p);await wait(1600)
}
try{
 await enter()
 check('production Scene07 uses one canvas',await page.evaluate(()=>document.querySelector('.experience').classList.contains('scene-7')&&document.querySelectorAll('canvas').length===1))
 await page.click('.flow-sound-dock button');await page.waitForFunction(()=>document.querySelector('.flow-sound-dock button')?.getAttribute('aria-pressed')==='true',{timeout:15000})
 await page.waitForFunction(()=>+document.querySelector('.flow-stage').dataset.audioRms>0,{timeout:5000})
 check('production lazy Tone chunk runs and emits output',await page.$eval('.flow-stage',e=>e.dataset.audioContext==='running'&&+e.dataset.audioRms>0))
 await page.click('.flow-sound-dock button')
 check('production has no browser errors',errors.length===0)
 const extension=await page.evaluate(()=>{const canvas=document.querySelector('canvas');const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');const extension=gl?.getExtension('WEBGL_lose_context');extension?.loseContext();return !!extension})
 check('context loss was exercised',extension)
 await page.waitForSelector('.world-fallback');await wait(500)
 check('context-loss SVG and physical gesture remain usable',await page.evaluate(()=>!!document.querySelector('.world-fallback svg path')&&getComputedStyle(document.querySelector('.flow-stage .physical-icon')).display!=='none'))
 await page.focus('.flow-stage [data-kind="work"]');await page.keyboard.press('End')
 check('fallback keyboard changes worker consequence',await page.$eval('.flow-stage [data-kind="work"]',e=>e.getAttribute('aria-label').includes('Giám sát')))
 await page.screenshot({path:'.studio/qa/scene07/context-loss.png'})
 await page.setRequestInterception(true)
 page.on('request',request=>{if(request.url().includes('/images/scene07/'))request.respond({status:404,contentType:'text/plain',body:'QA simulated missing portrait'});else request.continue()})
 await enter()
 check('missing portrait was exercised',await page.$eval('.flow-portrait img',e=>e.complete&&e.naturalWidth===0))
 check('missing assets retain readable story and input',await page.evaluate(()=>document.querySelector('.flow-stage .act-1 .flow-question').innerText.length>10&&document.querySelector('.experience').classList.contains('scene-7')&&!!document.querySelector('.flow-stage [data-kind="work"]')))
 await page.focus('.flow-stage [data-kind="work"]');await page.keyboard.press('Home');await page.keyboard.press('End')
 check('missing assets retain working gesture',await page.$eval('.flow-stage [data-kind="work"]',e=>e.getAttribute('aria-label').includes('Giám sát')))
 await page.screenshot({path:'.studio/qa/scene07/missing-portraits.png'})
 const unexpected=errors.filter(e=>!e.includes('404 (Not Found)'))
 check('only simulated missing-asset errors occur',unexpected.length===0)
}finally{
 await writeFile('.studio/qa/scene07/production.json',JSON.stringify({report,errors},null,2));console.log(JSON.stringify({report,errors},null,2));await browser.close()
}
