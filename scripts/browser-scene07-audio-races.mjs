import assert from 'node:assert/strict'
import {launch} from './owl-guide-qa/browser.mjs'
import {writeFile} from 'node:fs/promises'
const wait=ms=>new Promise(r=>setTimeout(r,ms)),report=[]
const {browser,page,errors}=await launch({width:1440,height:900})
let held=[]
const check=(name,ok)=>{assert.ok(ok,name);report.push({name,pass:true})}
async function diagnostics(){return page.$eval('.flow-stage',e=>({...e.dataset}))}
async function pause(){await page.click('[aria-label="Mở mục lục"]');await page.click('.menu-settings button:nth-child(2)');await page.click('[aria-label="Đóng bảng"]');await wait(300)}
try{
 await page.setRequestInterception(true);page.on('request',r=>{if(r.url().includes('/Scene07AudioSynth.ts'))held.push(r);else void r.continue()})
 await page.goto('http://127.0.0.1:5180/',{waitUntil:'networkidle2'})
 await page.evaluate(()=>[...document.querySelectorAll('.mach-guide-welcome button')].find(e=>e.textContent.includes('Bỏ qua'))?.click());await page.focus('.thread-handle');await page.keyboard.press('Enter');await wait(900);await page.evaluate(()=>document.querySelector('.mach-guide-cue [data-action="dismiss"]')?.click())
 await page.evaluate(()=>{const e=document.querySelector('.flow-insertion');scrollTo(0,e.offsetTop+(e.offsetHeight-innerHeight)*.31)});await wait(1500)
 check('lazy Tone chunk held before initialization',held.length>0)
 await page.click('.flow-sound-dock button');await pause();check('pending start does not claim SOUND ON',await page.$eval('.flow-sound-dock button',e=>e.getAttribute('aria-pressed')==='false'))
 for(const r of held)await r.continue();held=[]
 await page.waitForFunction(()=>document.querySelector('.flow-sound-dock button').getAttribute('aria-pressed')==='true',{timeout:15000});await wait(500)
 check('deferred activation while paused emits no stale cue',+(await diagnostics()).audioRms===0)
 await pause();await wait(400);check('resume produces real output',+(await diagnostics()).audioRms>0)
 const other=await browser.newPage();await other.bringToFront();await wait(500)
 const hidden=await page.evaluate(()=>document.hidden);check('browser tab genuinely becomes hidden',hidden);check('hidden tab output is zero',+(await diagnostics()).audioRms===0)
 await page.bringToFront();await other.close();await wait(500);check('visible tab resumes enabled sound',+(await diagnostics()).audioRms>0)
 await page.evaluate(()=>{const e=document.querySelector('.flow-insertion');scrollTo(0,e.offsetTop+e.offsetHeight+10)});await wait(1000)
 check('leaving Scene07 silences enabled engine',+(await diagnostics()).audioRms===0)
 check('no activation or scheduling error',errors.length===0)
}catch(e){report.push({name:'failure',error:e.message});throw e}
finally{for(const r of held)await r.continue().catch(()=>{});await writeFile('.studio/qa/scene07/audio-races.json',JSON.stringify({report,errors},null,2));console.log(JSON.stringify({report,errors},null,2));await browser.close()}
