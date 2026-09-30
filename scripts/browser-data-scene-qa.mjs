import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'

export async function verifyDataScene({tab,cdp,out,name}) {
  const layout=await tab.playwright.evaluate(()=>({
    width:innerWidth,height:innerHeight,canvases:document.querySelectorAll('canvas').length,
    copy:document.querySelector('.copy-4')?.getBoundingClientRect().toJSON(),
    labels:[...document.querySelectorAll('.node-caption')].map(el=>({text:el.textContent,...el.getBoundingClientRect().toJSON()})),
  }))
  assert.equal(layout.canvases,1)
  assert.ok(layout.copy,'Scene 04 is visible')
  assert.equal(layout.labels.length,4)
  const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top
  for(const [i,label] of layout.labels.entries()) {
    assert.ok(label.left>=0&&label.right<=layout.width&&label.top>=96&&label.bottom<layout.height-50,`${label.text}: inside viewport`)
    assert.ok(!overlaps(label,layout.copy),`${label.text}: clear of scene copy`)
    for(const next of layout.labels.slice(i+1))assert.ok(!overlaps(label,next),'Labels do not overlap')
  }
  const image=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false})
  await writeFile(`${out}/${name}.png`,Buffer.from(image.data,'base64'))
  await writeFile(`${out}/${name}.json`,JSON.stringify(layout,null,2))
  return `${name}: four readable anchors, one canvas, no clipping or text overlap`
}
