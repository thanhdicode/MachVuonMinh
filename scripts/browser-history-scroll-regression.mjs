import assert from 'node:assert/strict'
import {mkdir,writeFile} from 'node:fs/promises'
import {launch} from './owl-guide-qa/browser.mjs'

const tag=process.argv.includes('--before')?'before':'after',out='.studio/qa/history-scroll'
await mkdir(out,{recursive:true})
const wait=ms=>new Promise(r=>setTimeout(r,ms)),records=[],checks=[]
const {page,browser,errors}=await launch({width:1330,height:933})
const check=(name,value)=>{checks.push({name,pass:!!value});assert.ok(value,name)}
async function snapshot(label){
 const data=await page.evaluate(()=>{
  const bridge=document.querySelector('.history-bridge'),figure=bridge.querySelector('[data-label-era="0"] .history-figure'),style=getComputedStyle(figure),box=figure.getBoundingClientRect(),clip=style.clipPath
  const values=clip.startsWith('inset(')?clip.slice(6,-1).split(/\s+/).map(parseFloat):[],left=values.length===4?values[3]:values.length===2?values[1]:values[0]||0
  return {scrollY,layout:bridge.dataset.layout,era:bridge.dataset.activeEra,figureLeft:box.left,visibleLeft:Math.max(0,box.left+left),clip,transform:getComputedStyle(document.querySelector('.atlas-world')).transform,overflow:document.documentElement.scrollWidth-innerWidth,canvas:document.querySelectorAll('canvas').length,caption:bridge.querySelector('.history-curator h3').innerText}
 })
 records.push({label,...data});await page.screenshot({path:`${out}/${tag}-${label}.png`});return data
}
try{
 await page.goto('http://127.0.0.1:5180/',{waitUntil:'networkidle2'})
 await page.evaluate(()=>[...document.querySelectorAll('.mach-guide-welcome button')].find(e=>e.textContent.includes('Bỏ qua'))?.click())
 await page.focus('.thread-handle');await page.keyboard.press('Enter');await wait(1000)
 await page.evaluate(()=>{document.querySelector('.mach-guide-cue [data-action="dismiss"]')?.click();const el=document.querySelector('.history-insertion');scrollTo(0,el.getBoundingClientRect().top+scrollY+1)})
 await wait(1600);const start=await snapshot('start')
 await page.mouse.move(850,580);await page.mouse.wheel({deltaY:240});await wait(1600);const forward=await snapshot('forward')
 check('native wheel pans the artwork',start.figureLeft-forward.figureLeft>150)
 check('visible artwork edge pans instead of sticking to a vertical crop',start.visibleLeft-forward.visibleLeft>150)
 await page.mouse.wheel({deltaY:-240});await wait(1600);const back=await snapshot('reverse')
 check('reverse scroll restores the original artwork position',Math.abs(back.figureLeft-start.figureLeft)<3)
 for(const [width,height] of [[1024,768],[1366,768],[1440,900]]){
  await page.setViewport({width,height});await wait(1200)
  await page.evaluate(()=>{const el=document.querySelector('.history-insertion');scrollTo(0,el.getBoundingClientRect().top+scrollY+200)})
  await wait(1600);const data=await snapshot(`${width}-${height}`)
  check(`${width}px has no artificial figure crop`,Math.abs(data.visibleLeft-Math.max(0,data.figureLeft))<.5)
  check(`${width}px retains one canvas and no overflow`,data.canvas===1&&data.overflow===0)
 }
 check('no browser errors',errors.length===0)
}finally{
 await writeFile(`${out}/${tag}.json`,JSON.stringify({records,checks,errors},null,2));console.log(JSON.stringify({records,checks,errors},null,2));await browser.close()
}
