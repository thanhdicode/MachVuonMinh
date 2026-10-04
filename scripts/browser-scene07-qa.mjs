import {launch} from './owl-guide-qa/browser.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
const out='.studio/qa/scene07';await mkdir(out,{recursive:true})
const wait=ms=>new Promise(r=>setTimeout(r,ms))
const session=await launch({width:1440,height:900});const {page,browser,errors}=session
try{
 await page.goto('http://127.0.0.1:5180/',{waitUntil:'networkidle2'});console.log('loaded')
 const skip=await page.$('.mach-guide-welcome');if(skip){await page.evaluate(()=>{const b=[...document.querySelectorAll('.mach-guide-welcome button')].find(e=>e.textContent.includes('Bỏ qua'));b?.click()})}
 await page.focus('.thread-handle');await page.keyboard.press('Enter');console.log('unlocked')
 await wait(1500)
 const records=[]
 for(const [width,height] of [[1440,900],[1920,1080],[1366,768],[1024,768],[390,844]]){
  await page.setViewport({width,height,deviceScaleFactor:1});await wait(1000)
  if(width>=768){
   for(const progress of [.06,.16,.31,.42,.57,.69,.82,.90,.97]){
    await page.evaluate(p=>{const el=document.querySelector('.flow-insertion');window.scrollTo(0,el.offsetTop+(el.offsetHeight-innerHeight)*p)},progress);await wait(1300)
    const record=await page.evaluate(()=>({active:document.querySelector('.experience').className,progress:document.querySelector('.flow-stage').dataset.progress,beat:document.querySelector('.flow-stage').dataset.beat,reveal:document.querySelector('.flow-stage').dataset.reveal,triangles:document.querySelector('.flow-stage').dataset.triangles,calls:document.querySelector('.flow-stage').dataset.calls,overflow:document.documentElement.scrollWidth-innerWidth,canvas:document.querySelectorAll('canvas').length,stage:document.querySelector('.flow-stage').getBoundingClientRect().toJSON(),portraits:[...document.querySelectorAll('.flow-portrait')].map(e=>({opacity:getComputedStyle(e).opacity,box:e.getBoundingClientRect().toJSON()}))}))
    records.push({width,height,p:progress,...record});await page.screenshot({path:`${out}/${width}-${height}-${Math.round(progress*100)}.png`})
   }
  }else{
   for(const beat of [0,1,2,3,4]){await page.evaluate(b=>{const el=document.querySelector(`.flow-static-act[data-flow-act="${b}"]`);window.scrollTo(0,el.getBoundingClientRect().top+scrollY-100)},beat);await wait(700);await page.screenshot({path:`${out}/${width}-${height}-act${beat}.png`});records.push({width,height,beat,...await page.evaluate(()=>({active:document.querySelector('.experience').className,overflow:document.documentElement.scrollWidth-innerWidth,pin:!!document.querySelector('.flow-stage').closest('.pin-spacer')}))})}
  }
 }
 await writeFile(`${out}/frames.json`,JSON.stringify({records,errors},null,2));console.log(JSON.stringify({frames:records.length,errors,records:records.filter(r=>r.width===1440||r.width===390)},null,2))
}finally{await browser.close()}
