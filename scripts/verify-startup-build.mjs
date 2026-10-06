import {readFile} from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'

const html=await readFile('dist/index.html','utf8')
const entry=html.match(/<script[^>]+src="([^"]+\.js)"/)[1]
const preloads=[...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g)].map(match=>match[1])
assert.ok(preloads.some(file=>/WorldCanvas-/.test(file)),'world must preload with the page')
assert.ok(!preloads.some(file=>/AudioSynth/.test(file)),'audio must remain deferred')
const visited=new Set()
async function visit(file){
  if(visited.has(file))return
  visited.add(file)
  const code=await readFile(path.join('dist',file),'utf8')
  assert.ok(!/AudioSynth/.test(path.basename(file)),'initial static graph must not include audio')
  for(const match of code.matchAll(/(?:^|;)import\s*[^;]*?from["']([^"']+)["']/g)){
    const dependency=path.posix.resolve(path.posix.dirname(file),match[1])
    await visit(dependency)
  }
}
await visit(entry)
console.log(`Startup graph passed: ${visited.size} initial JS chunks; world preload; no eager audio.`)
