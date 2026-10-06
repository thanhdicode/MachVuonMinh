import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import vm from 'node:vm'

const original=readFileSync('.studio/sketchbook-reference/canonical.html','utf8')
const derived=readFileSync('public/scene02-sketchbook/index.html','utf8')
const engine=html=>{const start=html.indexOf('const M=PAGES.length');return html.slice(start,html.indexOf('</script>',start))}
test('adaptation preserves the complete authored motion engine byte-for-byte',()=>{
  assert.equal(engine(derived),engine(original))
  new vm.Script(derived.match(/<script id="notebook-adapter-script">([\s\S]*?)<\/script>/)[1])
})
test('nine illustrated plates have local art, correct landing page and original circular sequence',()=>{
 const pages=JSON.parse(derived.match(/const PAGES=(\[[\s\S]*?\]);/)[1])
 assert.equal(pages.length,9)
 assert.deepEqual([6,7,8,0,1,2,3,4,5].map(i=>pages[i].id.slice(0,2)),['01','02','03','04','05','06','07','08','09'])
 for(const page of pages){assert.ok(existsSync('public/scene02-sketchbook/assets/'+page.file));assert.ok(page.text.length>20);assert.ok(page.source>=0&&page.source<5)}
})
test('all nine images retain transparency and the payload stays below 3 MB',()=>{
 const assets=JSON.parse(readFileSync('.studio/sketchbook-reference/asset-manifest.json','utf8'))
 assert.equal(assets.length,9)
 assert.ok(assets.reduce((n,a)=>n+a.webBytes,0)<3_000_000)
 for(const a of assets){assert.equal(a.alpha,true);assert.ok(Math.abs(a.width/a.height-1760/1240)<.02);assert.equal(createHash('sha256').update(readFileSync('public/scene02-sketchbook/assets/'+a.id+'.webp')).digest('hex'),a.sha256)}
})
test('derivative does not load the ThreeUI documentation or old V5 media',()=>{
 assert.doesNotMatch(derived,/<iframe|\/media\/scene02\//)
 assert.doesNotMatch(derived,/(?:src|href)="https:\/\/ublctydd/)
 assert.match(derived,/vietnamese-fonts\.css/)
})
