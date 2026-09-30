import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'

export async function captureDroneStage({tab,cdp,out,name,stage}) {
  const result=await tab.playwright.evaluate(()=>({
    width:innerWidth,height:innerHeight,canvases:document.querySelectorAll('canvas').length,
    image:document.querySelector('.case-illustration img')!==null,
    selected:[...document.querySelectorAll('.farm-stages button')].map(b=>b.getAttribute('aria-pressed')),
    title:document.querySelector('#farm-title')?.textContent,
    regions:['.farm-copy h2','.farm-description','.farm-stages','.farm-meaning','.farm-evidence','.case-navigation'].map(selector=>({selector,...document.querySelector(selector)?.getBoundingClientRect().toJSON()})),
  }))
  assert.equal(result.canvases,1)
  assert.equal(result.image,false,'Agriculture uses geometry, not the previous illustration')
  assert.equal(result.selected.filter(s=>s==='true').length,1)
  assert.equal(result.selected[stage],'true')
  for(const r of result.regions){
    assert.ok(r.left>=0&&r.right<=result.width&&r.top>70&&r.bottom<result.height-25,`${r.selector} stays inside viewport`)
  }
  for(let i=0;i<result.regions.length;i++)for(const b of result.regions.slice(i+1)){
    const a=result.regions[i]
    assert.ok(!(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top),`${a.selector} does not overlap ${b.selector}`)
  }
  const shot=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false})
  await writeFile(`${out}/${name}.png`,Buffer.from(shot.data,'base64'))
  await writeFile(`${out}/${name}.json`,JSON.stringify(result,null,2))
  return `${name}: stage ${stage}, one canvas, no raster illustration, no text/control overlap`
}
